import { DefaultAchievement } from '../types';

export const DEFAULT_ACHIEVEMENTS: DefaultAchievement[] = [
  // Level-based achievements
  {
    id: 'level_5',
    title: 'Apprentice Hero',
    description: 'Reach level 5',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'level', target: 5 }
  },
  {
    id: 'level_10',
    title: 'Experienced Adventurer',
    description: 'Reach level 10',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'level', target: 10 }
  },
  {
    id: 'level_20',
    title: 'Veteran Warrior',
    description: 'Reach level 20',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'level', target: 20 }
  },
  {
    id: 'level_30',
    title: 'Master Hero',
    description: 'Reach level 30',
    unlocked: false,
    xpMultiplier: 1.25,
    condition: { type: 'level', target: 30 }
  },
  {
    id: 'level_50',
    title: 'Legendary Champion',
    description: 'Reach level 50',
    unlocked: false,
    xpMultiplier: 1.3,
    condition: { type: 'level', target: 50 }
  },
  
  // Task completion achievements
  {
    id: 'tasks_10',
    title: 'Getting Started',
    description: 'Complete 10 tasks',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'tasks_completed', target: 10 }
  },
  {
    id: 'tasks_50',
    title: 'Task Crusher',
    description: 'Complete 50 tasks',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'tasks_completed', target: 50 }
  },
  {
    id: 'tasks_100',
    title: 'Productivity Machine',
    description: 'Complete 100 tasks',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'tasks_completed', target: 100 }
  },
  {
    id: 'tasks_250',
    title: 'Task Destroyer',
    description: 'Complete 250 tasks',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'tasks_completed', target: 250 }
  },
  {
    id: 'tasks_500',
    title: 'Unstoppable Force',
    description: 'Complete 500 tasks',
    unlocked: false,
    xpMultiplier: 1.25,
    condition: { type: 'tasks_completed', target: 500 }
  },
  {
    id: 'tasks_1000',
    title: 'Legend of Productivity',
    description: 'Complete 1000 tasks',
    unlocked: false,
    xpMultiplier: 1.35,
    condition: { type: 'tasks_completed', target: 1000 }
  },
  
  // Gold achievements
  {
    id: 'gold_100',
    title: 'Coin Collector',
    description: 'Earn 100 gold',
    unlocked: false,
    xpMultiplier: 1.05,
    condition: { type: 'gold_earned', target: 100 }
  },
  {
    id: 'gold_500',
    title: 'Wealthy Adventurer',
    description: 'Earn 500 gold',
    unlocked: false,
    xpMultiplier: 1.1,
    condition: { type: 'gold_earned', target: 500 }
  },
  {
    id: 'gold_1000',
    title: 'Gold Hoarder',
    description: 'Earn 1000 gold',
    unlocked: false,
    xpMultiplier: 1.15,
    condition: { type: 'gold_earned', target: 1000 }
  },
  {
    id: 'gold_2500',
    title: 'Treasure Hunter',
    description: 'Earn 2500 gold',
    unlocked: false,
    xpMultiplier: 1.2,
    condition: { type: 'gold_earned', target: 2500 }
  },
  {
    id: 'gold_5000',
    title: 'Dragon\'s Hoard',
    description: 'Earn 5000 gold',
    unlocked: false,
    xpMultiplier: 1.3,
    condition: { type: 'gold_earned', target: 5000 }
  }
];