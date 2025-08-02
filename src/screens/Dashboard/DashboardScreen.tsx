import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
// import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../constants/theme';
import GameEngine from '../../services/GameEngine';
import StorageService from '../../services/StorageService';
import HeroAvatar, { getAllHeroEvolutions, HeroEvolution } from '../../components/HeroAvatar';
import { Task, Hero } from '../../types';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const [heroStats, setHeroStats] = useState<any>(null);
  const [hero, setHero] = useState<Hero | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [newName, setNewName] = useState('');

  const gameEngine = GameEngine.getInstance();
  const storageService = StorageService.getInstance();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Initialize app data
      await storageService.initializeAppData();
      const appData = await storageService.getAppData();
      
      // Get hero stats and data
      const stats = gameEngine.getHeroStats();
      setHeroStats(stats);
      setHero(appData.hero);
      
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

  const handleEditName = () => {
    if (hero) {
      setNewName(hero.name);
      setShowNameModal(true);
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a valid name');
      return;
    }

    try {
      await storageService.updateHero({ name: newName.trim() });
      await loadDashboardData();
      setShowNameModal(false);
      setNewName('');
      Alert.alert('Success', 'Hero name updated!');
    } catch (error) {
      console.error('Error updating hero name:', error);
      Alert.alert('Error', 'Failed to update hero name');
    }
  };

  const handleCancelName = () => {
    setShowNameModal(false);
    setNewName('');
  };

  const renderHeroCard = () => {
    if (!heroStats || !hero) return null;

    const progressBarWidth = width - (Spacing.md * 4); // Account for padding
    const progressWidth = (heroStats.xpProgress * progressBarWidth);

    return (
      <View style={styles.heroCard}>
        <View style={styles.heroGradient}>
          {/* Hero Profile Section */}
          <TouchableOpacity 
            style={styles.heroProfileSection}
            onPress={() => setShowEvolutionModal(true)}
            activeOpacity={0.8}
          >
            <HeroAvatar level={heroStats.level} size="large" />
            <View style={styles.heroInfo}>
              <TouchableOpacity onPress={handleEditName} style={styles.nameContainer}>
                <Text style={styles.heroName}>{hero.name}</Text>
                <Text style={styles.editHint}>✏️ Tap to edit</Text>
              </TouchableOpacity>
              <Text style={styles.heroLevel}>Level {heroStats.level} Hero</Text>
              {hero.weight && (
                <Text style={styles.heroWeight}>⚖️ {hero.weight.toFixed(1)} kg</Text>
              )}
              <Text style={styles.evolutionHint}>🔮 Tap to see evolution</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.heroHeader}>
            <View style={styles.goldContainer}>
              <Text style={styles.goldText}>💰 {heroStats.gold} Gold</Text>
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
    <>
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

      {/* Hero Evolution Modal */}
      <Modal
        visible={showEvolutionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEvolutionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.evolutionModalContent}>
            <View style={styles.evolutionHeader}>
              <Text style={styles.evolutionTitle}>Hero Evolution Path</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEvolutionModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.evolutionScrollView}>
              <Text style={styles.debugText}>
                Current Hero Level: {heroStats?.level || 'Loading...'}
              </Text>
              <Text style={styles.debugText}>
                Total Evolutions: {getAllHeroEvolutions().length}
              </Text>
              
              {getAllHeroEvolutions().map((evolution, index) => {
                const currentLevel = heroStats?.level || 1;
                const isCurrentLevel = currentLevel >= evolution.level && 
                  (index === getAllHeroEvolutions().length - 1 || currentLevel < getAllHeroEvolutions()[index + 1].level);
                const isUnlocked = currentLevel >= evolution.level;
                
                return (
                  <View 
                    key={evolution.level} 
                    style={styles.simpleEvolutionItem}
                  >
                    <Text style={styles.evolutionEmoji}>{evolution.emoji}</Text>
                    <View style={styles.evolutionTextContainer}>
                      <Text style={styles.evolutionName}>
                        {evolution.title} {isCurrentLevel && '(Current)'}
                      </Text>
                      <Text style={styles.evolutionLevel}>
                        Level {evolution.level} {isUnlocked ? '✅' : '🔒'}
                      </Text>
                      {!isUnlocked && (
                        <Text style={styles.levelsToGo}>
                          {evolution.level - currentLevel} levels to go
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancelName}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Hero Name</Text>
            
            <TextInput
              style={styles.nameInput}
              placeholder="Enter hero name"
              placeholderTextColor={Colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
              maxLength={20}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelName}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveName}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    backgroundColor: Colors.primary,
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
  // Hero Profile Section Styles
  heroProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameContainer: {
    marginBottom: Spacing.xs,
  },
  heroName: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.textLight,
    marginBottom: 2,
  },
  editHint: {
    fontSize: FontSizes.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  heroLevel: {
    fontSize: FontSizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: Spacing.xs,
  },
  heroWeight: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  evolutionHint: {
    fontSize: FontSizes.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 8,
    padding: Spacing.md,
    flex: 1,
    marginRight: Spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
    flex: 1,
    marginLeft: Spacing.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.textLight,
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  // Evolution Modal Styles
  evolutionModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    width: '95%',
    height: '80%',
    overflow: 'hidden',
  },
  evolutionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  evolutionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.textLight,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.textLight,
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  evolutionScrollView: {
    flex: 1,
    padding: Spacing.md,
  },
  debugText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: 4,
  },
  simpleEvolutionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  evolutionTextContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  evolutionEmoji: {
    fontSize: 32,
    textAlign: 'center',
    minWidth: 40,
  },
  evolutionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  currentEvolutionItem: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  lockedEvolutionItem: {
    opacity: 0.6,
    borderColor: Colors.textSecondary,
  },
  evolutionAvatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  evolutionAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  evolutionEmoji: {
    fontSize: 24,
    textAlign: 'center',
  },
  evolutionLevelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  evolutionLevelText: {
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
    color: Colors.textLight,
  },
  evolutionInfo: {
    flex: 1,
  },
  evolutionName: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  currentEvolutionName: {
    color: Colors.primary,
  },
  lockedEvolutionName: {
    color: Colors.textSecondary,
  },
  evolutionLevel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  lockedText: {
    color: Colors.textSecondary,
  },
  currentHeroText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  levelsToGo: {
    fontSize: FontSizes.sm,
    color: Colors.warning,
    fontWeight: '500',
  },
});

export default DashboardScreen;