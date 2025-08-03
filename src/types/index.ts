// Core game types for Do It Now RPG
export interface Hero {
  level: number;
  xp: number;
  gold: number;
  xpMultiplier: number; // from unlocked achievements
  createdAt: string;
  name: string;
  weight?: number; // Current weight in kg
  bodyMeasurements?: BodyMeasurements; // Current body measurements
}

export interface WeightEntry {
  id: string;
  weight: number; // in kg
  date: string; // ISO date
  notes?: string;
}

export interface BodyMeasurements {
  // Membros superiores (em cm)
  bracoRelaxado?: number;        // na maior circunferência do braço, com o membro solto
  bracoContraido?: number;       // na maior circunferência do braço, flexionando o bíceps
  antebraco?: number;            // na maior circunferência, próximo ao cotovelo
  
  // Tronco (em cm)
  peitoral?: number;             // linha dos mamilos, no final da expiração
  abdomen?: number;              // cintura, na menor circunferência (altura do umbigo)
  gluteo?: number;               // quadril, na maior circunferência dos glúteos
  deltoides?: number;            // ombros, ao redor da maior circunferência
  
  // Membros inferiores (em cm)
  perna?: number;                // coxa, na maior circunferência (terço superior)
  panturrilha?: number;          // na maior circunferência da "batata da perna"
}

export interface BodyMeasurementEntry {
  id: string;
  measurements: BodyMeasurements;
  date: string; // ISO date
  notes?: string;
}

// Workout System
export interface Exercise {
  id: string;
  name: string;
  category: 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'cardio';
  muscleGroups: string[]; // Primary muscle groups
  equipment?: string;
  instructions?: string;
}

export type SetType = 'normal' | 'warmup' | 'failure';

export interface WorkoutSet {
  id: string;
  reps: number;
  weight?: number; // in kg
  type: SetType;
  restTime?: number; // in seconds
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string; // Cached for display
  sets: WorkoutSet[];
  notes?: string;
}

export type WorkoutType = 'strength' | 'cardio';

export interface Workout {
  id: string;
  name: string;
  type: WorkoutType;
  date: string; // ISO date
  startTime?: string; // ISO date time
  endTime?: string; // ISO date time
  exercises: WorkoutExercise[];
  notes?: string;
  totalDuration?: number; // in minutes
}

export interface CustomRepetition {
  interval: number;
  unit: 'days' | 'weeks' | 'months';
}

export interface WeeklyRepetition {
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, 2=Tuesday, etc.
}

export type RepetitionType = 
  | 'one_time' 
  | 'daily' 
  | 'weekdays' // Monday to Friday
  | 'weekends' // Saturday and Sunday
  | 'weekly' // Custom days of week
  | 'custom'; // Custom interval

export interface HabitData {
  enabled: boolean; // Generate Habit active
  requiredDays: number;
  currentStreak: number;
  lastCompletedDate: string;
}

export type TaskType = 'binary' | 'numeric';

export interface NumericTaskConfig {
  unit: string; // e.g., 'ml', 'páginas', 'minutos'
  minimumTarget: number; // valor mínimo para considerar sucesso
  dailyTarget?: number; // meta diária opcional
}

export interface NumericTaskEntry {
  id: string;
  taskId: string;
  value: number;
  date: string; // ISO date (YYYY-MM-DD)
  timestamp: string; // ISO datetime when value was entered
  autoSubmitted: boolean; // true if submitted automatically at end of day
}

export type TaskExecutionStatus = 'completed' | 'failed' | 'skipped';

export interface BinaryTaskEntry {
  id: string;
  taskId: string;
  status: TaskExecutionStatus;
  date: string; // ISO date (YYYY-MM-DD)
  timestamp: string; // ISO datetime when action was taken
  xpGained?: number; // XP gained from completion (0 for failed/skipped)
  goldGained?: number; // Gold gained from completion (0 for failed/skipped)
}

export interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: number; // 10-100, never 0
  importance: number; // 10-100, never 0  
  fear: number; // 10-100, never 0
  xp: number; // calculated by proprietary algorithm
  skills: string[]; // skills that will gain XP
  skillImpacts?: { [key: string]: number }; // impact percentage (0-100) for each skill
  dueDate?: string; // optional
  dueTime?: string; // specific time optional
  repetition: RepetitionType;
  customRepetition?: CustomRepetition;
  weeklyRepetition?: WeeklyRepetition;
  group: string; // for thematic organization
  completed: boolean;
  failed: boolean;
  createdAt: string;
  completedAt?: string;
  notificationEnabled: boolean;
  notificationIntervals: number[]; // multiple reminders
  autoFail: boolean;
  habit: HabitData;
  infinite: boolean; // can be completed multiple times
  completionCount?: number; // for infinite tasks
  lastCompletedAt?: string; // for infinite tasks
  
  // Numeric task properties
  taskType: TaskType; // 'binary' or 'numeric'
  numericConfig?: NumericTaskConfig; // only for numeric tasks
  currentDayValue?: number; // current accumulated value for today (numeric tasks)
  pendingValue?: number; // value entered but not yet submitted (numeric tasks)
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
}

export interface Characteristic {
  level: number;
  xp: number;
  type: 'increasing' | 'decreasing';
  skills: string[]; // associated specific skills
}

export interface Skill {
  level: number;
  xp: number;
  type: 'increasing' | 'decreasing';
  characteristic?: string; // belongs to one characteristic
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
  // Stock system
  hasInfiniteStock: boolean; // true = infinite stock, false = finite stock
  totalStock?: number; // only used when hasInfiniteStock is false
  currentStock?: number; // only used when hasInfiniteStock is false
  timesPurchased: number; // how many times this reward has been purchased
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
  weightEntries: WeightEntry[];
  bodyMeasurementEntries: BodyMeasurementEntry[];
  workouts: Workout[];
  numericTaskEntries: NumericTaskEntry[]; // histórico de valores de tasks numéricas
  binaryTaskEntries: BinaryTaskEntry[]; // histórico de execuções de tasks binárias
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
  // CreateTask: undefined; // REMOVIDO - usando CreateItem
  EditTask: { taskId: string };
  CreateReward: undefined;
  CreateAchievement: undefined;
  // CreateQuest: undefined; // REMOVIDO - usando CreateItem
  TaskDetails: { taskId: string };
  BodyMeasurements: undefined;
  CreateWorkout: undefined;
  WorkoutHistory: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Skills: undefined;
  Rewards: undefined;
  Achievements: undefined;
  Fitness: undefined;
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