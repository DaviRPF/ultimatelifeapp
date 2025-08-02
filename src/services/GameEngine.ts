import { Task, Hero, Skill, Characteristic, DefaultAchievement, CustomAchievement, Reward } from '../types';
import StorageService from './StorageService';
import XPCalculator from './XPCalculator';

class GameEngine {
  private static instance: GameEngine;
  private storageService: StorageService;
  private xpCalculator: XPCalculator;

  private constructor() {
    this.storageService = StorageService.getInstance();
    this.xpCalculator = XPCalculator.getInstance();
  }

  static getInstance(): GameEngine {
    if (!GameEngine.instance) {
      GameEngine.instance = new GameEngine();
    }
    return GameEngine.instance;
  }

  // Complete a task and update all game state
  async completeTask(taskId: string): Promise<{
    xpGained: number;
    goldGained: number;
    levelUp: boolean;
    newLevel?: number;
    achievementsUnlocked: string[];
  }> {
    const task = this.storageService.getTaskById(taskId);
    if (!task || task.completed) {
      throw new Error('Task not found or already completed');
    }

    const hero = this.storageService.getHero();
    if (!hero) {
      throw new Error('Hero data not found');
    }

    // Calculate XP and Gold
    const { xp: baseXP, gold: baseGold } = this.xpCalculator.calculateTaskXP(
      task.difficulty,
      task.importance,
      task.fear
    );

    // Apply XP multiplier from achievements
    const xpGained = this.xpCalculator.applyXPMultiplier(baseXP, hero.xpMultiplier);
    const goldGained = baseGold;

    // Check for level up
    const oldLevel = hero.level;
    const newTotalXP = hero.xp + xpGained;
    const newLevel = this.xpCalculator.calculateLevelFromXP(newTotalXP);
    const levelUp = newLevel > oldLevel;

    // Update hero stats
    const newGold = hero.gold + goldGained;
    await this.storageService.updateHero({
      xp: newTotalXP,
      level: newLevel,
      gold: newGold
    });

    // Update task
    await this.storageService.updateTask(taskId, {
      completed: true,
      completedAt: new Date().toISOString()
    });

    // Update skills
    await this.updateSkillsFromTask(task, true, xpGained);

    // Update habit streak if applicable
    if (task.habit.enabled) {
      await this.updateHabitStreak(taskId, true);
    }

    // Check and unlock achievements
    const achievementsUnlocked = await this.checkAndUnlockAchievements();

    return {
      xpGained,
      goldGained,
      levelUp,
      newLevel: levelUp ? newLevel : undefined,
      achievementsUnlocked
    };
  }

  // Fail a task and update game state
  async failTask(taskId: string): Promise<{
    skillsAffected: string[];
    habitReset: boolean;
  }> {
    const task = this.storageService.getTaskById(taskId);
    if (!task || task.completed || task.failed) {
      throw new Error('Task not found, already completed, or already failed');
    }

    // Update task
    await this.storageService.updateTask(taskId, {
      failed: true
    });

    // Update skills (negative impact)
    const skillsAffected = await this.updateSkillsFromTask(task, false, 0);

    // Reset habit streak if applicable
    let habitReset = false;
    if (task.habit.enabled) {
      await this.updateHabitStreak(taskId, false);
      habitReset = true;
    }

    return {
      skillsAffected,
      habitReset
    };
  }

