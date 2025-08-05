import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DefaultAchievement, CustomAchievement } from '../../types';
import StorageService from '../../services/StorageService';
import GameEngine from '../../services/GameEngine';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

type TabType = 'default' | 'fitness' | 'custom';

const AchievementsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('default');
  const [defaultAchievements, setDefaultAchievements] = useState<DefaultAchievement[]>([]);
  const [fitnessAchievements, setFitnessAchievements] = useState<DefaultAchievement[]>([]);
  const [customAchievements, setCustomAchievements] = useState<CustomAchievement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAchievements = useCallback(async () => {
    try {
      const achievements = StorageService.getInstance().getAchievements();
      setDefaultAchievements(achievements.default);
      setFitnessAchievements(achievements.fitness || []);
      setCustomAchievements(achievements.custom);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  }, [loadAchievements]);

  useFocusEffect(
    useCallback(() => {
      loadAchievements();
    }, [])
  );

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const calculateProgress = (achievement: DefaultAchievement): number => {
    const storageService = StorageService.getInstance();
    const hero = storageService.getHero();
    const tasks = storageService.getTasks();
    
    switch (achievement.condition.type) {
      case 'level':
        return Math.min(hero.level / achievement.condition.target, 1);
      case 'tasks_completed':
        const completedTasks = tasks.filter(task => task.completed).length;
        return Math.min(completedTasks / achievement.condition.target, 1);
      case 'gold_earned':
        return Math.min(hero.gold / achievement.condition.target, 1);
      // For fitness achievements, we'll use the GameEngine to calculate current values
      case 'weight_lost':
      case 'weight_gained':
      case 'max_bench_press':
      case 'max_squat':
      case 'max_deadlift':
      case 'total_weight_lifted':
      case 'body_measurement':
      case 'workout_count':
      case 'cardio_minutes':
      case 'consecutive_workouts':
      case 'exercise_max_weight':
      case 'exercise_total_reps':
      case 'flexao_count':
      case 'barra_fixa_count':
        // For fitness achievements, return the current progress based on whether it's unlocked
        return achievement.unlocked ? 1 : 0.5; // Show partial progress for fitness achievements
      default:
        return 0;
    }
  };

  const getCurrentValue = (achievement: DefaultAchievement): number => {
    const storageService = StorageService.getInstance();
    const hero = storageService.getHero();
    const tasks = storageService.getTasks();
    
    switch (achievement.condition.type) {
      case 'level':
        return hero.level;
      case 'tasks_completed':
        return tasks.filter(task => task.completed).length;
      case 'gold_earned':
        return hero.gold;
      // For fitness achievements, we'll show 0 or the target value
      case 'weight_lost':
      case 'weight_gained':
      case 'max_bench_press':
      case 'max_squat':
      case 'max_deadlift':
      case 'total_weight_lifted':
      case 'body_measurement':
      case 'workout_count':
      case 'cardio_minutes':
      case 'consecutive_workouts':
      case 'exercise_max_weight':
      case 'exercise_total_reps':
      case 'flexao_count':
      case 'barra_fixa_count':
        return achievement.unlocked ? achievement.condition.target : 0;
      default:
        return 0;
    }
  };

  const getConditionDescription = (conditions: any[]): string => {
    return conditions.map(condition => {
      switch (condition.type) {
        case 'task_executions':
          return `Complete ${condition.target} tasks`;
        case 'skill_level':
          return `Reach level ${condition.target} in ${condition.skillName}`;
        case 'characteristic_level':
          return `Reach level ${condition.target} in ${condition.characteristicName}`;
        default:
          return `Unknown condition`;
      }
    }).join(', ');
  };

  const renderDefaultAchievement = ({ item }: { item: DefaultAchievement }) => {
    const progress = calculateProgress(item);
    const currentValue = getCurrentValue(item);
    const progressPercentage = Math.round(progress * 100);

    return (
      <View style={[styles.achievementCard, item.unlocked && styles.unlockedCard]}>
        <View style={styles.achievementHeader}>
          <View style={styles.achievementIcon}>
            <Ionicons
              name={item.unlocked ? 'trophy' : 'trophy-outline'}
              size={24}
              color={item.unlocked ? Colors.gold : Colors.textSecondary}
            />
          </View>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, item.unlocked && styles.unlockedText]}>
              {item.title}
            </Text>
            <Text style={styles.achievementDescription}>
              {item.description}
            </Text>
          </View>
          <View style={styles.xpMultiplier}>
            <Text style={styles.xpMultiplierText}>
              {item.xpMultiplier}x XP
            </Text>
          </View>
        </View>
        
        {!item.unlocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${progressPercentage}%` }]} 
              />
            </View>
            <Text style={styles.progressText}>
              {currentValue} / {item.condition.target} ({progressPercentage}%)
            </Text>
          </View>
        )}
        
        {item.unlocked && item.unlockedAt && (
          <Text style={styles.unlockedDate}>
            Unlocked: {new Date(item.unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  const renderCustomAchievement = ({ item }: { item: CustomAchievement }) => {
    return (
      <View style={[styles.achievementCard, item.unlocked && styles.unlockedCard]}>
        <View style={styles.achievementHeader}>
          <View style={styles.achievementIcon}>
            <Ionicons
              name={item.unlocked ? 'star' : 'star-outline'}
              size={24}
              color={item.unlocked ? Colors.secondary : Colors.textSecondary}
            />
          </View>
          <View style={styles.achievementInfo}>
            <Text style={[styles.achievementTitle, item.unlocked && styles.unlockedText]}>
              {item.title}
            </Text>
            <Text style={styles.achievementDescription}>
              {item.description}
            </Text>
            <Text style={styles.achievementPrize}>
              Prize: {item.prize}
            </Text>
          </View>
        </View>
        
        <View style={styles.conditionsContainer}>
          <Text style={styles.conditionsLabel}>Conditions:</Text>
          <Text style={styles.conditionsText}>
            {getConditionDescription(item.conditions)}
          </Text>
        </View>
        
        {item.unlocked && item.unlockedAt && (
          <Text style={styles.unlockedDate}>
            Unlocked: {new Date(item.unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'default') {
      return (
        <FlatList
          data={defaultAchievements}
          renderItem={renderDefaultAchievement}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      );
    } else if (activeTab === 'fitness') {
      return (
        <FlatList
          data={fitnessAchievements}
          renderItem={renderDefaultAchievement}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      );
    } else {
      return (
        <View style={styles.customTabContainer}>
          <FlatList
            data={customAchievements}
            renderItem={renderCustomAchievement}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateAchievement' as never)}
          >
            <Ionicons name="add" size={24} color={Colors.textLight} />
            <Text style={styles.addButtonText}>Add Custom Achievement</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'default' && styles.activeTab]}
          onPress={() => setActiveTab('default')}
        >
          <Ionicons
            name="trophy"
            size={20}
            color={activeTab === 'default' ? Colors.textLight : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'default' && styles.activeTabText
            ]}
          >
            Geral
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'fitness' && styles.activeTab]}
          onPress={() => setActiveTab('fitness')}
        >
          <Ionicons
            name="fitness"
            size={20}
            color={activeTab === 'fitness' ? Colors.textLight : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'fitness' && styles.activeTabText
            ]}
          >
            Fitness
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'custom' && styles.activeTab]}
          onPress={() => setActiveTab('custom')}
        >
          <Ionicons
            name="star"
            size={20}
            color={activeTab === 'custom' ? Colors.textLight : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'custom' && styles.activeTabText
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.textLight,
    fontWeight: 'bold',
  },
  customTabContainer: {
    flex: 1,
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  achievementCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unlockedCard: {
    borderColor: Colors.gold,
    backgroundColor: Colors.surfaceDark,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  achievementIcon: {
    marginRight: Spacing.sm,
    padding: Spacing.xs,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  unlockedText: {
    color: Colors.gold,
  },
  achievementDescription: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  achievementPrize: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  xpMultiplier: {
    backgroundColor: Colors.xp,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  xpMultiplierText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.textLight,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  conditionsContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8,
  },
  conditionsLabel: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  conditionsText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  unlockedDate: {
    fontSize: FontSizes.xs,
    color: Colors.gold,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    textAlign: 'right',
  },
  addButton: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 25,
    gap: Spacing.sm,
    elevation: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  addButtonText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.textLight,
  },
});

export default AchievementsScreen;