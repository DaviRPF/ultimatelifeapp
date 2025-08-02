import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onComplete?: (taskId: string) => void;
  onFail?: (taskId: string) => void;
  onPress?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, onFail, onPress }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
  const hasHabitStreak = task.habit.enabled && task.habit.currentStreak > 0;

  const getDifficultyColor = () => {
    if (task.difficulty >= 80) return Colors.danger;
    if (task.difficulty >= 60) return Colors.warning;
    if (task.difficulty >= 40) return Colors.importance;
    return Colors.success;
  };

  const formatDueDate = () => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (dueDate.toDateString() === today.toDateString()) {
      return `Today${task.dueTime ? ` at ${task.dueTime}` : ''}`;
    }
    
    if (dueDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow${task.dueTime ? ` at ${task.dueTime}` : ''}`;
    }
    
    return dueDate.toLocaleDateString();
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        task.completed && styles.completedContainer,
        task.failed && styles.failedContainer,
        isOverdue && styles.overdueContainer
      ]}
      onPress={() => onPress?.(task)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[
            styles.title,
            task.completed && styles.completedText,
            task.failed && styles.failedText
          ]}>
            {task.title}
          </Text>
          <View style={styles.badges}>
            {task.habit.enabled && (
              <View style={[styles.badge, styles.habitBadge]}>
                <Text style={styles.badgeText}>🔥 {task.habit.currentStreak}/{task.habit.requiredDays}</Text>
              </View>
            )}
            {task.repetition !== 'one_time' && (
              <View style={[styles.badge, styles.repeatBadge]}>
                <Text style={styles.badgeText}>🔄</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor() + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor() }]}>
              {task.difficulty}%
            </Text>
          </View>
          <View style={styles.xpContainer}>
            <Text style={styles.xpText}>+{task.xp} XP</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      {task.description && (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      )}

      {/* Characteristics */}
      {task.characteristics.length > 0 && (
        <View style={styles.skillsContainer}>
          {task.characteristics.slice(0, 3).map((char, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{char}</Text>
            </View>
          ))}
          {task.characteristics.length > 3 && (
            <Text style={styles.moreSkills}>+{task.characteristics.length - 3} more</Text>
          )}
        </View>
      )}

      {/* Due Date */}
      {task.dueDate && (
        <View style={styles.dueDateContainer}>
          <Text style={[
            styles.dueDateText,
            isOverdue && styles.overdueText
          ]}>
            📅 {formatDueDate()}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {!task.completed && !task.failed && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => onComplete?.(task.id)}
          >
            <Text style={styles.completeButtonText}>✓ Complete</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.failButton]}
            onPress={() => onFail?.(task.id)}
          >
            <Text style={styles.failButtonText}>✗ Fail</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status */}
      {task.completed && (
        <View style={styles.statusContainer}>
          <Text style={styles.completedStatus}>✅ Completed</Text>
          {task.completedAt && (
            <Text style={styles.statusDate}>
              {new Date(task.completedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      {task.failed && (
        <View style={styles.statusContainer}>
          <Text style={styles.failedStatus}>❌ Failed</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completedContainer: {
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success + '30',
  },
  failedContainer: {
    backgroundColor: Colors.danger + '10',
    borderColor: Colors.danger + '30',
  },
  overdueContainer: {
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  failedText: {
    color: Colors.danger,
  },
  badges: {
    flexDirection: 'row',
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    marginLeft: Spacing.xs,
  },
  habitBadge: {
    backgroundColor: Colors.warning + '20',
  },
  repeatBadge: {
    backgroundColor: Colors.info + '20',
  },
  badgeText: {
    fontSize: FontSizes.xs,
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },
  xpContainer: {
    backgroundColor: Colors.xp + '20',
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  xpText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.xp,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  skillTag: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 4,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  skillText: {
    fontSize: FontSizes.xs,
    color: Colors.text,
  },
  moreSkills: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    alignSelf: 'center',
  },
  dueDateContainer: {
    marginBottom: Spacing.sm,
  },
  dueDateText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  overdueText: {
    color: Colors.danger,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: Colors.success,
    marginRight: Spacing.xs,
  },
  failButton: {
    backgroundColor: Colors.danger,
    marginLeft: Spacing.xs,
  },
  completeButtonText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  failButtonText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  completedStatus: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.success,
  },
  failedStatus: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.danger,
  },
  statusDate: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default TaskCard;