  // Update skills based on task completion/failure
  private async updateSkillsFromTask(task: Task, completed: boolean, taskXP: number): Promise<string[]> {
    const affectedSkills: string[] = [];
    const allSkills = [...(task.increasingSkills || []), ...(task.decreasingSkills || [])];
    
    console.log('updateSkillsFromTask called with:', {
      taskTitle: task.title,
      completed,
      taskXP,
      increasingSkills: task.increasingSkills,
      decreasingSkills: task.decreasingSkills,
      characteristics: task.characteristics,
      allSkills
    });

    for (const skillName of allSkills) {
      let skill = this.storageService.getSkill(skillName);
      
      // Create skill if it doesn't exist
      if (!skill) {
        const skillType = (task.increasingSkills || []).includes(skillName) ? 'increasing' : 'decreasing';
        skill = {
          level: 1,
          xp: 0,
          type: skillType,
          characteristics: (task.characteristics || []).filter(char => 
            // Associate characteristics that are also in the task
            (task.characteristics || []).includes(char)
          )
        };
      }

      // Calculate skill XP change
      const skillXPChange = this.xpCalculator.calculateSkillXP(taskXP, skill.type, completed);
      const newSkillXP = Math.max(0, skill.xp + skillXPChange);
      const newSkillLevel = this.xpCalculator.calculateSkillLevel(newSkillXP);

      // Update skill
      await this.storageService.updateSkill(skillName, {
        ...skill,
        xp: newSkillXP,
        level: newSkillLevel
      });

      affectedSkills.push(skillName);
    }

    // Update characteristics based on skills
    await this.updateCharacteristicsFromSkills(task.characteristics);

    return affectedSkills;
  }

  // Update characteristics based on associated skills
  private async updateCharacteristicsFromSkills(characteristicNames: string[]): Promise<void> {
    for (const charName of characteristicNames) {
      // Get all skills associated with this characteristic
      const allSkills = this.storageService.getSkills();
      const associatedSkills = Object.entries(allSkills)
        .filter(([_, skill]) => (skill.characteristics || []).includes(charName))
        .map(([_, skill]) => skill);

      if (associatedSkills.length > 0) {
        const charXP = this.xpCalculator.calculateCharacteristicXP(associatedSkills);
        const charLevel = this.xpCalculator.calculateSkillLevel(charXP);

        const characteristic: Characteristic = {
          level: charLevel,
          xp: charXP,
          associatedSkills: associatedSkills.map((_, index) => 
            Object.keys(allSkills).filter(([_, skill]) => 
              (skill.characteristics || []).includes(charName)
            )[index]
          ).filter(Boolean)
        };

        await this.storageService.updateCharacteristic(charName, characteristic);
      }
    }
  }

  // Update habit streak
  private async updateHabitStreak(taskId: string, completed: boolean): Promise<void> {
    const task = this.storageService.getTaskById(taskId);
    if (!task || !task.habit.enabled) return;

    const today = new Date().toDateString();
    const lastCompleted = task.habit.lastCompletedDate;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = task.habit.currentStreak;

    if (completed) {
      // Check if this is a consecutive day
      if (!lastCompleted || lastCompleted === yesterday.toDateString()) {
        newStreak = task.habit.currentStreak + 1;
      } else if (lastCompleted !== today) {
        // Reset streak if gap in days (but not if completing same day again)
        newStreak = 1;
      }

      await this.storageService.updateTask(taskId, {
        habit: {
          ...task.habit,
          currentStreak: newStreak,
          lastCompletedDate: today
        }
      });
    } else {
      // Failed - reset streak
      await this.storageService.updateTask(taskId, {
        habit: {
          ...task.habit,
          currentStreak: 0,
          lastCompletedDate: ''
        }
      });
    }
  }

  // Check and unlock achievements
  private async checkAndUnlockAchievements(): Promise<string[]> {
    const achievements = this.storageService.getAchievements();
    const hero = this.storageService.getHero();
    const tasks = this.storageService.getTasks();
    const skills = this.storageService.getSkills();
    const characteristics = this.storageService.getCharacteristics();
    
    if (!hero) return [];

    const unlockedAchievements: string[] = [];
    let xpMultiplierChanged = false;

    // Check default achievements
    for (const achievement of achievements.default) {
      if (achievement.unlocked) continue;

      let shouldUnlock = false;

      switch (achievement.condition.type) {
        case 'level':
          shouldUnlock = hero.level >= achievement.condition.target;
          break;
        case 'tasks_completed':
          const completedTasks = tasks.filter(t => t.completed).length;
          shouldUnlock = completedTasks >= achievement.condition.target;
          break;
        case 'gold_earned':
          shouldUnlock = hero.gold >= achievement.condition.target;
          break;
      }

      if (shouldUnlock) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        unlockedAchievements.push(achievement.title);
        
        // Update hero XP multiplier
        const newMultiplier = hero.xpMultiplier + (achievement.xpMultiplier - 1);
        await this.storageService.updateHero({ xpMultiplier: newMultiplier });
        xpMultiplierChanged = true;
      }
    }

