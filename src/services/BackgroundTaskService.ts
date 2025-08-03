import { AppState, AppStateStatus } from 'react-native';
import StorageService from './StorageService';
import { NumericTaskEntry, Task } from '../types';

class BackgroundTaskService {
  private static instance: BackgroundTaskService;
  private storageService: StorageService;
  private lastActiveDate: string | null = null;

  private constructor() {
    this.storageService = StorageService.getInstance();
    this.initializeAppStateListener();
    this.lastActiveDate = new Date().toISOString().split('T')[0];
  }

  static getInstance(): BackgroundTaskService {
    if (!BackgroundTaskService.instance) {
      BackgroundTaskService.instance = new BackgroundTaskService();
    }
    return BackgroundTaskService.instance;
  }

  private initializeAppStateListener() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      await this.checkForDayChange();
    }
  };

  private async checkForDayChange() {
    const currentDate = new Date().toISOString().split('T')[0];
    
    if (this.lastActiveDate && this.lastActiveDate !== currentDate) {
      // Day has changed, process pending numeric tasks
      await this.processEndOfDayTasks(this.lastActiveDate);
    }
    
    this.lastActiveDate = currentDate;
  }

  // Process all numeric tasks that have pending values at the end of the day
  async processEndOfDayTasks(date: string) {
    try {
      await this.storageService.initializeAppData();
      const tasks = this.storageService.getTasks();
      
      for (const task of tasks) {
        if (task.taskType === 'numeric' && task.pendingValue && task.pendingValue > 0) {
          await this.autoSubmitNumericTask(task, date);
        }
      }
    } catch (error) {
      console.error('Error processing end of day tasks:', error);
    }
  }

  private async autoSubmitNumericTask(task: Task, date: string) {
    try {
      if (!task.pendingValue || task.pendingValue <= 0) return;

      // Create numeric task entry with auto-submitted flag
      const entry: NumericTaskEntry = {
        id: `auto_${Date.now()}_${task.id}`,
        taskId: task.id,
        value: task.pendingValue,
        date,
        timestamp: new Date().toISOString(),
        autoSubmitted: true,
      };

      await this.storageService.addNumericTaskEntry(entry);

      // Update task's current day value and clear pending value
      const newCurrentValue = (task.currentDayValue || 0) + task.pendingValue;
      await this.storageService.updateTaskCurrentDayValue(task.id, newCurrentValue);
      await this.storageService.updateTaskPendingValue(task.id, 0);

      console.log(`Auto-submitted ${task.pendingValue} ${task.numericConfig?.unit} for task: ${task.title}`);
    } catch (error) {
      console.error(`Error auto-submitting task ${task.id}:`, error);
    }
  }

  // Manually trigger auto-submit for all pending tasks (for testing or manual trigger)
  async triggerAutoSubmitForToday() {
    const today = new Date().toISOString().split('T')[0];
    await this.processEndOfDayTasks(today);
  }

  // Check if we need to reset daily values for repeating numeric tasks
  async resetDailyValuesForRepeatingTasks() {
    try {
      await this.storageService.initializeAppData();
      const tasks = this.storageService.getTasks();
      const today = new Date().toISOString().split('T')[0];
      
      for (const task of tasks) {
        if (task.taskType === 'numeric' && task.repetition !== 'one_time') {
          // Check if this task should be active today
          if (this.shouldTaskBeActiveToday(task)) {
            // Reset daily values if it's a new day
            await this.storageService.updateTaskCurrentDayValue(task.id, 0);
            await this.storageService.updateTaskPendingValue(task.id, 0);
          }
        }
      }
    } catch (error) {
      console.error('Error resetting daily values:', error);
    }
  }

  private shouldTaskBeActiveToday(task: Task): boolean {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.

    switch (task.repetition) {
      case 'daily':
        return true;
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'weekends':
        return dayOfWeek === 0 || dayOfWeek === 6;
      case 'weekly':
        if (task.weeklyRepetition?.daysOfWeek) {
          return task.weeklyRepetition.daysOfWeek.includes(dayOfWeek);
        }
        return false;
      case 'custom':
        // For custom repetition, you might want to implement more complex logic
        return true; // Simplified for now
      default:
        return false;
    }
  }

  // Clean up old numeric task entries (keep only last 30 days)
  async cleanupOldEntries() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
      
      const allEntries = this.storageService.getNumericTaskEntries();
      const recentEntries = allEntries.filter(entry => entry.date >= cutoffDate);
      
      // This would require a method to replace all entries
      // For now, we'll leave this as a TODO for the storage service
      console.log(`Would clean up ${allEntries.length - recentEntries.length} old entries`);
    } catch (error) {
      console.error('Error cleaning up old entries:', error);
    }
  }

  destroy() {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }
}

export default BackgroundTaskService;