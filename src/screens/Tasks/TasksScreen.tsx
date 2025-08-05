import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Animated,
  Dimensions,
  ScrollView
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Task, RootStackParamList, RepetitionType, NumericTaskEntry } from '../../types';
import StorageService from '../../services/StorageService';
import GameEngine from '../../services/GameEngine';
import AnimatedTaskCard from '../../components/AnimatedTaskCard';
import AnimatedFeedback from '../../components/AnimatedFeedback';
import FloatingXP from '../../components/FloatingXP';
import SoundService from '../../services/SoundService';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

type TaskStatus = 'all' | 'today' | 'active' | 'completed' | 'failed';

interface AchievementNotification {
  id: string;
  title: string;
  visible: boolean;
}

interface FloatingXPData {
  id: string;
  xp: number;
  startX: number;
  startY: number;
  visible: boolean;
}

interface FeedbackData {
  visible: boolean;
  type: 'taskComplete' | 'levelUp' | 'xpGain';
  xpAmount?: number;
  message?: string;
}

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Helper function to check if a task should be done today
const isTaskForToday = (task: Task): boolean => {
  if (!task || task.completed || task.failed) return false;
  if (!task.repetition) return false;

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, etc.

  switch (task.repetition) {
    case 'one_time':
      // Check if due date is today or overdue
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        return dueDate <= today;
      }
      return false;

    case 'daily':
      return true;

    case 'weekdays':
      // Monday to Friday (1-5)
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case 'weekends':
      // Saturday and Sunday (0, 6)
      return dayOfWeek === 0 || dayOfWeek === 6;

    case 'weekly':
      // Check if today is in the selected days
      if (task.weeklyRepetition?.daysOfWeek) {
        return task.weeklyRepetition.daysOfWeek.includes(dayOfWeek);
      }
      return false;

    case 'custom':
      // For custom repetition, check if it's time based on interval
      if (task.customRepetition) {
        const createdDate = new Date(task.createdAt);
        const daysSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (task.customRepetition.unit === 'days') {
          return daysSinceCreated % task.customRepetition.interval === 0;
        }
        // Add more logic for weeks/months if needed
      }
      return false;

    default:
      return false;
  }
};

