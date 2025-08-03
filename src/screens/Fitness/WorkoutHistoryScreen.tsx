import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import StorageService from '../../services/StorageService';
import { Workout, SetType } from '../../types';

const WorkoutHistoryScreen = () => {
  const navigation = useNavigation();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const storageService = StorageService.getInstance();

  const loadWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      await storageService.initializeAppData();
      const allWorkouts = storageService.getWorkouts();
      
      // Sort by date descending (most recent first)
      const sortedWorkouts = allWorkouts.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setWorkouts(sortedWorkouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
      Alert.alert('Error', 'Failed to load workout history');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkouts();
    setRefreshing(false);
  };

  const deleteWorkout = (workout: Workout) => {
    Alert.alert(
      'Delete Workout',
      `Are you sure you want to delete "${workout.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteWorkout(workout.id);
              await loadWorkouts();
              Alert.alert('Success', 'Workout deleted');
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout');
            }
          }
        }
      ]
    );
  };

  const getSetTypeIcon = (type: SetType) => {
    switch (type) {
      case 'warmup': return '🔥';
      case 'failure': return '⚠️';
      case 'normal': return '✅';
      default: return '⚪';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Unknown duration';
    
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const calculateWorkoutStats = (workout: Workout) => {
    const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const totalReps = workout.exercises.reduce((acc, ex) => 
      acc + ex.sets.reduce((setAcc, set) => setAcc + set.reps, 0), 0
    );
    const totalWeight = workout.exercises.reduce((acc, ex) => 
      acc + ex.sets.reduce((setAcc, set) => setAcc + (set.weight || 0) * set.reps, 0), 0
    );

    return { totalSets, totalReps, totalWeight };
  };

  const renderWorkoutCard = (workout: Workout) => {
    const workoutDate = new Date(workout.date);
    const stats = calculateWorkoutStats(workout);
    
    return (
      <View key={workout.id} style={styles.workoutCard}>
        <View style={styles.workoutHeader}>
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            <Text style={styles.workoutDate}>
              {workoutDate.toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </Text>
            <Text style={styles.workoutDuration}>
              {formatDuration(workout.totalDuration)}
            </Text>
          </View>
          <View style={styles.workoutActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteWorkout(workout)}
            >
              <Ionicons name="trash" size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.workoutStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{workout.exercises.length}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalSets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalReps}</Text>
            <Text style={styles.statLabel}>Reps</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalWeight.toFixed(0)}</Text>
            <Text style={styles.statLabel}>kg Total</Text>
          </View>
        </View>

        {workout.notes && (
          <View style={styles.workoutNotes}>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </View>
        )}

        <View style={styles.exercisesList}>
          {workout.exercises.slice(0, 3).map((exercise, index) => (
            <View key={exercise.id} style={styles.exercisePreview}>
              <Text style={styles.exercisePreviewName}>{exercise.exerciseName}</Text>
              <View style={styles.setsPreview}>
                {exercise.sets.slice(0, 5).map((set, setIndex) => (
                  <View key={set.id} style={styles.setPreview}>
                    <Text style={styles.setPreviewText}>
                      {getSetTypeIcon(set.type)} {set.weight ? `${set.weight}kg` : ''} × {set.reps}
                    </Text>
                  </View>
                ))}
                {exercise.sets.length > 5 && (
                  <Text style={styles.moreSetsText}>+{exercise.sets.length - 5} more</Text>
                )}
              </View>
            </View>
          ))}
          {workout.exercises.length > 3 && (
            <Text style={styles.moreExercisesText}>
              +{workout.exercises.length - 3} more exercises
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="barbell" size={64} color={Colors.textSecondary} />
      <Text style={styles.emptyTitle}>No workouts yet</Text>
      <Text style={styles.emptySubtitle}>
        Start tracking your strength training progress!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('CreateWorkout' as never)}
      >
        <Ionicons name="add-circle" size={20} color={Colors.background} />
        <Text style={styles.emptyButtonText}>Create First Workout</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWeeklyStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyWorkouts = workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= oneWeekAgo && workoutDate <= now;
    });

    if (weeklyWorkouts.length === 0) return null;

    const totalDuration = weeklyWorkouts.reduce((acc, w) => acc + (w.totalDuration || 0), 0);
    const totalExercises = weeklyWorkouts.reduce((acc, w) => acc + w.exercises.length, 0);
    
    return (
      <View style={styles.weeklyStats}>
        <Text style={styles.weeklyStatsTitle}>This Week</Text>
        <View style={styles.weeklyStatsRow}>
          <View style={styles.weeklyStatItem}>
            <Text style={styles.weeklyStatValue}>{weeklyWorkouts.length}</Text>
            <Text style={styles.weeklyStatLabel}>Workouts</Text>
          </View>
          <View style={styles.weeklyStatItem}>
            <Text style={styles.weeklyStatValue}>{formatDuration(totalDuration)}</Text>
            <Text style={styles.weeklyStatLabel}>Total Time</Text>
          </View>
          <View style={styles.weeklyStatItem}>
            <Text style={styles.weeklyStatValue}>{totalExercises}</Text>
            <Text style={styles.weeklyStatLabel}>Exercises</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Workout History</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateWorkout' as never)}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {workouts.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {renderWeeklyStats()}
            <Text style={styles.historyTitle}>
              All Workouts ({workouts.length})
            </Text>
            {workouts.map(renderWorkoutCard)}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },
  weeklyStats: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weeklyStatsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  weeklyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weeklyStatItem: {
    alignItems: 'center',
  },
  weeklyStatValue: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  weeklyStatLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  historyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  workoutCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  workoutDate: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  workoutDuration: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  workoutActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  workoutNotes: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  notesText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  exercisesList: {
    gap: Spacing.sm,
  },
  exercisePreview: {
    paddingVertical: Spacing.sm,
  },
  exercisePreviewName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  setsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  setPreview: {
    backgroundColor: Colors.background,
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  setPreviewText: {
    fontSize: FontSizes.xs,
    color: Colors.text,
  },
  moreSetsText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  moreExercisesText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 25,
    gap: Spacing.sm,
  },
  emptyButtonText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
});

export default WorkoutHistoryScreen;