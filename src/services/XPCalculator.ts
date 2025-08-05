import { Task, Hero, Skill, Characteristic, XPCalculationResult } from '../types';

class XPCalculator {
  private static instance: XPCalculator;

  private constructor() {}

  static getInstance(): XPCalculator {
    if (!XPCalculator.instance) {
      XPCalculator.instance = new XPCalculator();
    }
    return XPCalculator.instance;
  }

  // Proprietary XP calculation algorithm
  calculateTaskXP(difficulty: number, importance: number, fear: number): XPCalculationResult {
    // Ensure values are within valid range (10-100)
    const validDifficulty = Math.max(10, Math.min(100, difficulty));
    const validImportance = Math.max(10, Math.min(100, importance));
    const validFear = Math.max(10, Math.min(100, fear));

    // Base XP calculation: weighted average with bonuses
    const baseAverage = (validDifficulty + validImportance + validFear) / 3;
    
    // Apply scaling factors for each attribute
    const difficultyFactor = this.getDifficultyMultiplier(validDifficulty);
    const importanceFactor = this.getImportanceMultiplier(validImportance);
    const fearFactor = this.getFearMultiplier(validFear);
    
    // Compound the factors for exponential growth
    const compoundFactor = difficultyFactor * importanceFactor * fearFactor;
    
    // Calculate base XP with diminishing returns at extreme values
    let baseXP = baseAverage * compoundFactor;
    
    // Bonus for high values in multiple attributes
    const highAttributeBonus = this.calculateHighAttributeBonus(validDifficulty, validImportance, validFear);
    baseXP += highAttributeBonus;
    
    // Apply level progression scaling (higher values = exponentially more XP)
    const progressionMultiplier = this.getProgressionMultiplier(baseAverage);
    const finalXP = Math.round(baseXP * progressionMultiplier);
    
    // Gold is derived from XP (roughly 10-20% of XP value)
    const goldPercentage = 0.1 + (baseAverage / 1000); // 10% to 20% based on task difficulty
    const gold = Math.round(finalXP * goldPercentage);

    return {
      xp: Math.max(1, finalXP), // Minimum 1 XP
      gold: Math.max(1, gold)   // Minimum 1 Gold
    };
  }

  // Difficulty scaling: higher difficulty = exponential XP growth
  private getDifficultyMultiplier(difficulty: number): number {
    // Scale from 0.5x to 3.0x based on difficulty
    const normalized = (difficulty - 10) / 90; // 0 to 1
    return 0.5 + (normalized * normalized * 2.5); // Quadratic scaling
  }

  // Importance scaling: higher importance = more consistent XP
  private getImportanceMultiplier(importance: number): number {
    // Scale from 0.7x to 2.5x based on importance
    const normalized = (importance - 10) / 90; // 0 to 1
    return 0.7 + (normalized * 1.8); // Linear scaling
  }

  // Fear scaling: higher fear = bonus XP for overcoming anxiety
  private getFearMultiplier(fear: number): number {
    // Scale from 0.8x to 2.8x based on fear level
    const normalized = (fear - 10) / 90; // 0 to 1
    return 0.8 + (Math.pow(normalized, 1.5) * 2.0); // Power scaling for courage bonus
  }

  // Bonus for having multiple high attributes (80+)
  private calculateHighAttributeBonus(difficulty: number, importance: number, fear: number): number {
    const highThreshold = 80;
    const highAttributes = [difficulty, importance, fear].filter(attr => attr >= highThreshold);
    
    // Bonus XP for multiple high attributes
    if (highAttributes.length >= 3) return 50; // All high
    if (highAttributes.length >= 2) return 25; // Two high
    if (highAttributes.length >= 1) return 10; // One high
    return 0;
  }