const TasksScreen = () => {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [achievementNotification, setAchievementNotification] = useState<AchievementNotification | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [floatingXPs, setFloatingXPs] = useState<FloatingXPData[]>([]);
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({ visible: false, type: 'taskComplete' });
  
  const soundService = SoundService.getInstance();

  const storageService = StorageService.getInstance();
  const gameEngine = GameEngine.getInstance();

  // Load tasks data
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      await storageService.initializeAppData();
      const allTasks = storageService.getTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter tasks based on status
  const filterTasks = useCallback(() => {
    // Filter out any invalid tasks first
    const validTasks = tasks.filter(task => 
      task && 
      typeof task === 'object' && 
      task.id && 
      task.title &&
      task.repetition
    );
    
    let filtered = validTasks;
    
    switch (filter) {
      case 'today':
        filtered = validTasks.filter(task => isTaskForToday(task));
        break;
      case 'active':
        filtered = validTasks.filter(task => !task.completed && !task.failed);
        break;
      case 'completed':
        filtered = validTasks.filter(task => task.completed);
        break;
      case 'failed':
        filtered = validTasks.filter(task => task.failed);
        break;
      default:
        filtered = validTasks;
    }
    
    // Sort by priority: active tasks first, then by due date, then by creation date
    filtered.sort((a, b) => {
      // Active tasks first
      if (!a.completed && !a.failed && (b.completed || b.failed)) return -1;
      if ((a.completed || a.failed) && !b.completed && !b.failed) return 1;
      
      // Then by due date (overdue first, then by proximity)
      if (a.dueDate && b.dueDate) {
        const aDate = new Date(a.dueDate);
        const bDate = new Date(b.dueDate);
        const now = new Date();
        
        const aOverdue = aDate < now && !a.completed;
        const bOverdue = bDate < now && !b.completed;
        
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        return aDate.getTime() - bDate.getTime();
      }
      
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      // Finally by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    setFilteredTasks(filtered);
  }, [tasks, filter]);

  // Show achievement notification
  const showAchievementNotification = (achievementTitle: string) => {
    const notification: AchievementNotification = {
      id: Date.now().toString(),
      title: achievementTitle,
      visible: true
    };
    
    setAchievementNotification(notification);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setAchievementNotification(null);
        fadeAnim.setValue(0);
      });
    }, 3000);
  };

  // Show floating XP
  const showFloatingXP = (xp: number, x: number, y: number) => {
    const newFloatingXP: FloatingXPData = {
      id: Date.now().toString(),
      xp,
      startX: x,
      startY: y,
      visible: true
    };
    
    setFloatingXPs(prev => [...prev, newFloatingXP]);
    
    // Remove after animation completes
    setTimeout(() => {
      setFloatingXPs(prev => prev.filter(item => item.id !== newFloatingXP.id));
    }, 2000);
  };
  
  // Show dopaminergic feedback
  const showFeedback = (type: 'taskComplete' | 'levelUp' | 'xpGain', xpAmount?: number, message?: string) => {
    setFeedbackData({ visible: true, type, xpAmount, message });
    
    setTimeout(() => {
      setFeedbackData(prev => ({ ...prev, visible: false }));
    }, type === 'levelUp' ? 2500 : 1500);
  };

  // Handle task completion
  const handleCompleteTask = async (taskId: string) => {
    try {
      // Play sound immediately for instant feedback
      await soundService.playTaskComplete();
      
      const result = await gameEngine.completeTask(taskId);
      
      // Show floating XP (center screen approximation)
      const screenWidth = Dimensions.get('window').width;
      const screenHeight = Dimensions.get('window').height;
      showFloatingXP(result.xpGained, screenWidth / 2, screenHeight / 2);
      
      // Show dopaminergic feedback
      if (result.levelUp && result.newLevel) {
        await soundService.playLevelUp();
        showFeedback('levelUp', result.xpGained, `You are now level ${result.newLevel}!`);
      } else {
        showFeedback('taskComplete', result.xpGained);
      }
      
      // Show achievement notifications
      result.achievementsUnlocked.forEach((achievement, index) => {
        setTimeout(() => {
          soundService.playAchievement();
          showAchievementNotification(achievement);
        }, index * 1000);
      });
      
      // Reload tasks
      await loadTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      await soundService.playError();
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  // Handle task failure
  const handleFailTask = async (taskId: string) => {
    Alert.alert(
      'Fail Task',
      'Are you sure you want to mark this task as failed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Fail',
          style: 'destructive',
          onPress: async () => {
            try {
              await soundService.playError();
              const result = await gameEngine.failTask(taskId);
              
              let message = '❌ Task failed.';
              if (result.skillsAffected.length > 0) {
                message += `\nSkills affected: ${result.skillsAffected.join(', ')}`;
              }
              if (result.habitReset) {
                message += '\n💔 Habit streak reset.';
              }
              
              Alert.alert('Task Failed', message);
              
              // Reload tasks
              await loadTasks();
            } catch (error) {
              console.error('Error failing task:', error);
              Alert.alert('Error', 'Failed to update task');
            }
          }
        }
      ]
    );
  };

  // Handle numeric task value submission
  const handleNumericSubmit = async (taskId: string, value: number) => {
    try {
      // Create numeric task entry
      const entry: NumericTaskEntry = {
        id: Date.now().toString(),
        taskId,
        value,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        autoSubmitted: false,
      };

      await storageService.addNumericTaskEntry(entry);

      // Update task's current day value
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const newCurrentValue = (task.currentDayValue || 0) + value;
        await storageService.updateTaskCurrentDayValue(taskId, newCurrentValue);
        await storageService.updateTaskPendingValue(taskId, 0); // Clear pending value
      }

      // Reload tasks to show updated values
      await loadTasks();
      
      await soundService.playTaskComplete();
      showFeedback('xpGain', undefined, `+${value} ${task?.numericConfig?.unit || ''} registrado!`);
    } catch (error) {
      console.error('Error submitting numeric value:', error);
      await soundService.playError();
      Alert.alert('Error', 'Failed to submit value');
    }
  };

  // Handle task press (navigate to details)
  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetails', { taskId: task.id });
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  // Get filter button style
  const getFilterButtonStyle = (filterType: TaskStatus) => [
    styles.filterButton,
    filter === filterType && styles.filterButtonActive
  ];

  // Get filter text style
  const getFilterTextStyle = (filterType: TaskStatus) => [
    styles.filterText,
    filter === filterType && styles.filterTextActive
  ];

  // Get task count for each filter
  const getTaskCount = (filterType: TaskStatus) => {
    const validTasks = tasks.filter(task => 
      task && 
      typeof task === 'object' && 
      task.id && 
      task.title &&
      task.repetition
    );
    
    switch (filterType) {
      case 'today':
        return validTasks.filter(task => isTaskForToday(task)).length;
      case 'active':
        return validTasks.filter(task => !task.completed && !task.failed).length;
      case 'completed':
        return validTasks.filter(task => task.completed).length;
      case 'failed':
        return validTasks.filter(task => task.failed).length;
      default:
        return validTasks.length;
    }
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="clipboard-outline" size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyTitle}>
        {filter === 'all' && 'No tasks yet'}
        {filter === 'today' && 'No tasks for today'}
        {filter === 'active' && 'No active tasks'}
        {filter === 'completed' && 'No completed tasks'}
        {filter === 'failed' && 'No failed tasks'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all' && 'Create your first quest to start your journey!'}
        {filter === 'today' && 'Great! You have no tasks scheduled for today. Take a break or create some new quests!'}
        {filter === 'active' && 'All tasks are either completed or failed'}
        {filter === 'completed' && 'Complete some tasks to see them here'}
        {filter === 'failed' && 'Failed tasks will appear here'}
      </Text>
      {filter === 'all' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateTask')}
        >
          <Ionicons name="add" size={20} color={Colors.text} />
          <Text style={styles.createButtonText}>Create Task</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render task item
  const renderTaskItem = ({ item }: { item: Task }) => (
    <AnimatedTaskCard
      task={item}
      onComplete={handleCompleteTask}
      onFail={handleFailTask}
      onPress={handleTaskPress}
      onNumericSubmit={handleNumericSubmit}
      onAnimationComplete={() => {}} // Animation complete callback
    />
  );

  // Load tasks on screen focus
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  // Filter tasks when tasks or filter changes
  useEffect(() => {
    filterTasks();
  }, [filterTasks]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quest Log</Text>
        <Text style={styles.subtitle}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
        </Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={getFilterButtonStyle('all')}
          onPress={() => setFilter('all')}
        >
          <Text style={getFilterTextStyle('all')}>
            All ({getTaskCount('all')})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={getFilterButtonStyle('today')}
          onPress={() => setFilter('today')}
        >
          <Text style={getFilterTextStyle('today')}>
            Today ({getTaskCount('today')})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={getFilterButtonStyle('active')}
          onPress={() => setFilter('active')}
        >
          <Text style={getFilterTextStyle('active')}>
            Active ({getTaskCount('active')})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={getFilterButtonStyle('completed')}
          onPress={() => setFilter('completed')}
        >
          <Text style={getFilterTextStyle('completed')}>
            Completed ({getTaskCount('completed')})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={getFilterButtonStyle('failed')}
          onPress={() => setFilter('failed')}
        >
          <Text style={getFilterTextStyle('failed')}>
            Failed ({getTaskCount('failed')})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          filteredTasks.length === 0 && styles.listContentEmpty
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTask')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color={Colors.background} />
      </TouchableOpacity>

      {/* Achievement Notification */}
      {achievementNotification && (
        <Animated.View style={[styles.achievementNotification, { opacity: fadeAnim }]}>
          <View style={styles.achievementContent}>
            <Ionicons name="trophy" size={24} color={Colors.gold} />
            <View style={styles.achievementTextContainer}>
              <Text style={styles.achievementTitle}>Achievement Unlocked!</Text>
              <Text style={styles.achievementName}>{achievementNotification.title}</Text>
            </View>
          </View>
        </Animated.View>
      )}
      
      {/* Dopaminergic Feedback */}
      <AnimatedFeedback
        visible={feedbackData.visible}
        type={feedbackData.type}
        onComplete={() => setFeedbackData(prev => ({ ...prev, visible: false }))}
        xpAmount={feedbackData.xpAmount}
        message={feedbackData.message}
      />
      
      {/* Floating XP Numbers */}
      {floatingXPs.map((floatingXP) => (
        <FloatingXP
          key={floatingXP.id}
          xp={floatingXP.xp}
          startX={floatingXP.startX}
          startY={floatingXP.startY}
          visible={floatingXP.visible}
          onComplete={() => {
            setFloatingXPs(prev => prev.filter(item => item.id !== floatingXP.id));
          }}
        />
      ))}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  filterContainer: {
    maxHeight: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterContent: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  filterButton: {
    minWidth: 80,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSizes.xs, // Reduzido de FontSizes.sm para FontSizes.xs
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterTextActive: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 80, // Space for FAB
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 25,
  },
  createButtonText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  achievementNotification: {
    position: 'absolute',
    top: 60,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gold,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  achievementTextContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  achievementTitle: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.gold,
    marginBottom: 2,
  },
  achievementName: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
});

export default TasksScreen;