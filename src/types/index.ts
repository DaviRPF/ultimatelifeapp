// Core game types for Do It Now RPG
export interface Hero {
  level: number;
  xp: number;
  gold: number;
  xpMultiplier: number; // from unlocked achievements
  createdAt: string;
}

export interface CustomRepetition {
  interval: number;
  unit: 'days' | 'weeks' | 'months';
}

export interface HabitData {
  enabled: boolean; // Generate Habit active
  requiredDays: number;
  currentStreak: number;
  lastCompletedDate: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: number; // 10-100, never 0
  importance: number; // 10-100, never 0  
  fear: number; // 10-100, never 0
  xp: number; // calculated by proprietary algorithm
  skills: string[]; // multiple skills
  characteristics: string[]; // associated characteristics
  increasingSkills: string[]; // skills that go up when completed
  decreasingSkills: string[]; // skills that go down when completed
  dueDate?: string; // optional
  dueTime?: string; // specific time optional
  repetition: 'one_time' | 'continuous' | 'custom';
  customRepetition?: CustomRepetition;
  group: string; // for thematic organization
  completed: boolean;
  failed: boolean;
  createdAt: string;
  completedAt?: string;
  notificationEnabled: boolean;
  notificationIntervals: number[]; // multiple reminders
  autoFail: boolean;
  habit: HabitData;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  relatedTasks: string[]; // Task IDs that are part of this quest
  progress: number; // 0-100 percentage
  rewards: {
    xp: number;
    gold: number;
    unlockableContent?: string;
  };
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  notes: string[];
  skills: string[]; // Associated skills
  characteristics: string[]; // Associated characteristics
}

export interface Skill {
  level: number;
  xp: number;
  type: 'increasing' | 'decreasing';
  characteristics: string[]; // mandatory at least 1
}

export interface Characteristic {
  level: number;
  xp: number;
  associatedSkills: string[];
}

export interface Group {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  createdAt: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number; // in Gold
  purchased: boolean;
  timePurchased?: string;
  createdAt: string;
}

export interface DefaultAchievementCondition {
  type: 'level' | 'tasks_completed' | 'gold_earned';
  target: number;
}

export interface DefaultAchievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  xpMultiplier: number; // special reward
  condition: DefaultAchievementCondition;
}

export interface CustomAchievementCondition {
  type: 'task_executions' | 'skill_level' | 'characteristic_level';
  target: number;
  skillName?: string;
  characteristicName?: string;
}

export interface CustomAchievement {
  id: string;
  title: string; // created by user
  description: string; // created by user
  prize: string; // any text from user
  unlocked: boolean;
  unlockedAt?: string;
  conditions: CustomAchievementCondition[]; // multiple conditions possible
}

export interface Achievements {
  default: DefaultAchievement[];
  custom: CustomAchievement[];
}

// Main app data structure
export interface AppData {
  hero: Hero;
  tasks: Task[];
  quests: Quest[];
  skills: Record<string, Skill>;
  characteristics: Record<string, Characteristic>;
  groups: Group[];
  rewards: Reward[];
  achievements: Achievements;
}

// Attribute descriptions for sliders
export interface AttributeDescription {
  value: number;
  label: string;
  description: string;
}

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  CreateTask: undefined;
  EditTask: { taskId: string };
  CreateReward: undefined;
  CreateAchievement: undefined;
  CreateQuest: undefined;
  TaskDetails: { taskId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Skills: undefined;
  Rewards: undefined;
  Achievements: undefined;
  Groups: undefined;
  Settings: undefined;
};

// Component props types
export interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onFail: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export interface SkillBarProps {
  skillName: string;
  skill: Skill;
  showLevel?: boolean;
}

export interface AttributeSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  descriptions: AttributeDescription[];
  min?: number;
  max?: number;
}

export interface AchievementBadgeProps {
  achievement: DefaultAchievement | CustomAchievement;
  isCustom?: boolean;
}

// Utility types
export interface XPCalculationResult {
  xp: number;
  gold: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface BackupData {
  version: string;
  exportDate: string;
  data: AppData;
}

// Notification types
export interface NotificationConfig {
  taskId: string;
  title: string;
  body: string;
  trigger: Date;
  intervals: number[];
}