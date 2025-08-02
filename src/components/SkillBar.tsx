import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { Skill } from '../types';

interface SkillBarProps {
  skill: Skill;
  skillName: string;
  onPress?: () => void;
}

const SkillBar: React.FC<SkillBarProps> = ({ skill, skillName, onPress }) => {
  const progressPercentage = Math.min(100, (skill.xp / (skill.level * 100)) * 100);
  const nextLevelXP = skill.level * 100;
  
  const getSkillTypeColor = () => {
    switch (skill.type) {
      case 'increasing':
        return Colors.increasing;
      case 'decreasing':
        return Colors.decreasing;
      default:
        return Colors.primary;
    }
  };

  const getSkillTypeIcon = () => {
    switch (skill.type) {
      case 'increasing':
        return '↗️';
      case 'decreasing':
        return '↘️';
      default:
        return '⚡';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.skillIcon}>{getSkillTypeIcon()}</Text>
          <Text style={styles.skillName}>{skillName}</Text>
          <Text style={[styles.skillType, { color: getSkillTypeColor() }]}>
            {skill.type.toUpperCase()}
          </Text>
        </View>
        <View style={styles.levelContainer}>
          <Text style={styles.level}>LV {skill.level}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${progressPercentage}%`,
                backgroundColor: getSkillTypeColor()
              }
            ]} 
          />
        </View>
        <Text style={styles.xpText}>
          {skill.xp}/{nextLevelXP} XP
        </Text>
      </View>

      {skill.characteristics && skill.characteristics.length > 0 && (
        <View style={styles.characteristicsContainer}>
          <Text style={styles.characteristicsLabel}>Characteristics:</Text>
          <View style={styles.characteristicsList}>
            {skill.characteristics.map((char, index) => (
              <View key={index} style={styles.characteristicTag}>
                <Text style={styles.characteristicText}>{char}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  skillIcon: {
    fontSize: FontSizes.lg,
    marginRight: Spacing.xs,
  },
  skillName: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  skillType: {
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelContainer: {
    backgroundColor: Colors.gold + '20',
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  level: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.gold,
  },
  progressContainer: {
    marginBottom: Spacing.sm,
  },
  progressBackground: {
    height: 8,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  characteristicsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  characteristicsLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  characteristicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  characteristicTag: {
    backgroundColor: Colors.primary + '30',
    borderRadius: 6,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  characteristicText: {
    fontSize: FontSizes.xs,
    color: Colors.text,
  },
});

export default SkillBar;