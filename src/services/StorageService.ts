import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, Hero, Task, Quest, Skill, Characteristic, Group, Reward, Achievements, BackupData, WeightEntry, BodyMeasurementEntry, BodyMeasurements, Workout, NumericTaskEntry, BinaryTaskEntry } from '../types';
import { DEFAULT_ACHIEVEMENTS } from '../constants/defaultAchievements';

const STORAGE_KEYS = {
  APP_DATA: '@DoItNowRPG:AppData',
  BACKUP: '@DoItNowRPG:Backup',
} as const;

const INITIAL_HERO: Hero = {
  level: 1,
  xp: 0,
  gold: 0,
  xpMultiplier: 1.0,
  createdAt: new Date().toISOString(),
  name: 'Hero',
  weight: undefined,
};

const INITIAL_APP_DATA: AppData = {
  hero: INITIAL_HERO,
  tasks: [],
  quests: [],
  skills: {},
  characteristics: {},
  groups: [],
  rewards: [],
  achievements: {
    default: DEFAULT_ACHIEVEMENTS.map(achievement => ({ ...achievement })),
    custom: [],
  },
  weightEntries: [],
  bodyMeasurementEntries: [],
  workouts: [],
  numericTaskEntries: [],
  binaryTaskEntries: [],
};

class StorageService {
  private static instance: StorageService;
  private appData: AppData | null = null;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Initialize app data on first launch
  async initializeAppData(): Promise<AppData> {
    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.APP_DATA);
      
      if (existingData) {
        this.appData = JSON.parse(existingData);
        
        // Migrate data to ensure all fields exist
        this.appData = this.migrateAppData(this.appData);
        
        // Ensure default achievements are present and up to date
        this.appData!.achievements.default = this.mergeDefaultAchievements(this.appData!.achievements.default);
      } else {
        this.appData = { ...INITIAL_APP_DATA };
        await this.saveAppData();
      }
      
