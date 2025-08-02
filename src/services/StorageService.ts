import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, Hero, Task, Quest, Skill, Characteristic, Group, Reward, Achievements, BackupData } from '../types';
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