  // Progression multiplier for high-level tasks
  private getProgressionMultiplier(averageAttribute: number): number {
    // Higher average attributes give progressively more XP
    if (averageAttribute >= 90) return 2.0;
    if (averageAttribute >= 80) return 1.8;
    if (averageAttribute >= 70) return 1.6;
    if (averageAttribute >= 60) return 1.4;
    if (averageAttribute >= 50) return 1.2;
    return 1.0;
  }

  // Calculate level from total XP using exponential progression
  calculateLevelFromXP(totalXP: number): number {
    if (totalXP <= 0) return 1;
    
    // Exponential level progression: Level = floor(sqrt(totalXP / 100)) + 1
    // This means: Level 1 = 0-99 XP, Level 2 = 100-399 XP, Level 3 = 400-899 XP, etc.
    const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
    return Math.max(1, level);
  }

  // Calculate XP required for next level
  calculateXPForNextLevel(currentLevel: number): number {
    const nextLevel = currentLevel + 1;
    return Math.pow(nextLevel - 1, 2) * 100;
  }

  // Calculate XP required for current level (minimum)
  calculateXPForCurrentLevel(currentLevel: number): number {
    if (currentLevel <= 1) return 0;
    return Math.pow(currentLevel - 1, 2) * 100;
  }

  // Calculate progress within current level (0-1)
  calculateLevelProgress(totalXP: number, currentLevel: number): number {
    const currentLevelXP = this.calculateXPForCurrentLevel(currentLevel);
    const nextLevelXP = this.calculateXPForNextLevel(currentLevel);
    const progressXP = totalXP - currentLevelXP;
    const levelRange = nextLevelXP - currentLevelXP;
    
    return Math.max(0, Math.min(1, progressXP / levelRange));
  }

  // Apply XP multiplier from achievements
  applyXPMultiplier(baseXP: number, multiplier: number): number {
    return Math.round(baseXP * multiplier);
  }

  // Calculate skill XP gain/loss from task completion
  calculateSkillXP(taskXP: number, skillType: 'increasing' | 'decreasing', taskCompleted: boolean): number {
    // Skills gain/lose XP based on task outcome and type
    const baseSkillXP = Math.round(taskXP * 0.3); // 30% of task XP
    
    if (skillType === 'increasing') {
      return taskCompleted ? baseSkillXP : -Math.round(baseSkillXP * 0.5);
    } else {
      return taskCompleted ? -Math.round(baseSkillXP * 0.7) : baseSkillXP;
    }
  }

  // Calculate skill level from skill XP
  calculateSkillLevel(skillXP: number): number {
    if (skillXP <= 0) return 1;
    
    // Skill progression: Level = floor(skillXP / 50) + 1
    // Faster progression than hero levels
    return Math.floor(skillXP / 50) + 1;
  }

  // Calculate characteristic XP from associated skills
  calculateCharacteristicXP(associatedSkills: Skill[]): number {
    if (associatedSkills.length === 0) return 0;
    
    // Characteristic XP is average of associated skills' XP
    const totalSkillXP = associatedSkills.reduce((sum, skill) => sum + skill.xp, 0);
    return Math.round(totalSkillXP / associatedSkills.length);
  }

