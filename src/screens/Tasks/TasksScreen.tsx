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
  Dimensions
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Task, RootStackParamList } from '../../types';
import StorageService from '../../services/StorageService';
import GameEngine from '../../services/GameEngine';
import TaskCard from '../../components/TaskCard';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

type TaskStatus = 'all' | 'active' | 'completed' | 'failed';

interface AchievementNotification {
  id: string;
  title: string;
  visible: boolean;
}

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const TasksScreen = () => {
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [achievementNotification, setAchievementNotification] = useState<AchievementNotification | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

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
    let filtered = tasks;
    
    switch (filter) {
      case 'active':
        filtered = tasks.filter(task => !task.completed && !task.failed);
        break;
      case 'completed':
        filtered = tasks.filter(task => task.completed);
        break;
      case 'failed':
        filtered = tasks.filter(task => task.failed);
        break;
      default:
        filtered = tasks;
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

  // Handle task completion
  const handleCompleteTask = async (taskId: string) => {
    try {
      const result = await gameEngine.completeTask(taskId);
      
      // Show success message with XP and gold gained
      let message = `🎉 Task completed!\n+${result.xpGained} XP`;
      if (result.goldGained > 0) {
        message += `, +${result.goldGained} Gold`;
      }
      
      if (result.levelUp && result.newLevel) {
        message += `\n🆙 Level up! You are now level ${result.newLevel}!`;
      }
      
      Alert.alert('Success!', message);
      
      // Show achievement notifications
      result.achievementsUnlocked.forEach((achievement, index) => {
        setTimeout(() => {
          showAchievementNotification(achievement);
        }, index * 1000);
      });
      
      // Reload tasks
      await loadTasks();
    } catch (error) {
      console.error('Error completing task:', error);
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
    switch (filterType) {
      case 'active':
        return tasks.filter(task => !task.completed && !task.failed).length;
      case 'completed':
        return tasks.filter(task => task.completed).length;
      case 'failed':
        return tasks.filter(task => task.failed).length;
      default:
        return tasks.length;
    }
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="clipboard-outline" size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyTitle}>
        {filter === 'all' && 'No tasks yet'}
        {filter === 'active' && 'No active tasks'}
        {filter === 'completed' && 'No completed tasks'}
        {filter === 'failed' && 'No failed tasks'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all' && 'Create your first quest to start your journey!'}
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
    <TaskCard
      task={item}
      onComplete={handleCompleteTask}
      onFail={handleFailTask}
      onPress={handleTaskPress}
    />
  );

  // Load tasks on screen focus
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
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
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={getFilterButtonStyle('all')}
          onPress={() => setFilter('all')}
        >
          <Text style={getFilterTextStyle('all')}>
            All ({getTaskCount('all')})
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
      </View>

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
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
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