    // Check custom achievements
    for (const achievement of achievements.custom) {
      if (achievement.unlocked) continue;

      let allConditionsMet = true;

      for (const condition of achievement.conditions) {
        let conditionMet = false;

        switch (condition.type) {
          case 'task_executions':
            const completedTasks = tasks.filter(t => t.completed).length;
            conditionMet = completedTasks >= condition.target;
            break;
          case 'skill_level':
            if (condition.skillName) {
              const skill = skills[condition.skillName];
              conditionMet = skill && skill.level >= condition.target;
            }
            break;
          case 'characteristic_level':
            if (condition.characteristicName) {
              const characteristic = characteristics[condition.characteristicName];
              conditionMet = characteristic && characteristic.level >= condition.target;
            }
            break;
        }

        if (!conditionMet) {
          allConditionsMet = false;
          break;
        }
      }

      if (allConditionsMet) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date().toISOString();
        unlockedAchievements.push(achievement.title);
      }
    }

    // Save updated achievements
    if (unlockedAchievements.length > 0) {
      await this.storageService.updateAchievements(achievements);
    }

    return unlockedAchievements;
  }

  // Process auto-fail tasks
  async processAutoFailTasks(): Promise<string[]> {
    const tasks = this.storageService.getTasks();
    const autoFailedTasks: string[] = [];

    for (const task of tasks) {
      if (!task.completed && !task.failed && this.xpCalculator.shouldTaskAutoFail(task)) {
        await this.failTask(task.id);
        autoFailedTasks.push(task.title);
      }
    }

    return autoFailedTasks;
  }

  // Get hero stats with calculated values
  getHeroStats(): {
    level: number;
    xp: number;
    gold: number;
    xpMultiplier: number;
    xpForNextLevel: number;
    xpProgress: number;
    totalTasksCompleted: number;
    totalGoldEarned: number;
  } | null {
    const hero = this.storageService.getHero();
    const tasks = this.storageService.getTasks();
    
    if (!hero) return null;

    const xpForNextLevel = this.xpCalculator.calculateXPForNextLevel(hero.level);
    const xpProgress = this.xpCalculator.calculateLevelProgress(hero.xp, hero.level);
    const totalTasksCompleted = tasks.filter(t => t.completed).length;

    return {
      level: hero.level,
      xp: hero.xp,
      gold: hero.gold,
      xpMultiplier: hero.xpMultiplier,
      xpForNextLevel,
      xpProgress,
      totalTasksCompleted,
      totalGoldEarned: hero.gold // Assuming current gold is total earned for now
    };
  }

  // Create a new skill automatically when typed in task creation
  async createSkillIfNotExists(skillName: string, type: 'increasing' | 'decreasing', characteristics: string[]): Promise<void> {
    const existingSkill = this.storageService.getSkill(skillName);
    
    if (!existingSkill && characteristics.length > 0) {
      const newSkill: Skill = {
        level: 1,
        xp: 0,
        type,
        characteristics
      };
      
      await this.storageService.updateSkill(skillName, newSkill);
    }
  }

  // Create a new skill manually from Skills screen
  async createSkill(skillName: string, type: 'increasing' | 'decreasing', characteristics: string[]): Promise<void> {
    const existingSkill = this.storageService.getSkill(skillName);
    
    if (existingSkill) {
      throw new Error('Skill already exists');
    }

    if (characteristics.length === 0) {
      throw new Error('At least one characteristic is required');
    }

    const newSkill: Skill = {
      level: 1,
      xp: 0,
      type,
      characteristics
    };
    
    await this.storageService.updateSkill(skillName, newSkill);

    // Create/update associated characteristics
    for (const characteristicName of characteristics) {
      const existingChar = this.storageService.getCharacteristic(characteristicName);
      
      if (existingChar) {
        // Add this skill to the characteristic's associated skills
        if (!(existingChar.associatedSkills || []).includes(skillName)) {
          await this.storageService.updateCharacteristic(characteristicName, {
            ...existingChar,
            associatedSkills: [...(existingChar.associatedSkills || []), skillName]
          });
        }
      } else {
        // Create new characteristic
        const newCharacteristic: Characteristic = {
          level: 1,
          xp: 0,
          associatedSkills: [skillName]
        };
        
        await this.storageService.updateCharacteristic(characteristicName, newCharacteristic);
      }
    }
  }

  // Update an existing skill
  async updateSkill(skillName: string, type: 'increasing' | 'decreasing', characteristics: string[]): Promise<void> {
    const existingSkill = this.storageService.getSkill(skillName);
    
    if (!existingSkill) {
      throw new Error('Skill not found');
    }

    if (characteristics.length === 0) {
      throw new Error('At least one characteristic is required');
    }

    // Update the skill
    const updatedSkill: Skill = {
      ...existingSkill,
      type,
      characteristics
    };
    
    await this.storageService.updateSkill(skillName, updatedSkill);

    // Remove this skill from old characteristics that are no longer associated
    const allCharacteristics = this.storageService.getCharacteristics();
    for (const [charName, char] of Object.entries(allCharacteristics)) {
      if ((char.associatedSkills || []).includes(skillName) && !characteristics.includes(charName)) {
        await this.storageService.updateCharacteristic(charName, {
          ...char,
          associatedSkills: (char.associatedSkills || []).filter(s => s !== skillName)
        });
      }
    }

    // Add this skill to new characteristics
    for (const characteristicName of characteristics) {
      const existingChar = this.storageService.getCharacteristic(characteristicName);
      
      if (existingChar) {
        // Add this skill to the characteristic's associated skills if not already there
        if (!(existingChar.associatedSkills || []).includes(skillName)) {
          await this.storageService.updateCharacteristic(characteristicName, {
            ...existingChar,
            associatedSkills: [...(existingChar.associatedSkills || []), skillName]
          });
        }
      } else {
        // Create new characteristic
        const newCharacteristic: Characteristic = {
          level: 1,
          xp: 0,
          associatedSkills: [skillName]
        };
        
        await this.storageService.updateCharacteristic(characteristicName, newCharacteristic);
      }
    }
  }

  // Delete a skill
  async deleteSkill(skillName: string): Promise<void> {
    const existingSkill = this.storageService.getSkill(skillName);
    
    if (!existingSkill) {
      throw new Error('Skill not found');
    }

    // Remove this skill from all associated characteristics
    const allCharacteristics = this.storageService.getCharacteristics();
    for (const [charName, char] of Object.entries(allCharacteristics)) {
      if ((char.associatedSkills || []).includes(skillName)) {
        const updatedAssociatedSkills = (char.associatedSkills || []).filter(s => s !== skillName);
        
        if (updatedAssociatedSkills.length === 0) {
          // If no more skills associated, delete the characteristic
          await this.storageService.deleteCharacteristic(charName);
        } else {
          // Update the characteristic
          await this.storageService.updateCharacteristic(charName, {
            ...char,
            associatedSkills: updatedAssociatedSkills
          });
        }
      }
    }

    // Delete the skill
    await this.storageService.deleteSkill(skillName);
  }

  // Delete a characteristic
  async deleteCharacteristic(characteristicName: string): Promise<void> {
    const existingChar = this.storageService.getCharacteristic(characteristicName);
    
    if (!existingChar) {
      throw new Error('Characteristic not found');
    }

    // Remove this characteristic from all associated skills
    const allSkills = this.storageService.getSkills();
    for (const [skillName, skill] of Object.entries(allSkills)) {
      if ((skill.characteristics || []).includes(characteristicName)) {
        const updatedCharacteristics = (skill.characteristics || []).filter(c => c !== characteristicName);
        
        if (updatedCharacteristics.length === 0) {
          // If no more characteristics, delete the skill
          await this.storageService.deleteSkill(skillName);
        } else {
          // Update the skill
          await this.storageService.updateSkill(skillName, {
            ...skill,
            characteristics: updatedCharacteristics
          });
        }
      }
    }

    // Delete the characteristic
    await this.storageService.deleteCharacteristic(characteristicName);
  }

  // Create a standalone characteristic (not associated with any skill initially)
  async createStandaloneCharacteristic(characteristicName: string): Promise<void> {
    const existingChar = this.storageService.getCharacteristic(characteristicName);
    
    if (existingChar) {
      throw new Error('Characteristic already exists');
    }

    const newCharacteristic: Characteristic = {
      level: 1,
      xp: 0,
      associatedSkills: []
    };
    
    await this.storageService.updateCharacteristic(characteristicName, newCharacteristic);
  }

  // Get all app data
  async getAppData() {
    return this.storageService.getAppData();
  }

  // Create a new task
  async createTask(taskData: Omit<Task, 'id' | 'xp' | 'createdAt' | 'completed' | 'failed' | 'completedAt'>): Promise<void> {
    // Calculate XP for the task
    const { xp } = this.xpCalculator.calculateTaskXP(
      taskData.difficulty,
      taskData.importance,
      taskData.fear
    );

    // Create the task with generated ID and calculated XP
    const task: Task = {
      ...taskData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      xp,
      createdAt: new Date().toISOString(),
      completed: false,
      failed: false,
      completedAt: '',
    };

    // Auto-create skills if they don't exist
    for (const skillName of taskData.skills) {
      const isIncreasing = taskData.increasingSkills.includes(skillName);
      const isDecreasing = taskData.decreasingSkills.includes(skillName);
      const skillType = isIncreasing ? 'increasing' : (isDecreasing ? 'decreasing' : 'increasing');
      
      await this.createSkillIfNotExists(skillName, skillType, taskData.characteristics);
    }

    // Save the task
    await this.storageService.addTask(task);
  }

  // Create a new reward
  async createReward(rewardData: Omit<Reward, 'id' | 'purchased' | 'timePurchased' | 'createdAt'>): Promise<void> {
    const reward: Reward = {
      ...rewardData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      purchased: false,
      timePurchased: '',
      createdAt: new Date().toISOString(),
    };

    await this.storageService.addReward(reward);
  }

  // Purchase a reward
  async purchaseReward(rewardId: string): Promise<{ success: boolean; message: string }> {
    const reward = this.storageService.getRewards().find(r => r.id === rewardId);
    const hero = this.storageService.getHero();
    
    if (!reward) {
      return { success: false, message: 'Reward not found' };
    }
    
    if (reward.purchased) {
      return { success: false, message: 'Reward already purchased' };
    }
    
    if (!hero) {
      return { success: false, message: 'Hero data not found' };
    }
    
    if (hero.gold < reward.cost) {
      return { success: false, message: 'Insufficient gold' };
    }
    
    // Deduct gold and mark reward as purchased
    await this.storageService.updateHero({
      gold: hero.gold - reward.cost
    });
    
    await this.storageService.updateReward(rewardId, {
      purchased: true,
      timePurchased: new Date().toISOString()
    });
    
    return { success: true, message: 'Reward purchased successfully!' };
  }
}

export default GameEngine;