      return this.appData;
    } catch (error) {
      console.error('Error initializing app data:', error);
      this.appData = { ...INITIAL_APP_DATA };
      return this.appData;
    }
  }

  // Migrate app data to ensure all fields exist
  private migrateAppData(data: any): AppData {
    const migrated = {
      ...INITIAL_APP_DATA,
      ...data,
    };

    // Ensure all required fields exist
    migrated.weightEntries = migrated.weightEntries || [];
    migrated.bodyMeasurementEntries = migrated.bodyMeasurementEntries || [];
    migrated.workouts = migrated.workouts || [];
    migrated.numericTaskEntries = migrated.numericTaskEntries || [];
    migrated.binaryTaskEntries = migrated.binaryTaskEntries || [];
    migrated.achievements = migrated.achievements || { default: [], custom: [] };
    migrated.skills = migrated.skills || {};
    migrated.characteristics = migrated.characteristics || {};
    migrated.groups = migrated.groups || [];
    migrated.rewards = migrated.rewards || [];
    migrated.tasks = migrated.tasks || [];
    migrated.quests = migrated.quests || [];
    
    // Migrate tasks to have new taskType field
    migrated.tasks = migrated.tasks.map((task: any) => ({
      ...task,
      taskType: task.taskType || 'binary',
      numericConfig: task.numericConfig || undefined,
      currentDayValue: task.currentDayValue || undefined,
      pendingValue: task.pendingValue || undefined,
      // Ensure all required fields exist
      title: task.title || '',
      description: task.description || '',
      skills: Array.isArray(task.skills) ? task.skills : [],
      group: task.group || '',
      repetition: task.repetition || 'one_time',
      habit: task.habit || {
        enabled: false,
        requiredDays: 7,
        currentStreak: 0,
        lastCompletedDate: '',
      },
      completed: Boolean(task.completed),
      failed: Boolean(task.failed),
      infinite: Boolean(task.infinite),
      notificationEnabled: Boolean(task.notificationEnabled),
      notificationIntervals: Array.isArray(task.notificationIntervals) ? task.notificationIntervals : [],
      autoFail: Boolean(task.autoFail),
      difficulty: typeof task.difficulty === 'number' ? task.difficulty : 50,
      importance: typeof task.importance === 'number' ? task.importance : 50,
      fear: typeof task.fear === 'number' ? task.fear : 50,
      xp: typeof task.xp === 'number' ? task.xp : 0,
      createdAt: task.createdAt || new Date().toISOString(),
    }));

    // Ensure hero has all fields
    if (migrated.hero) {
      migrated.hero.bodyMeasurements = migrated.hero.bodyMeasurements || undefined;
    }

    // Migrate tasks from old characteristics structure to new skills structure
    if (migrated.tasks) {
      migrated.tasks = migrated.tasks.map((task: any) => {
        if (task.characteristics && !task.skills) {
          // Convert old characteristics to skills
          return {
            ...task,
            skills: task.characteristics || [],
            skillImpacts: task.characteristicImpacts || {},
            // Remove old fields
            characteristics: undefined,
            characteristicImpacts: undefined,
          };
        }
        // Ensure skills array exists
        return {
          ...task,
          skills: task.skills || [],
          skillImpacts: task.skillImpacts || {},
        };
      });
    }

    // Migrate quests from old characteristics structure to new skills structure  
    if (migrated.quests) {
      migrated.quests = migrated.quests.map((quest: any) => {
        if (quest.characteristics && !quest.skills) {
          // Convert old characteristics to skills
          return {
            ...quest,
            skills: quest.characteristics || [],
            // Remove old field
            characteristics: undefined,
          };
        }
        // Ensure skills array exists
        return {
          ...quest,
          skills: quest.skills || [],
        };
      });
    }

    // Ensure skills have required properties
    if (migrated.skills && typeof migrated.skills === 'object') {
      Object.keys(migrated.skills).forEach(skillName => {
        const skill = migrated.skills[skillName];
        if (skill && typeof skill === 'object') {
          // Ensure skill has required properties with default values
          migrated.skills[skillName] = {
            level: skill.level || 1,
            xp: skill.xp || 0,
            type: skill.type || 'increasing',
            ...skill,
          };
        }
      });
    }

    return migrated;
  }

  // Merge existing default achievements with new ones
  private mergeDefaultAchievements(existingAchievements: any[]): any[] {
    const existing = existingAchievements || [];
    const merged = [...DEFAULT_ACHIEVEMENTS];
    
    // Preserve unlocked status and unlock dates
    existing.forEach(existingAchievement => {
      const index = merged.findIndex(a => a.id === existingAchievement.id);
      if (index !== -1) {
        merged[index] = {
          ...merged[index],
          unlocked: existingAchievement.unlocked,
          unlockedAt: existingAchievement.unlockedAt,
        };
      }
    });
    
    return merged;
  }

  // Save all app data
  async saveAppData(): Promise<void> {
    if (!this.appData) return;
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_DATA, JSON.stringify(this.appData));
    } catch (error) {
      console.error('Error saving app data:', error);
      throw error;
    }
  }

  // Get current app data
  getAppData(): AppData | null {
    return this.appData;
  }

  // Hero operations
  async updateHero(heroUpdates: Partial<Hero>): Promise<void> {
    if (!this.appData) return;
    
    this.appData.hero = { ...this.appData.hero, ...heroUpdates };
    await this.saveAppData();
  }

  getHero(): Hero | null {
    return this.appData?.hero || null;
  }

  // Task operations
  async addTask(task: Task): Promise<void> {
    if (!this.appData) return;
    
    this.appData.tasks.push(task);
    await this.saveAppData();
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    if (!this.appData) return;
    
    const taskIndex = this.appData.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      this.appData.tasks[taskIndex] = { ...this.appData.tasks[taskIndex], ...updates };
      await this.saveAppData();
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    if (!this.appData) return;
    
    this.appData.tasks = this.appData.tasks.filter(t => t.id !== taskId);
    await this.saveAppData();
  }

  getTasks(): Task[] {
    return this.appData?.tasks || [];
  }

  getTaskById(taskId: string): Task | null {
    return this.appData?.tasks.find(t => t.id === taskId) || null;
  }

  getTasksByGroup(groupName: string): Task[] {
    return this.appData?.tasks.filter(t => t.group === groupName) || [];
  }

  // Quest operations
  async addQuest(quest: Quest): Promise<void> {
    if (!this.appData) return;
    
    this.appData.quests.push(quest);
    await this.saveAppData();
  }

  async updateQuest(questId: string, updates: Partial<Quest>): Promise<void> {
    if (!this.appData) return;
    
    const questIndex = this.appData.quests.findIndex(q => q.id === questId);
    if (questIndex !== -1) {
      this.appData.quests[questIndex] = { ...this.appData.quests[questIndex], ...updates };
      await this.saveAppData();
    }
  }

  async deleteQuest(questId: string): Promise<void> {
    if (!this.appData) return;
    
    this.appData.quests = this.appData.quests.filter(q => q.id !== questId);
    await this.saveAppData();
  }

  getQuests(): Quest[] {
    return this.appData?.quests || [];
  }

  getQuestById(questId: string): Quest | null {
    return this.appData?.quests.find(q => q.id === questId) || null;
  }

  getActiveQuests(): Quest[] {
    return this.appData?.quests.filter(q => q.status === 'active') || [];
  }

  getCompletedQuests(): Quest[] {
    return this.appData?.quests.filter(q => q.status === 'completed') || [];
  }

  // Skills operations
  async updateSkill(skillName: string, skill: Skill): Promise<void> {
    if (!this.appData) return;
    
    this.appData.skills[skillName] = skill;
    await this.saveAppData();
  }

  async deleteSkill(skillName: string): Promise<void> {
    if (!this.appData) return;
    
    delete this.appData.skills[skillName];
    await this.saveAppData();
  }

  getSkills(): Record<string, Skill> {
    return this.appData?.skills || {};
  }

  getSkill(skillName: string): Skill | null {
    return this.appData?.skills[skillName] || null;
  }

  // Characteristics operations
  async updateCharacteristic(characteristicName: string, characteristic: Characteristic): Promise<void> {
    if (!this.appData) return;
    
    this.appData.characteristics[characteristicName] = characteristic;
    await this.saveAppData();
  }

  async deleteCharacteristic(characteristicName: string): Promise<void> {
    if (!this.appData) return;
    
    delete this.appData.characteristics[characteristicName];
    await this.saveAppData();
  }

  getCharacteristics(): Record<string, Characteristic> {
    return this.appData?.characteristics || {};
  }

  getCharacteristic(characteristicName: string): Characteristic | null {
    return this.appData?.characteristics[characteristicName] || null;
  }

  // Groups operations
  async addGroup(group: Group): Promise<void> {
    if (!this.appData) return;
    
    this.appData.groups.push(group);
    await this.saveAppData();
  }

  async updateGroup(groupId: string, updates: Partial<Group>): Promise<void> {
    if (!this.appData) return;
    
    const groupIndex = this.appData.groups.findIndex(g => g.id === groupId);
    if (groupIndex !== -1) {
      this.appData.groups[groupIndex] = { ...this.appData.groups[groupIndex], ...updates };
      await this.saveAppData();
    }
  }

  async deleteGroup(groupId: string): Promise<void> {
    if (!this.appData) return;
    
    this.appData.groups = this.appData.groups.filter(g => g.id !== groupId);
    await this.saveAppData();
  }

  getGroups(): Group[] {
    return this.appData?.groups || [];
  }

  // Rewards operations
  async addReward(reward: Reward): Promise<void> {
    if (!this.appData) return;
    
    this.appData.rewards.push(reward);
    await this.saveAppData();
  }

  async updateReward(rewardId: string, updates: Partial<Reward>): Promise<void> {
    if (!this.appData) return;
    
    const rewardIndex = this.appData.rewards.findIndex(r => r.id === rewardId);
    if (rewardIndex !== -1) {
      this.appData.rewards[rewardIndex] = { ...this.appData.rewards[rewardIndex], ...updates };
      await this.saveAppData();
    }
  }

  async deleteReward(rewardId: string): Promise<void> {
    if (!this.appData) return;
    
    this.appData.rewards = this.appData.rewards.filter(r => r.id !== rewardId);
    await this.saveAppData();
  }

  getRewards(): Reward[] {
    return this.appData?.rewards || [];
  }

  // Achievements operations
  async updateAchievements(achievements: Achievements): Promise<void> {
    if (!this.appData) return;
    
    this.appData.achievements = achievements;
    await this.saveAppData();
  }

  getAchievements(): Achievements {
    return this.appData?.achievements || { default: [], custom: [] };
  }

  // Backup and restore
  async createBackup(): Promise<BackupData> {
    if (!this.appData) throw new Error('No app data to backup');
    
    const backup: BackupData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      data: { ...this.appData },
    };
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(backup));
      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupData: BackupData): Promise<void> {
    try {
      // Validate backup data structure
      if (!backupData.data || typeof backupData.data !== 'object') {
        throw new Error('Invalid backup data structure');
      }
      
      this.appData = backupData.data;
      await this.saveAppData();
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw error;
    }
  }

  // Clear all data (for testing/reset)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.APP_DATA, STORAGE_KEYS.BACKUP]);
      this.appData = { ...INITIAL_APP_DATA };
      await this.saveAppData();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Weight management methods
  getWeightEntries(): WeightEntry[] {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }
    return this.appData.weightEntries || [];
  }

  async addWeightEntry(weight: number, notes?: string): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }

    const weightEntry: WeightEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      weight,
      date: new Date().toISOString(),
      notes: notes?.trim() || undefined,
    };

    this.appData.weightEntries = this.appData.weightEntries || [];
    this.appData.weightEntries.push(weightEntry);

    // Update hero's current weight
    this.appData.hero.weight = weight;

    await this.saveAppData();
  }

  async updateWeightEntry(id: string, weight: number, notes?: string): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }

    const entryIndex = this.appData.weightEntries.findIndex(entry => entry.id === id);
    if (entryIndex === -1) {
      throw new Error('Weight entry not found');
    }

    this.appData.weightEntries[entryIndex] = {
      ...this.appData.weightEntries[entryIndex],
      weight,
      notes: notes?.trim() || undefined,
    };

    // If this is the most recent entry, update hero's current weight
    const sortedEntries = [...this.appData.weightEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    if (sortedEntries[0].id === id) {
      this.appData.hero.weight = weight;
    }

    await this.saveAppData();
  }

  async deleteWeightEntry(id: string): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }

    this.appData.weightEntries = this.appData.weightEntries.filter(entry => entry.id !== id);
    
    // Update hero's current weight to the most recent entry (if any)
    const sortedEntries = [...this.appData.weightEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    this.appData.hero.weight = sortedEntries.length > 0 ? sortedEntries[0].weight : undefined;

    await this.saveAppData();
  }

  // Body measurements management methods
  getBodyMeasurementEntries(): BodyMeasurementEntry[] {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }
    return this.appData.bodyMeasurementEntries || [];
  }

  async addBodyMeasurementEntry(measurements: BodyMeasurements, notes?: string): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }

    const measurementEntry: BodyMeasurementEntry = {
      id: Date.now().toString(),
      measurements,
      date: new Date().toISOString(),
      notes: notes || undefined,
    };

    this.appData.bodyMeasurementEntries = this.appData.bodyMeasurementEntries || [];
    this.appData.bodyMeasurementEntries.push(measurementEntry);

    // Update hero's current body measurements
    this.appData.hero.bodyMeasurements = measurements;

    await this.saveAppData();
  }

  async updateBodyMeasurementEntry(id: string, measurements: BodyMeasurements, notes?: string): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }

    const entryIndex = this.appData.bodyMeasurementEntries.findIndex(entry => entry.id === id);
    if (entryIndex === -1) {
      throw new Error('Body measurement entry not found');
    }

    this.appData.bodyMeasurementEntries[entryIndex] = {
      ...this.appData.bodyMeasurementEntries[entryIndex],
      measurements,
      notes: notes || undefined,
    };

    // If this is the most recent entry, update hero's current measurements
    const sortedEntries = [...this.appData.bodyMeasurementEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    if (sortedEntries[0]?.id === id) {
      this.appData.hero.bodyMeasurements = measurements;
    }

    await this.saveAppData();
  }

  async deleteBodyMeasurementEntry(id: string): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }

    this.appData.bodyMeasurementEntries = this.appData.bodyMeasurementEntries.filter(entry => entry.id !== id);

    // Update hero's current measurements to the most recent entry (if any)
    const sortedEntries = [...this.appData.bodyMeasurementEntries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    this.appData.hero.bodyMeasurements = sortedEntries.length > 0 ? sortedEntries[0].measurements : undefined;

    await this.saveAppData();
  }

  async updateHeroBodyMeasurements(measurements: BodyMeasurements): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }

    this.appData.hero.bodyMeasurements = measurements;
    await this.saveAppData();
  }

  // Workout management methods
  getWorkouts(): Workout[] {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }
    return this.appData.workouts || [];
  }

  async addWorkout(workout: Workout): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }

    this.appData.workouts = this.appData.workouts || [];
    this.appData.workouts.push(workout);
    await this.saveAppData();
  }

  async updateWorkout(workoutId: string, workout: Workout): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }

    this.appData.workouts = this.appData.workouts || [];
    const workoutIndex = this.appData.workouts.findIndex(w => w.id === workoutId);
    if (workoutIndex === -1) {
      throw new Error('Workout not found');
    }

    this.appData.workouts[workoutIndex] = workout;
    await this.saveAppData();
  }

  async deleteWorkout(workoutId: string): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }

    this.appData.workouts = (this.appData.workouts || []).filter(w => w.id !== workoutId);
    await this.saveAppData();
  }

  getWorkoutsByDateRange(startDate: string, endDate: string): Workout[] {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const workouts = this.appData.workouts || [];
    
    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= start && workoutDate <= end;
    });
  }

  getRecentWorkouts(limit: number = 10): Workout[] {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }

    const workouts = this.appData.workouts || [];
    return workouts
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  // Numeric Task Entry management methods
  getNumericTaskEntries(): NumericTaskEntry[] {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }
    return this.appData.numericTaskEntries || [];
  }

  async addNumericTaskEntry(entry: NumericTaskEntry): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }
    this.appData.numericTaskEntries = this.appData.numericTaskEntries || [];
    this.appData.numericTaskEntries.push(entry);
    await this.saveAppData();
  }

  getNumericTaskEntriesByTaskId(taskId: string): NumericTaskEntry[] {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }
    return (this.appData.numericTaskEntries || []).filter(entry => entry.taskId === taskId);
  }

  getNumericTaskEntriesByDate(date: string): NumericTaskEntry[] {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }
    return (this.appData.numericTaskEntries || []).filter(entry => entry.date === date);
  }

  getTodaysNumericTaskEntry(taskId: string): NumericTaskEntry | undefined {
    const today = new Date().toISOString().split('T')[0];
    return this.getNumericTaskEntriesByDate(today).find(entry => entry.taskId === taskId);
  }

  async updateTaskCurrentDayValue(taskId: string, value: number): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }
    
    const taskIndex = this.appData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      this.appData.tasks[taskIndex].currentDayValue = value;
      await this.saveAppData();
    }
  }

  async updateTaskPendingValue(taskId: string, value: number): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }
    
    const taskIndex = this.appData.tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      this.appData.tasks[taskIndex].pendingValue = value;
      await this.saveAppData();
    }
  }

  // Binary Task Entry management methods
  getBinaryTaskEntries(): BinaryTaskEntry[] {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }
    return this.appData.binaryTaskEntries || [];
  }

  async addBinaryTaskEntry(entry: BinaryTaskEntry): Promise<void> {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }
    this.appData.binaryTaskEntries = this.appData.binaryTaskEntries || [];
    this.appData.binaryTaskEntries.push(entry);
    await this.saveAppData();
  }

  getBinaryTaskEntriesByTaskId(taskId: string): BinaryTaskEntry[] {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }
    return (this.appData.binaryTaskEntries || []).filter(entry => entry.taskId === taskId);
  }

  getBinaryTaskEntriesByDate(date: string): BinaryTaskEntry[] {
    if (!this.appData) {
      throw new Error('App data not initialized');
    }
    return (this.appData.binaryTaskEntries || []).filter(entry => entry.date === date);
  }

  getTaskHistory(taskId: string): {
    binary: BinaryTaskEntry[];
    numeric: NumericTaskEntry[];
  } {
    return {
      binary: this.getBinaryTaskEntriesByTaskId(taskId),
      numeric: this.getNumericTaskEntriesByTaskId(taskId)
    };
  }

  // Get storage size info
  async getStorageInfo(): Promise<{ used: number; available: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
      
      return {
        used: totalSize,
        available: 5 * 1024 * 1024 - totalSize, // Assuming 5MB limit
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { used: 0, available: 5 * 1024 * 1024 };
    }
  }
}

export default StorageService;