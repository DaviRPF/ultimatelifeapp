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

      // Now update characteristics that this skill impacts
      const affectedCharacteristics = new Set<string>();
      
      // Add primary characteristic
      if (skill.characteristic) {
        affectedCharacteristics.add(skill.characteristic);
      }
      
      // Add characteristics from impact system
      if (skill.characteristicImpacts) {
        Object.keys(skill.characteristicImpacts).forEach(charName => {
          if (skill.characteristicImpacts![charName] > 0) {
            affectedCharacteristics.add(charName);
          }
        });
      }
      
      // Add characteristics from new multi-characteristic system
      if (skill.characteristics) {
        skill.characteristics.forEach(charName => affectedCharacteristics.add(charName));
      }
      
      // Update each affected characteristic incrementally
      for (const charName of affectedCharacteristics) {
        await this.updateCharacteristicIncremental(charName, skillName, skillXPChange, updatedSkill);
      }
    }

    return affectedSkills;
  }

  // Update characteristic incrementally based on skill XP gain and impact
  private async updateCharacteristicIncremental(characteristicName: string, skillName: string, skillXPGain: number, skill: Skill): Promise<void> {
    console.log(`🔍 Updating characteristic ${characteristicName} incrementally from skill ${skillName}`);
    
    // Calculate how much XP this characteristic should gain based on the skill's impact
    const characteristicXPGain = this.xpCalculator.calculateCharacteristicXPGain(skillXPGain, skillName, characteristicName, skill);
    
    if (characteristicXPGain === 0) {
      console.log(`🔍 No XP gain for characteristic ${characteristicName} from skill ${skillName}`);
      return;
    }
    
    // Get existing characteristic or create new one
    let existingChar = this.storageService.getCharacteristic(characteristicName);
    if (!existingChar) {
      console.log(`🔍 Creating new characteristic: ${characteristicName}`);
      existingChar = {
        name: characteristicName,
        level: 1,
        xp: 0,
        type: skill.type || 'increasing',
        associatedSkills: []
      };
    }
    
    // Apply incremental XP gain
    const newCharXP = Math.max(0, existingChar.xp + characteristicXPGain);
    const newCharLevel = this.xpCalculator.calculateSkillLevel(newCharXP);
    
    console.log(`🔍 Characteristic ${characteristicName}: XP ${existingChar.xp} -> ${newCharXP} (+${characteristicXPGain}), Level ${existingChar.level} -> ${newCharLevel}`);
    
    // Update associated skills list
    const associatedSkills = existingChar.associatedSkills || [];
    if (!associatedSkills.includes(skillName)) {
      associatedSkills.push(skillName);
    }
    
    const updatedCharacteristic: Characteristic = {
      ...existingChar,
      level: newCharLevel,
      xp: newCharXP,
      associatedSkills
    };
    
    await this.storageService.updateCharacteristic(characteristicName, updatedCharacteristic);
    console.log(`🔍 Characteristic ${characteristicName} updated successfully`);
  }

  // Update characteristics based on associated skills
  private async updateCharacteristicsFromSkills(characteristicNames: string[]): Promise<void> {
    console.log(`🔍 Updating characteristics: ${characteristicNames.join(', ')}`);
    
    const allSkills = this.storageService.getSkills();
    
    for (const charName of characteristicNames) {
      console.log(`🔍 Processing characteristic: ${charName}`);
      
      // Find skills that impact this characteristic (either through new impact system or old characteristic system)
      const associatedSkillNames = Object.keys(allSkills).filter(skillName => {
        const skill = allSkills[skillName];
        return (skill.characteristicImpacts?.[charName] && skill.characteristicImpacts[charName] > 0) ||
               skill.characteristic === charName;
      });

      console.log(`🔍 Associated skills for ${charName}:`, associatedSkillNames);

      if (associatedSkillNames.length > 0) {
        // Use new impact-based calculation
        const charXP = this.xpCalculator.calculateCharacteristicXPWithImpacts(charName, allSkills);
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
        case 'weight_lost':
        case 'weight_gained':
          shouldUnlock = this.checkWeightAchievement(achievement.condition);
          break;
        case 'max_bench_press':
        case 'max_squat':
        case 'max_deadlift':
          shouldUnlock = this.checkMaxLiftAchievement(achievement.condition);
          break;
        case 'total_weight_lifted':
          shouldUnlock = this.checkTotalWeightAchievement(achievement.condition);
          break;
        case 'body_measurement':
          shouldUnlock = this.checkBodyMeasurementAchievement(achievement.condition);
          break;
        case 'workout_count':
          shouldUnlock = this.checkWorkoutCountAchievement(achievement.condition);
          break;
        case 'cardio_minutes':
          shouldUnlock = this.checkCardioMinutesAchievement(achievement.condition);
          break;
        case 'consecutive_workouts':
          shouldUnlock = this.checkConsecutiveWorkoutsAchievement(achievement.condition);
          break;
        case 'exercise_max_weight':
          shouldUnlock = this.checkExerciseMaxWeightAchievement(achievement.condition);
          break;
        case 'exercise_total_reps':
          shouldUnlock = this.checkExerciseTotalRepsAchievement(achievement.condition);
          break;
        case 'flexao_count':
          shouldUnlock = this.checkFlexaoCountAchievement(achievement.condition);
          break;
        case 'barra_fixa_count':
          shouldUnlock = this.checkBarraFixaCountAchievement(achievement.condition);
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

    // Check fitness achievements
    for (const achievement of achievements.fitness) {
      if (achievement.unlocked) continue;

      let shouldUnlock = false;

      switch (achievement.condition.type) {
        case 'weight_lost':
        case 'weight_gained':
          shouldUnlock = this.checkWeightAchievement(achievement.condition);
          break;
        case 'max_bench_press':
        case 'max_squat':
        case 'max_deadlift':
          shouldUnlock = this.checkMaxLiftAchievement(achievement.condition);
          break;
        case 'total_weight_lifted':
          shouldUnlock = this.checkTotalWeightAchievement(achievement.condition);
          break;
        case 'body_measurement':
          shouldUnlock = this.checkBodyMeasurementAchievement(achievement.condition);
          break;
        case 'workout_count':
          shouldUnlock = this.checkWorkoutCountAchievement(achievement.condition);
          break;
        case 'cardio_minutes':
          shouldUnlock = this.checkCardioMinutesAchievement(achievement.condition);
          break;
        case 'consecutive_workouts':
          shouldUnlock = this.checkConsecutiveWorkoutsAchievement(achievement.condition);
          break;
        case 'exercise_max_weight':
          shouldUnlock = this.checkExerciseMaxWeightAchievement(achievement.condition);
          break;
        case 'exercise_total_reps':
          shouldUnlock = this.checkExerciseTotalRepsAchievement(achievement.condition);
          break;
        case 'flexao_count':
          shouldUnlock = this.checkFlexaoCountAchievement(achievement.condition);
          break;
        case 'barra_fixa_count':
          shouldUnlock = this.checkBarraFixaCountAchievement(achievement.condition);
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
  async createSkill(skillName: string, skillType: 'increasing' | 'decreasing', characteristics: string[], impacts?: { [key: string]: number }): Promise<void> {
    const existingSkill = this.storageService.getSkill(skillName);
    
    if (existingSkill) {
      throw new Error('Skill already exists');
    }

    if (!characteristics || characteristics.length === 0) {
      throw new Error('At least one characteristic is required');
    }

    // Use the first characteristic as the primary one (for backward compatibility)
    const primaryCharacteristic = characteristics[0];

    // Create default impacts if not provided (equal distribution)
    let characteristicImpacts: { [key: string]: number } = {};
    if (impacts && Object.keys(impacts).length > 0) {
      characteristicImpacts = impacts;
    } else {
      // Default: equal distribution among all characteristics
      const equalImpact = Math.floor(100 / characteristics.length);
      let remaining = 100 - (equalImpact * characteristics.length);
      
      characteristics.forEach((char, index) => {
        characteristicImpacts[char] = equalImpact + (index === 0 ? remaining : 0);
      });
    }

    const newSkill: Skill = {
      level: 1,
      xp: 0,
      type: skillType,
      characteristic: primaryCharacteristic,
      characteristicImpacts
    };
    
    await this.storageService.updateSkill(skillName, newSkill);

    // Update characteristic to include this skill
    const existingChar = this.storageService.getCharacteristic(primaryCharacteristic);
    
    if (existingChar) {
      // Add this skill to the characteristic's skills list
      if (!existingChar.skills.includes(skillName)) {
        await this.storageService.updateCharacteristic(primaryCharacteristic, {
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
      
      await this.storageService.updateCharacteristic(primaryCharacteristic, newCharacteristic);
    }
  }

  // Update an existing skill with full parameters
  async updateSkillComplete(
    skillName: string, 
    skillType: 'increasing' | 'decreasing', 
    characteristics: string[], 
    characteristicImpacts?: { [key: string]: number }
  ): Promise<void> {
    const existingSkill = this.storageService.getSkill(skillName);
    
    if (!existingSkill) {
      throw new Error('Skill not found');
    }

    if (characteristics.length === 0) {
      throw new Error('At least one characteristic is required');
    }

    const primaryCharacteristic = characteristics[0];
    const oldCharacteristicName = existingSkill.characteristic;

    // Update the skill
    const updatedSkill: Skill = {
      ...existingSkill,
      type: skillType,
      characteristic: primaryCharacteristic,
      characteristics,
      characteristicImpacts: characteristicImpacts || {}
    };
    
    await this.storageService.updateSkill(skillName, updatedSkill);

    // Update characteristics associations
    const allOldCharacteristics = existingSkill.characteristics || [oldCharacteristicName];
    
    // Remove skill from old characteristics that are no longer used
    for (const oldChar of allOldCharacteristics) {
      if (!characteristics.includes(oldChar)) {
        const char = this.storageService.getCharacteristic(oldChar);
        if (char && char.associatedSkills) {
          await this.storageService.updateCharacteristic(oldChar, {
            ...char,
            associatedSkills: char.associatedSkills.filter(s => s !== skillName)
          });
        }
      }
    }

    // Add skill to new characteristics
    for (const charName of characteristics) {
      const char = this.storageService.getCharacteristic(charName);
      if (char) {
        if (!char.associatedSkills || !char.associatedSkills.includes(skillName)) {
          await this.storageService.updateCharacteristic(charName, {
            ...char,
            associatedSkills: [...(char.associatedSkills || []), skillName]
          });
        }
      } else {
        // Create new characteristic if it doesn't exist
        const newCharacteristic: Characteristic = {
          name: charName,
          level: 1,
          xp: 0,
          associatedSkills: [skillName]
        };
        
        await this.storageService.updateCharacteristic(charName, newCharacteristic);
      }
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

  // Helper methods for fitness achievement checking
  private checkWeightAchievement(condition: any): boolean {
    const weightEntries = this.storageService.getWeightEntries();
    if (weightEntries.length < 2) return condition.target === 0; // First weigh-in
    
    const sortedWeights = [...weightEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstWeight = sortedWeights[0].weight;
    const currentWeight = sortedWeights[sortedWeights.length - 1].weight;
    const weightChange = Math.abs(currentWeight - firstWeight);
    
    return weightChange >= condition.target;
  }

  private checkMaxLiftAchievement(condition: any): boolean {
    const workouts = this.storageService.getWorkouts();
    let maxWeight = 0;
    
    const exerciseNameMap: { [key: string]: string[] } = {
      'max_bench_press': ['supino', 'bench press', 'supino reto', 'supino horizontal'],
      'max_squat': ['agachamento', 'squat', 'agachamento livre', 'back squat'],
      'max_deadlift': ['levantamento terra', 'deadlift', 'terra', 'levantamento-terra']
    };
    
    const exerciseNames = exerciseNameMap[condition.type] || [];
    
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        const exerciseName = exercise.exerciseName.toLowerCase();
        const isTargetExercise = exerciseNames.some(name => exerciseName.includes(name));
        
        if (isTargetExercise) {
          for (const set of exercise.sets) {
            if (set.weight && set.weight > maxWeight) {
              maxWeight = set.weight;
            }
          }
        }
      }
    }
    
    return maxWeight >= condition.target;
  }

  private checkTotalWeightAchievement(condition: any): boolean {
    const workouts = this.storageService.getWorkouts();
    let totalWeight = 0;
    
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        for (const set of exercise.sets) {
          if (set.weight && set.reps) {
            totalWeight += set.weight * set.reps;
          }
        }
      }
    }
    
    return totalWeight >= condition.target;
  }

  private checkBodyMeasurementAchievement(condition: any): boolean {
    if (!condition.measurementType) return false;
    
    const measurementEntries = this.storageService.getBodyMeasurementEntries();
    if (measurementEntries.length === 0) return false;
    
    // Get latest measurement entry
    const sortedEntries = [...measurementEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestEntry = sortedEntries[0];
    
    const measurementValue = latestEntry.measurements[condition.measurementType as keyof typeof latestEntry.measurements];
    return measurementValue !== undefined && measurementValue >= condition.target;
  }

  private checkWorkoutCountAchievement(condition: any): boolean {
    const workouts = this.storageService.getWorkouts();
    return workouts.length >= condition.target;
  }

  private checkCardioMinutesAchievement(condition: any): boolean {
    const workouts = this.storageService.getWorkouts();
    let totalCardioMinutes = 0;
    
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        // Check if exercise is cardio based on category or name
        const isCardio = exercise.exerciseCategory === 'cardio' || 
                         exercise.exerciseName.toLowerCase().includes('cardio') ||
                         exercise.exerciseName.toLowerCase().includes('corrida') ||
                         exercise.exerciseName.toLowerCase().includes('bicicleta') ||
                         exercise.exerciseName.toLowerCase().includes('esteira') ||
                         exercise.exerciseName.toLowerCase().includes('elíptico');
        
        if (isCardio) {
          for (const set of exercise.sets) {
            // For cardio, duration is usually stored in reps or has a duration field
            if (set.duration) {
              totalCardioMinutes += set.duration;
            } else if (set.reps) {
              // Assume reps represents minutes for cardio exercises
              totalCardioMinutes += set.reps;
            }
          }
        }
      }
    }
    
    return totalCardioMinutes >= condition.target;
  }

  private checkConsecutiveWorkoutsAchievement(condition: any): boolean {
    const workouts = this.storageService.getWorkouts();
    if (workouts.length === 0) return false;
    
    // Sort workouts by date
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let maxConsecutive = 0;
    let currentConsecutive = 1;
    
    for (let i = 1; i < sortedWorkouts.length; i++) {
      const currentDate = new Date(sortedWorkouts[i].date);
      const previousDate = new Date(sortedWorkouts[i - 1].date);
      
      // Check if dates are consecutive (difference of 1 day)
      const dayDifference = Math.abs(currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dayDifference <= 1) {
        currentConsecutive++;
      } else {
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        currentConsecutive = 1;
      }
    }
    
    maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    return maxConsecutive >= condition.target;
  }

  private checkExerciseMaxWeightAchievement(condition: any): boolean {
    if (!condition.exerciseName) return false;
    
    const workouts = this.storageService.getWorkouts();
    let maxWeight = 0;
    
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        if (exercise.exerciseId === condition.exerciseName || 
            exercise.exerciseName.toLowerCase().includes(condition.exerciseName.toLowerCase())) {
          for (const set of exercise.sets) {
            if (set.weight && set.weight > maxWeight) {
              maxWeight = set.weight;
            }
          }
        }
      }
    }
    
    return maxWeight >= condition.target;
  }

  private checkExerciseTotalRepsAchievement(condition: any): boolean {
    if (!condition.exerciseName) return false;
    
    const workouts = this.storageService.getWorkouts();
    let totalReps = 0;
    
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        if (exercise.exerciseId === condition.exerciseName || 
            exercise.exerciseName.toLowerCase().includes(condition.exerciseName.toLowerCase())) {
          for (const set of exercise.sets) {
            if (set.reps) {
              totalReps += set.reps;
            }
            // For time-based exercises like plank, use duration as reps
            if (set.duration && condition.unit === 'segundos') {
              totalReps += set.duration;
            }
          }
        }
      }
    }
    
    return totalReps >= condition.target;
  }

  private checkFlexaoCountAchievement(condition: any): boolean {
    const workouts = this.storageService.getWorkouts();
    let totalFlexoes = 0;
    
    const flexaoNames = ['flexao', 'flexão', 'push-up', 'pushup', 'push up'];
    
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        const exerciseName = exercise.exerciseName.toLowerCase();
        const isFlexao = flexaoNames.some(name => exerciseName.includes(name));
        
        if (isFlexao) {
          for (const set of exercise.sets) {
            if (set.reps) {
              totalFlexoes += set.reps;
            }
          }
        }
      }
    }
    
    return totalFlexoes >= condition.target;
  }

  private checkBarraFixaCountAchievement(condition: any): boolean {
    const workouts = this.storageService.getWorkouts();
    let totalBarras = 0;
    
    const barraNames = ['barra fixa', 'pull-up', 'pullup', 'pull up', 'chin-up', 'chinup', 'chin up'];
    
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        const exerciseName = exercise.exerciseName.toLowerCase();
        const isBarra = barraNames.some(name => exerciseName.includes(name));
        
        if (isBarra) {
          for (const set of exercise.sets) {
            if (set.reps) {
              totalBarras += set.reps;
            }
          }
        }
      }
    }
    
    return totalBarras >= condition.target;
  }
}

export default GameEngine;