  // Calculate characteristic XP from skills with custom impact percentages
  calculateCharacteristicXPWithImpacts(characteristicName: string, allSkills: { [skillName: string]: Skill }): number {
    let totalWeightedXP = 0;
    let totalWeight = 0;

    // Find all skills that impact this characteristic
    Object.entries(allSkills).forEach(([skillName, skill]) => {
      // Check both new impact system and old characteristic system
      const impactPercentage = skill.characteristicImpacts?.[characteristicName] || 
                              (skill.characteristic === characteristicName ? 100 : 0);
      
      if (impactPercentage > 0) {
        const weight = impactPercentage / 100; // Convert percentage to decimal
        totalWeightedXP += skill.xp * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalWeightedXP / totalWeight) : 0;
  }

  // Calculate incremental XP gain for characteristic based on skill XP gain and impact
  calculateCharacteristicXPGain(skillXPGain: number, skillName: string, characteristicName: string, skill: Skill): number {
    // Get the impact percentage for this characteristic from this skill
    const impactPercentage = skill.characteristicImpacts?.[characteristicName] || 
                            (skill.characteristic === characteristicName ? 100 : 0);
    
    if (impactPercentage <= 0) return 0;
    
    // Apply the impact percentage to the skill XP gain
    const characteristicXPGain = Math.round(skillXPGain * (impactPercentage / 100));
    
    console.log(`🔍 CharXP Calc: Skill ${skillName} -> Char ${characteristicName}: ${skillXPGain} XP * ${impactPercentage}% = ${characteristicXPGain} XP`);
    
    return characteristicXPGain;
  }

  // Check if task should auto-fail based on deadline
  shouldTaskAutoFail(task: Task): boolean {
    if (!task.autoFail || !task.dueDate) return false;
    
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    
    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      dueDate.setHours(hours, minutes, 0, 0);
    } else {
      dueDate.setHours(23, 59, 59, 999); // End of day if no time specified
    }
    
    return now > dueDate;
  }

  // Calculate habit streak bonus XP
  calculateHabitStreakBonus(currentStreak: number, requiredDays: number): number {
    if (currentStreak <= 0) return 0;
    
    // Bonus XP for maintaining streaks
    const streakPercent = currentStreak / requiredDays;
    const baseBonus = 10;
    
    if (streakPercent >= 1.0) return baseBonus * 3; // Completed habit
    if (streakPercent >= 0.8) return baseBonus * 2; // Near completion
    if (streakPercent >= 0.5) return baseBonus * 1.5; // Halfway
    if (streakPercent >= 0.25) return baseBonus; // Quarter way
    
    return Math.round(baseBonus * streakPercent);
  }

  // Validate task attributes before XP calculation
  validateTaskAttributes(difficulty: number, importance: number, fear: number): boolean {
    return (
      difficulty >= 10 && difficulty <= 100 &&
      importance >= 10 && importance <= 100 &&
      fear >= 10 && fear <= 100
    );
  }

  // Get XP breakdown for display purposes
  getXPBreakdown(difficulty: number, importance: number, fear: number): {
    baseXP: number;
    difficultyBonus: number;
    importanceBonus: number;
    fearBonus: number;
    attributeBonus: number;
    progressionBonus: number;
    total: number;
  } {
    const validDifficulty = Math.max(10, Math.min(100, difficulty));
    const validImportance = Math.max(10, Math.min(100, importance));
    const validFear = Math.max(10, Math.min(100, fear));

    const baseAverage = (validDifficulty + validImportance + validFear) / 3;
    const baseXP = baseAverage;
    
    const difficultyMultiplier = this.getDifficultyMultiplier(validDifficulty);
    const importanceMultiplier = this.getImportanceMultiplier(validImportance);
    const fearMultiplier = this.getFearMultiplier(validFear);
    
    const difficultyBonus = baseXP * (difficultyMultiplier - 1);
    const importanceBonus = baseXP * (importanceMultiplier - 1);
    const fearBonus = baseXP * (fearMultiplier - 1);
    
    const attributeBonus = this.calculateHighAttributeBonus(validDifficulty, validImportance, validFear);
    const progressionMultiplier = this.getProgressionMultiplier(baseAverage);
    const progressionBonus = baseXP * (progressionMultiplier - 1);
    
    const total = this.calculateTaskXP(validDifficulty, validImportance, validFear).xp;
    
    return {
      baseXP: Math.round(baseXP),
      difficultyBonus: Math.round(difficultyBonus),
      importanceBonus: Math.round(importanceBonus),
      fearBonus: Math.round(fearBonus),
      attributeBonus,
      progressionBonus: Math.round(progressionBonus),
      total
    };
  }
}

export default XPCalculator;