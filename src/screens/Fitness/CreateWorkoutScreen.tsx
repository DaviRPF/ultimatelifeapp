import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import StorageService from '../../services/StorageService';
import SoundService from '../../services/SoundService';
import { Workout, WorkoutExercise, WorkoutSet, SetType, Exercise } from '../../types';
import { DEFAULT_EXERCISES, EXERCISE_CATEGORIES, getExercisesByCategory, searchExercises } from '../../constants/exercises';

const CreateWorkoutScreen = () => {
  const navigation = useNavigation();
  const [workoutName, setWorkoutName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const storageService = StorageService.getInstance();
  const soundService = SoundService.getInstance();

  const filteredExercises = () => {
    let exercises = DEFAULT_EXERCISES;
    
    if (selectedCategory !== 'all') {
      exercises = getExercisesByCategory(selectedCategory as Exercise['category']);
    }
    
    if (searchQuery.trim()) {
      exercises = searchExercises(searchQuery);
    }
    
    return exercises;
  };

  const addExercise = (exercise: Exercise) => {
    const newWorkoutExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [],
      notes: ''
    };
    
    setSelectedExercises(prev => [...prev, newWorkoutExercise]);
    setShowExerciseModal(false);
    setSearchQuery('');
  };

  const removeExercise = (exerciseId: string) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSelectedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
          }
        }
      ]
    );
  };

  const addSet = (exerciseId: string) => {
    const newSet: WorkoutSet = {
      id: Date.now().toString(),
      reps: 10,
      weight: 0,
      type: 'normal',
      restTime: 60
    };

    setSelectedExercises(prev => prev.map(exercise => 
      exercise.id === exerciseId 
        ? { ...exercise, sets: [...exercise.sets, newSet] }
        : exercise
    ));

    soundService.playCoin(); // Sound feedback for adding set
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => {
    setSelectedExercises(prev => prev.map(exercise => 
      exercise.id === exerciseId 
        ? {
            ...exercise,
            sets: exercise.sets.map(set => 
              set.id === setId 
                ? { ...set, [field]: value }
                : set
            )
          }
        : exercise
    ));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setSelectedExercises(prev => prev.map(exercise => 
      exercise.id === exerciseId 
        ? { ...exercise, sets: exercise.sets.filter(set => set.id !== setId) }
        : exercise
    ));
  };

  const getSetTypeColor = (type: SetType) => {
    switch (type) {
      case 'warmup': return Colors.warning;
      case 'failure': return Colors.error;
      case 'normal': return Colors.success;
      default: return Colors.primary;
    }
  };

  const getSetTypeIcon = (type: SetType) => {
    switch (type) {
      case 'warmup': return 'flame';
      case 'failure': return 'warning';
      case 'normal': return 'checkmark-circle';
      default: return 'ellipse';
    }
  };

  const startWorkout = () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert(
        'Start Empty Workout?',
        'You can start without pre-selected exercises and add them as you go during your workout.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Workout',
            onPress: () => {
              setIsStarted(true);
              setStartTime(new Date().toISOString());
              soundService.playTaskComplete();
            }
          }
        ]
      );
      return;
    }

    setIsStarted(true);
    setStartTime(new Date().toISOString());
    soundService.playTaskComplete(); // Start workout sound
  };

  const finishWorkout = async () => {
    try {
      const endTime = new Date().toISOString();
      const startDateTime = startTime ? new Date(startTime) : new Date();
      const endDateTime = new Date(endTime);
      const totalDuration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));

      const workout: Workout = {
        id: Date.now().toString(),
        name: workoutName.trim(),
        type: 'strength',
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        startTime: startTime || new Date().toISOString(),
        endTime,
        exercises: selectedExercises.filter(ex => ex.sets.length > 0), // Only include exercises with sets
        notes: notes.trim() || undefined,
        totalDuration
      };

      await storageService.addWorkout(workout);
      await soundService.playLevelUp(); // Completion sound
      
      Alert.alert(
        'Workout Completed! 🎉',
        `Duration: ${totalDuration} minutes\nExercises: ${workout.exercises.length}\nTotal Sets: ${workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}`,
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    }
  };

  const renderExerciseModal = () => (
    <Modal
      visible={showExerciseModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setShowExerciseModal(false);
              setSearchQuery('');
              setSelectedCategory('all');
            }}
          >
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Exercise</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          <TouchableOpacity
            style={[styles.categoryButton, selectedCategory === 'all' && styles.categoryButtonActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {EXERCISE_CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryButton, selectedCategory === category.id && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons 
                name={category.icon as any} 
                size={16} 
                color={selectedCategory === category.id ? Colors.background : Colors.text} 
              />
              <Text style={[styles.categoryText, selectedCategory === category.id && styles.categoryTextActive]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filteredExercises()}
          keyExtractor={(item) => item.id}
          style={styles.exercisesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.exerciseItem}
              onPress={() => addExercise(item)}
            >
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMuscles}>
                  {item.muscleGroups.join(', ')}
                </Text>
                {item.equipment && (
                  <Text style={styles.exerciseEquipment}>Equipment: {item.equipment}</Text>
                )}
              </View>
              <Ionicons name="add-circle" size={24} color={Colors.primary} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyExercises}>
              <Text style={styles.emptyText}>No exercises found</Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );

  const renderSetTypeButton = (exerciseId: string, setId: string, currentType: SetType) => (
    <TouchableOpacity
      style={[styles.setTypeButton, { backgroundColor: getSetTypeColor(currentType) }]}
      onPress={() => {
        const types: SetType[] = ['normal', 'warmup', 'failure'];
        const currentIndex = types.indexOf(currentType);
        const nextType = types[(currentIndex + 1) % types.length];
        updateSet(exerciseId, setId, 'type', nextType);
      }}
    >
      <Ionicons 
        name={getSetTypeIcon(currentType) as any} 
        size={16} 
        color={Colors.background} 
      />
    </TouchableOpacity>
  );

  const renderSet = (exerciseId: string, set: WorkoutSet, index: number) => (
    <View key={set.id} style={styles.setRow}>
      <Text style={styles.setNumber}>{index + 1}</Text>
      
      {renderSetTypeButton(exerciseId, set.id, set.type)}
      
      <View style={styles.setInputContainer}>
        <TextInput
          style={styles.setInput}
          value={set.weight?.toString() || ''}
          onChangeText={(value) => updateSet(exerciseId, set.id, 'weight', parseFloat(value) || 0)}
          placeholder="kg"
          keyboardType="decimal-pad"
          placeholderTextColor={Colors.textSecondary}
        />
        <Text style={styles.setInputLabel}>kg</Text>
      </View>
      
      <View style={styles.setInputContainer}>
        <TextInput
          style={styles.setInput}
          value={set.reps.toString()}
          onChangeText={(value) => updateSet(exerciseId, set.id, 'reps', parseInt(value) || 0)}
          placeholder="reps"
          keyboardType="number-pad"
          placeholderTextColor={Colors.textSecondary}
        />
        <Text style={styles.setInputLabel}>reps</Text>
      </View>
      
      <TouchableOpacity
        style={styles.removeSetButton}
        onPress={() => removeSet(exerciseId, set.id)}
      >
        <Ionicons name="trash" size={16} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderExercise = (exercise: WorkoutExercise) => (
    <View key={exercise.id} style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseTitle}>{exercise.exerciseName}</Text>
        <TouchableOpacity
          style={styles.removeExerciseButton}
          onPress={() => removeExercise(exercise.id)}
        >
          <Ionicons name="trash" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {exercise.sets.length > 0 && (
        <View style={styles.setsHeader}>
          <Text style={styles.setsHeaderText}>Set</Text>
          <Text style={styles.setsHeaderText}>Type</Text>
          <Text style={styles.setsHeaderText}>Weight</Text>
          <Text style={styles.setsHeaderText}>Reps</Text>
          <Text style={styles.setsHeaderText}>Action</Text>
        </View>
      )}

      {exercise.sets.map((set, index) => renderSet(exercise.id, set, index))}

      <TouchableOpacity
        style={styles.addSetButton}
        onPress={() => addSet(exercise.id)}
      >
        <Ionicons name="add" size={20} color={Colors.primary} />
        <Text style={styles.addSetText}>Add Set</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isStarted ? '🏋️ Workout in Progress' : 'Create Workout'}
        </Text>
        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => setShowExerciseModal(true)}
          disabled={!isStarted}
        >
          <Ionicons 
            name="add" 
            size={24} 
            color={isStarted ? Colors.primary : Colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!isStarted && (
          <View style={styles.setupSection}>
            <Text style={styles.sectionTitle}>Workout Setup</Text>
            <TextInput
              style={styles.workoutNameInput}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="Enter workout name (e.g., Push Day, Leg Day)"
              placeholderTextColor={Colors.textSecondary}
            />
            
            {selectedExercises.length > 0 && (
              <View style={styles.exercisesPreview}>
                <Text style={styles.previewTitle}>Selected Exercises ({selectedExercises.length})</Text>
                {selectedExercises.map((exercise) => (
                  <View key={exercise.id} style={styles.previewExercise}>
                    <Text style={styles.previewExerciseName}>{exercise.exerciseName}</Text>
                    <TouchableOpacity
                      onPress={() => removeExercise(exercise.id)}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.addExerciseButtonLarge}
              onPress={() => setShowExerciseModal(true)}
            >
              <Ionicons name="add-circle" size={24} color={Colors.background} />
              <Text style={styles.addExerciseButtonText}>Add Exercises</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.startButton}
              onPress={startWorkout}
            >
              <Ionicons name="play" size={24} color={Colors.background} />
              <Text style={styles.startButtonText}>
                {selectedExercises.length === 0 ? 'Start Empty Workout' : 'Start Workout'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isStarted && (
          <>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutNameTitle}>{workoutName}</Text>
              <Text style={styles.workoutStartTime}>
                Started: {startTime ? new Date(startTime).toLocaleTimeString() : 'Now'}
              </Text>
            </View>

            {selectedExercises.length === 0 && (
              <View style={styles.emptyWorkoutContainer}>
                <Ionicons name="fitness" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyWorkoutTitle}>Ready to start your workout!</Text>
                <Text style={styles.emptyWorkoutText}>
                  Tap the + button in the header to add exercises as you go
                </Text>
                <TouchableOpacity
                  style={styles.addFirstExerciseButton}
                  onPress={() => setShowExerciseModal(true)}
                >
                  <Ionicons name="add-circle" size={24} color={Colors.background} />
                  <Text style={styles.addFirstExerciseText}>Add Your First Exercise</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedExercises.map(renderExercise)}

            {selectedExercises.length > 0 && (
              <View style={styles.addMoreExercisesContainer}>
                <TouchableOpacity
                  style={styles.addMoreExercisesButton}
                  onPress={() => setShowExerciseModal(true)}
                >
                  <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                  <Text style={styles.addMoreExercisesText}>Add Another Exercise</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Workout Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes about your workout..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={styles.finishButton}
              onPress={finishWorkout}
            >
              <Ionicons name="checkmark-circle" size={24} color={Colors.background} />
              <Text style={styles.finishButtonText}>Finish Workout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {renderExerciseModal()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  addExerciseButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  setupSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  workoutNameInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  exercisesPreview: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  previewExercise: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  previewExerciseName: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    flex: 1,
  },
  addExerciseButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  addExerciseButtonText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: 12,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  startButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  startButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.background,
  },
  workoutInfo: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workoutNameTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  workoutStartTime: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  exerciseTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  removeExerciseButton: {
    padding: Spacing.xs,
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  setsHeaderText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  setNumber: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
    width: 30,
    textAlign: 'center',
  },
  setTypeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  setInput: {
    backgroundColor: Colors.background,
    borderRadius: 6,
    padding: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text,
    textAlign: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  setInputLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  removeSetButton: {
    padding: Spacing.sm,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing.sm,
  },
  addSetText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '500',
  },
  notesSection: {
    marginBottom: Spacing.xl,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 80,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  finishButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: Colors.background,
  },
  exercisesList: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  exerciseMuscles: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  exerciseEquipment: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyExercises: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  emptyWorkoutContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyWorkoutTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyWorkoutText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  addFirstExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  addFirstExerciseText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.background,
  },
  addMoreExercisesContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  addMoreExercisesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing.sm,
  },
  addMoreExercisesText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '500',
  },
});

export default CreateWorkoutScreen;