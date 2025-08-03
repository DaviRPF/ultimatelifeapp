import { Task, Hero, Skill, Characteristic, DefaultAchievement, CustomAchievement, Reward, Quest, BinaryTaskEntry } from '../types';
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
    if (!task) {
      throw new Error('Task not found');
    }
    
    // For non-infinite tasks, check if already completed
    if (!task.infinite && task.completed) {
      throw new Error('Task already completed');
    }

    // For numeric tasks, validate that minimum target was reached
    if (task.taskType === 'numeric' && task.numericConfig) {
      const currentDayValue = task.currentDayValue || 0;
      if (currentDayValue < task.numericConfig.minimumTarget) {
        throw new Error(`Minimum target not reached. Current: ${currentDayValue}, Required: ${task.numericConfig.minimumTarget}`);
      }
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

    // Update task (for infinite tasks, don't mark as completed permanently)
    if (task.infinite) {
      // For infinite tasks, add completion count but keep task active
      const completionCount = (task as any).completionCount || 0;
      const updateData: any = {
        completionCount: completionCount + 1,
        lastCompletedAt: new Date().toISOString()
      };
      
      // For numeric tasks, reset daily values after completion
      if (task.taskType === 'numeric') {
        updateData.currentDayValue = 0;
        updateData.pendingValue = 0;
      }
      
      await this.storageService.updateTask(taskId, updateData);
    } else {
      // For normal tasks, mark as completed
      const updateData: any = {
        completed: true,
        completedAt: new Date().toISOString()
      };
      
      // For numeric tasks, preserve final values
      if (task.taskType === 'numeric') {
        updateData.currentDayValue = task.currentDayValue;
        updateData.pendingValue = 0;
      }
      
      await this.storageService.updateTask(taskId, updateData);
    }

    // Update skills and their characteristics
    await this.updateSkillsFromTask(task, true, xpGained);

    // Update habit streak if applicable
    if (task.habit.enabled) {
      await this.updateHabitStreak(taskId, true);
    }

    // Save binary task history entry for completion
    const now = new Date();
    const binaryEntry: BinaryTaskEntry = {
      id: `${task.id}_${now.getTime()}`,
      taskId: task.id,
      status: 'completed',
      date: now.toISOString().split('T')[0],
      timestamp: now.toISOString(),
      xpGained,
      goldGained
    };
    await this.storageService.addBinaryTaskEntry(binaryEntry);

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
    if (!task) {
      throw new Error('Task not found');
    }
    
    // For non-infinite tasks, check if already completed/failed
    if (!task.infinite && (task.completed || task.failed)) {
      throw new Error('Task already completed or failed');
    }

    // Update task - only mark as failed if not infinite
    if (!task.infinite) {
      await this.storageService.updateTask(taskId, {
        failed: true
      });
    }

    // Save binary task history entry for failure
    const now = new Date();
    const binaryEntry: BinaryTaskEntry = {
      id: `${task.id}_${now.getTime()}`,
      taskId: task.id,
      status: 'failed',
      date: now.toISOString().split('T')[0],
      timestamp: now.toISOString(),
      xpGained: 0,
      goldGained: 0
    };
    await this.storageService.addBinaryTaskEntry(binaryEntry);

    // Update skills and characteristics (negative impact)
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

  // Complete a quest and update all game state
  async completeQuest(questId: string): Promise<{
    xpGained: number;
    goldGained: number;
    levelUp: boolean;
    newLevel?: number;
    achievementsUnlocked: string[];
    skillsAffected: string[];
  }> {
    const quest = this.storageService.getQuestById(questId);
    if (!quest || quest.status === 'completed') {
      throw new Error('Quest not found or already completed');
    }

    const hero = this.storageService.getHero();
    if (!hero) {
      throw new Error('Hero data not found');
    }

    // Get quest rewards
    const xpGained = quest.rewards.xp;
    const goldGained = quest.rewards.gold;

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

    // Update quest status
    await this.storageService.updateQuest(questId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      progress: 100
    });

    // Update skills associated with quest
    const skillsAffected = await this.updateSkillsFromQuest(quest, xpGained);

    // Check and unlock achievements
    const achievementsUnlocked = await this.checkAndUnlockAchievements();

    return {
      xpGained,
      goldGained,
      levelUp,
      newLevel: levelUp ? newLevel : undefined,
      achievementsUnlocked,
      skillsAffected
    };
  }

  // Update characteristics based on quest completion (changed from skills)
  private async updateSkillsFromQuest(quest: Quest, questXP: number): Promise<string[]> {
    // Now quests affect characteristics instead of skills directly
    return this.updateCharacteristicsFromQuest(quest, questXP);
  }
  
  // Update characteristics from quest
  private async updateCharacteristicsFromQuest(quest: Quest, questXP: number): Promise<string[]> {
    const affectedCharacteristics: string[] = [];
    
    for (const charName of quest.characteristics) {
      let skill = this.storageService.getSkill(skillName);
      
      // Create skill if it doesn't exist
      if (!skill) {
        skill = {
          level: 1,
          xp: 0,
          type: 'increasing', // Default for quests
          characteristics: quest.characteristics || []
        };
        
        // Save the new skill immediately
        await this.storageService.updateSkill(skillName, skill);
      }

      // Calculate skill XP change (30% of quest XP)
      const skillXPChange = Math.round(questXP * 0.3);
      const newSkillXP = skill.xp + skillXPChange;
      const newSkillLevel = this.xpCalculator.calculateSkillLevel(newSkillXP);

      // Update skill
      await this.storageService.updateSkill(skillName, {
        ...skill,
        xp: newSkillXP,
        level: newSkillLevel
      });

      affectedSkills.push(skillName);
    }

    // Update characteristics based on quest skills
    await this.updateCharacteristicsFromSkills(quest.skills || []);

    return affectedSkills;
  }

  // Update skills and their characteristics based on task completion/failure
  private async updateSkillsFromTask(task: Task, completed: boolean, taskXP: number): Promise<string[]> {
    const affectedSkills: string[] = [];
    
    console.log('🔍 DEBUG - updateSkillsFromTask:', {
      taskTitle: task.title,
      taskXP,
      skills: task.skills,
      completed
    });

    // Check if task has skills defined
    if (!task.skills || task.skills.length === 0) {
      console.log('🔍 Task has no skills defined, skipping skill updates');
      return affectedSkills;
    }

    // First, update each skill directly
    for (const skillName of task.skills) {
      console.log(`🔍 Processing skill: ${skillName}`);
      
      let skill = this.storageService.getSkill(skillName);
      
      // Create skill if it doesn't exist (should assign to a default characteristic)
      if (!skill) {
        skill = {
          level: 1,
          xp: 0,
          type: 'increasing',
          characteristic: 'General' // Default characteristic
        };
        console.log(`🔍 Creating new skill: ${skillName}`);
        await this.storageService.updateSkill(skillName, skill);
        
        // Create default characteristic if it doesn't exist
        await this.createCharacteristicIfNotExists('General', 'increasing');
      }

      // Calculate skill XP change (30% of task XP, modified by impact)
      const baseSkillXPChange = Math.round(taskXP * 0.3);
      const impactMultiplier = (task.skillImpacts?.[skillName] || 100) / 100; // Default to 100% if not specified
      const skillXPChange = Math.round(baseSkillXPChange * impactMultiplier);
      const newSkillXP = Math.max(0, skill.xp + skillXPChange);
      const newSkillLevel = this.xpCalculator.calculateSkillLevel(newSkillXP);

      console.log(`🔍 Skill ${skillName}: XP ${skill.xp} -> ${newSkillXP} (base change: ${baseSkillXPChange}, impact: ${impactMultiplier * 100}%, final change: ${skillXPChange}), Level ${skill.level} -> ${newSkillLevel}`);

      // Update skill
      const updatedSkill: Skill = {
        ...skill,
        xp: newSkillXP,
        level: newSkillLevel
      };

      await this.storageService.updateSkill(skillName, updatedSkill);
      affectedSkills.push(skillName);

      // Now update the characteristic this skill belongs to
      const characteristicName = skill.characteristic;
      await this.updateCharacteristicsFromSkills([characteristicName]);
    }

    return affectedSkills;
  }

  // Update characteristics based on associated skills
  private async updateCharacteristicsFromSkills(characteristicNames: string[]): Promise<void> {
    console.log(`🔍 Updating characteristics: ${characteristicNames.join(', ')}`);
    
    for (const charName of characteristicNames) {
      console.log(`🔍 Processing characteristic: ${charName}`);
      // Get all skills associated with this characteristic
      const allSkills = this.storageService.getSkills();
      const associatedSkillNames = Object.keys(allSkills).filter(skillName => 
        allSkills[skillName].characteristic === charName
      );
      const associatedSkills = associatedSkillNames.map(skillName => allSkills[skillName]);

      console.log(`🔍 Associated skills for ${charName}:`, associatedSkillNames);

      if (associatedSkills.length > 0) {
        const charXP = this.xpCalculator.calculateCharacteristicXP(associatedSkills);
        const charLevel = this.xpCalculator.calculateSkillLevel(charXP);

        console.log(`🔍 Characteristic ${charName}: XP ${charXP}, Level ${charLevel}`);

        const existingChar = this.storageService.getCharacteristic(charName);
        const characteristic: Characteristic = {
          level: charLevel,
          xp: charXP,
          type: existingChar?.type || 'increasing',
          skills: associatedSkillNames
        };

        await this.storageService.updateCharacteristic(charName, characteristic);
        console.log(`🔍 Characteristic ${charName} updated successfully`);
      } else {
        console.log(`🔍 No associated skills found for characteristic: ${charName}`);
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

  // Create a new characteristic automatically when typed in task creation
  async createCharacteristicIfNotExists(characteristicName: string, type: 'increasing' | 'decreasing'): Promise<void> {
    const existingCharacteristic = this.storageService.getCharacteristic(characteristicName);
    
    if (!existingCharacteristic) {
      const newCharacteristic: Characteristic = {
        level: 1,
        xp: 0,
        type,
        skills: []
      };
      
      await this.storageService.updateCharacteristic(characteristicName, newCharacteristic);
    }
  }

  // Create a new skill manually from Skills screen
  async createSkill(skillName: string, characteristicName: string): Promise<void> {
    const existingSkill = this.storageService.getSkill(skillName);
    
    if (existingSkill) {
      throw new Error('Skill already exists');
    }

    if (!characteristicName) {
      throw new Error('A characteristic is required');
    }

    const newSkill: Skill = {
      level: 1,
      xp: 0,
      type: 'increasing',
      characteristic: characteristicName
    };
    
    await this.storageService.updateSkill(skillName, newSkill);

    // Update characteristic to include this skill
    const existingChar = this.storageService.getCharacteristic(characteristicName);
    
    if (existingChar) {
      // Add this skill to the characteristic's skills list
      if (!existingChar.skills.includes(skillName)) {
        await this.storageService.updateCharacteristic(characteristicName, {
          ...existingChar,
          skills: [...existingChar.skills, skillName]
        });
      }
    } else {
      // Create new characteristic
      const newCharacteristic: Characteristic = {
        level: 1,
        xp: 0,
        type: 'increasing',
        skills: [skillName]
      };
      
      await this.storageService.updateCharacteristic(characteristicName, newCharacteristic);
    }
  }

  // Update an existing skill
  async updateSkill(skillName: string, newCharacteristicName: string): Promise<void> {
    const existingSkill = this.storageService.getSkill(skillName);
    
    if (!existingSkill) {
      throw new Error('Skill not found');
    }

    if (!newCharacteristicName) {
      throw new Error('A characteristic is required');
    }

    const oldCharacteristicName = existingSkill.characteristic;

    // Update the skill
    const updatedSkill: Skill = {
      ...existingSkill,
      characteristic: newCharacteristicName
    };
    
    await this.storageService.updateSkill(skillName, updatedSkill);

    // Remove this skill from old characteristic
    if (oldCharacteristicName !== newCharacteristicName) {
      const oldChar = this.storageService.getCharacteristic(oldCharacteristicName);
      if (oldChar) {
        await this.storageService.updateCharacteristic(oldCharacteristicName, {
          ...oldChar,
          skills: oldChar.skills.filter(s => s !== skillName)
        });
      }

      // Add this skill to new characteristic
      const newChar = this.storageService.getCharacteristic(newCharacteristicName);
      if (newChar) {
        if (!newChar.skills.includes(skillName)) {
          await this.storageService.updateCharacteristic(newCharacteristicName, {
            ...newChar,
            skills: [...newChar.skills, skillName]
          });
        }
      } else {
        // Create new characteristic
        const newCharacteristic: Characteristic = {
          level: 1,
          xp: 0,
          type: 'increasing',
          skills: [skillName]
        };
        
        await this.storageService.updateCharacteristic(newCharacteristicName, newCharacteristic);
      }
    }
  }

  // Delete a skill
  async deleteSkill(skillName: string): Promise<void> {
    const existingSkill = this.storageService.getSkill(skillName);
    
    if (!existingSkill) {
      throw new Error('Skill not found');
    }

    // Remove this skill from its characteristic
    const characteristicName = existingSkill.characteristic;
    const characteristic = this.storageService.getCharacteristic(characteristicName);
    
    if (characteristic) {
      const updatedSkills = characteristic.skills.filter(s => s !== skillName);
      
      if (updatedSkills.length === 0) {
        // If no more skills associated, optionally delete the characteristic
        // For now, just remove the skill reference
        await this.storageService.updateCharacteristic(characteristicName, {
          ...characteristic,
          skills: updatedSkills
        });
      } else {
        // Update the characteristic
        await this.storageService.updateCharacteristic(characteristicName, {
          ...characteristic,
          skills: updatedSkills
        });
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

    // Delete all skills associated with this characteristic
    const allSkills = this.storageService.getSkills();
    for (const [skillName, skill] of Object.entries(allSkills)) {
      if (skill.characteristic === characteristicName) {
        await this.storageService.deleteSkill(skillName);
      }
    }

    // Delete the characteristic
    await this.storageService.deleteCharacteristic(characteristicName);
  }

  // Create a standalone characteristic (not associated with any skill initially)
  async createStandaloneCharacteristic(characteristicName: string, type: 'increasing' | 'decreasing' = 'increasing'): Promise<void> {
    const existingChar = this.storageService.getCharacteristic(characteristicName);
    
    if (existingChar) {
      throw new Error('Characteristic already exists');
    }

    const newCharacteristic: Characteristic = {
      level: 1,
      xp: 0,
      type,
      skills: []
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
      const existingSkill = this.storageService.getSkill(skillName);
      if (!existingSkill) {
        const newSkill: Skill = {
          level: 1,
          xp: 0,
          type: 'increasing',
          characteristic: 'General' // Default characteristic
        };
        await this.storageService.updateSkill(skillName, newSkill);
        
        // Create default characteristic if it doesn't exist
        await this.createCharacteristicIfNotExists('General', 'increasing');
      }
    }

    // Save the task
    await this.storageService.addTask(task);
  }

  // Create a new reward
  async createReward(rewardData: Omit<Reward, 'id' | 'purchased' | 'timePurchased' | 'createdAt' | 'timesPurchased'>): Promise<void> {
    const reward: Reward = {
      ...rewardData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      purchased: false,
      timePurchased: '',
      createdAt: new Date().toISOString(),
      timesPurchased: 0,
      // Set currentStock to totalStock if it's a finite stock reward
      currentStock: rewardData.hasInfiniteStock ? undefined : rewardData.totalStock,
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
    
    if (!hero) {
      return { success: false, message: 'Hero data not found' };
    }
    
    if (hero.gold < reward.cost) {
      return { success: false, message: 'Insufficient gold' };
    }
    
    // Check stock availability
    if (!reward.hasInfiniteStock) {
      const currentStock = reward.currentStock ?? 0;
      if (currentStock <= 0) {
        return { success: false, message: 'Reward is out of stock' };
      }
    }
    
    // Deduct gold
    await this.storageService.updateHero({
      gold: hero.gold - reward.cost
    });
    
    // Update reward stock and purchase info
    const updatedReward: Partial<Reward> = {
      timesPurchased: reward.timesPurchased + 1,
      timePurchased: new Date().toISOString()
    };
    
    // If it's a finite stock reward, update the current stock
    if (!reward.hasInfiniteStock) {
      updatedReward.currentStock = (reward.currentStock ?? 0) - 1;
      
      // If this was a single-purchase reward (like old system), mark as purchased
      if (reward.totalStock === 1) {
        updatedReward.purchased = true;
      }
    }
    
    await this.storageService.updateReward(rewardId, updatedReward);
    
    const stockMessage = reward.hasInfiniteStock 
      ? '' 
      : ` (${updatedReward.currentStock} left in stock)`;
    
    return { 
      success: true, 
      message: `Reward purchased successfully!${stockMessage}` 
    };
  }
}

export default GameEngine;