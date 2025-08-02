import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
// import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../constants/theme';
import GameEngine from '../../services/GameEngine';
import StorageService from '../../services/StorageService';
import { Task } from '../../types';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const [heroStats, setHeroStats] = useState<any>(null);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const gameEngine = GameEngine.getInstance();
  const storageService = StorageService.getInstance();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get hero stats
      const stats = gameEngine.getHeroStats();
      setHeroStats(stats);
      
      // Get today's tasks (due today or overdue)
      const allTasks = storageService.getTasks();
      const today = new Date().toDateString();
      const tasksForToday = allTasks.filter(task => {
        if (task.completed || task.failed) return false;
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate).toDateString();
        const taskDate = new Date(dueDate);
        const todayDate = new Date(today);
        
        return taskDate <= todayDate;
      });
      
      setTodaysTasks(tasksForToday);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const renderHeroCard = () => {
    if (!heroStats) return null;

    const progressBarWidth = width - (Spacing.md * 4); // Account for padding
    const progressWidth = (heroStats.xpProgress * progressBarWidth);

    return (
      <View style={styles.heroCard}>
        <View style={styles.heroGradient}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Hero Level {heroStats.level}</Text>
            <View style={styles.goldContainer}>
              <Text style={styles.goldText}>💰 {heroStats.gold}</Text>
            </View>
          </View>
          
          <View style={styles.xpContainer}>
            <Text style={styles.xpText}>
              XP: {heroStats.xp} / {heroStats.xpForNextLevel}
            </Text>
            <View style={styles.xpBarContainer}>
              <View style={styles.xpBarBackground}>
                <View 
                  style={[styles.xpBarFill, { width: progressWidth }]}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{heroStats.totalTasksCompleted}</Text>
              <Text style={styles.statLabel}>Quests Done</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{heroStats.xpMultiplier.toFixed(2)}x</Text>
              <Text style={styles.statLabel}>XP Multiplier</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTodaysQuests = () => {
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Today's Quests</Text>
        {todaysTasks.length === 0 ? (
          <Text style={styles.emptyText}>No quests due today! 🎉</Text>
        ) : (
          <View>
            {todaysTasks.slice(0, 5).map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle} numberOfLines={1}>
                    {task.title}
                  </Text>
                  <View style={styles.xpBadge}>
                    <Text style={styles.xpBadgeText}>{task.xp} XP</Text>
                  </View>
                </View>
                {task.dueTime && (
                  <Text style={styles.taskTime}>Due: {task.dueTime}</Text>
                )}
                {task.habit.enabled && (
                  <Text style={styles.habitText}>
                    🔥 Streak: {task.habit.currentStreak}/{task.habit.requiredDays}
                  </Text>
                )}
              </View>
            ))}
            {todaysTasks.length > 5 && (
              <Text style={styles.moreTasksText}>
                +{todaysTasks.length - 5} more quests...
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderQuickStats = () => {
    const pendingTasks = storageService.getTasks().filter(t => !t.completed && !t.failed).length;
    const overdueTasks = storageService.getTasks().filter(t => {
      if (t.completed || t.failed || !t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const now = new Date();
      return dueDate < now;
    }).length;

    return (
      <View style={styles.quickStatsContainer}>
        <View style={styles.quickStatCard}>
          <Text style={styles.quickStatValue}>{pendingTasks}</Text>
          <Text style={styles.quickStatLabel}>Pending</Text>
        </View>
        <View style={[styles.quickStatCard, overdueTasks > 0 && styles.overdueCard]}>
          <Text style={[styles.quickStatValue, overdueTasks > 0 && styles.overdueText]}>
            {overdueTasks}
          </Text>
          <Text style={[styles.quickStatLabel, overdueTasks > 0 && styles.overdueText]}>
            Overdue
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadDashboardData}
          tintColor={Colors.secondary}
        />
      }
    >
      {renderHeroCard()}
      {renderQuickStats()}
      {renderTodaysQuests()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroCard: {
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  heroGradient: {
    padding: Spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.textLight,
  },
  goldContainer: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  goldText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  xpContainer: {
    marginBottom: Spacing.md,
  },
  xpText: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  xpBarContainer: {
    marginBottom: Spacing.sm,
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: Colors.xp,
    borderRadius: BorderRadius.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.textLight,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    opacity: 0.8,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  overdueCard: {
    backgroundColor: Colors.error,
  },
  quickStatValue: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  quickStatLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  overdueText: {
    color: Colors.textLight,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  taskItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  taskTitle: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  xpBadge: {
    backgroundColor: Colors.xp,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  xpBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.textLight,
    fontWeight: 'bold',
  },
  taskTime: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  habitText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    fontWeight: '500',
  },
  moreTasksText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});

export default DashboardScreen;