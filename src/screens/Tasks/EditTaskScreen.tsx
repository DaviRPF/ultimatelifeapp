import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { Task, RootStackParamList, TaskType, NumericTaskConfig, RepetitionType } from '../../types';
import StorageService from '../../services/StorageService';
import AttributeSlider from '../../components/AttributeSlider';
import { DIFFICULTY_DESCRIPTIONS, IMPORTANCE_DESCRIPTIONS, FEAR_DESCRIPTIONS } from '../../constants/attributes';

type EditTaskScreenRouteProp = RouteProp<RootStackParamList, 'EditTask'>;
type EditTaskScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditTask'>;

const EditTaskScreen: React.FC = () => {
  const route = useRoute<EditTaskScreenRouteProp>();
  const navigation = useNavigation<EditTaskScreenNavigationProp>();
  const { taskId } = route.params;

  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(50);
  const [importance, setImportance] = useState(50);
  const [fear, setFear] = useState(50);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  
  // Numeric task fields
  const [taskType, setTaskType] = useState<TaskType>('binary');
  const [numericUnit, setNumericUnit] = useState('');
  const [minimumTarget, setMinimumTarget] = useState('');
  const [dailyTarget, setDailyTarget] = useState('');
  
  // Other settings
  const [habitEnabled, setHabitEnabled] = useState(false);
  const [habitDays, setHabitDays] = useState(7);
  const [infiniteTask, setInfiniteTask] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const storageService = StorageService.getInstance();

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      await storageService.initializeAppData();
      
      const taskData = storageService.getTaskById(taskId);
      if (!taskData) {
        Alert.alert('Error', 'Task not found');
        navigation.goBack();
        return;
      }

      setTask(taskData);
      setTitle(taskData.title);
      setDescription(taskData.description);
      setDifficulty(taskData.difficulty);
      setImportance(taskData.importance);
      setFear(taskData.fear);
      setSkills(taskData.skills);
      setTaskType(taskData.taskType || 'binary');
      setHabitEnabled(taskData.habit.enabled);
      setHabitDays(taskData.habit.requiredDays);
      setInfiniteTask(taskData.infinite);

      if (taskData.numericConfig) {
        setNumericUnit(taskData.numericConfig.unit);
        setMinimumTarget(taskData.numericConfig.minimumTarget.toString());
        setDailyTarget(taskData.numericConfig.dailyTarget?.toString() || '');
      }
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Error', 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Task description is required');
      return false;
    }

    if (skills.length === 0) {
      Alert.alert('Error', 'At least one skill is required');
      return false;
    }

    if (difficulty < 10 || importance < 10 || fear < 10) {
      Alert.alert('Error', 'All attributes must be at least 10%');
      return false;
    }

    if (taskType === 'numeric') {
      if (!numericUnit.trim()) {
        Alert.alert('Error', 'Unit is required for numeric tasks');
        return false;
      }
      
      const minTarget = parseFloat(minimumTarget);
      if (isNaN(minTarget) || minTarget <= 0) {
        Alert.alert('Error', 'Minimum target must be a positive number');
        return false;
      }
      
      if (dailyTarget && !isNaN(parseFloat(dailyTarget)) && parseFloat(dailyTarget) < minTarget) {
        Alert.alert('Error', 'Daily target cannot be less than minimum target');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !task) return;

    setSaving(true);
    try {
      const numericConfig: NumericTaskConfig | undefined = taskType === 'numeric' ? {
        unit: numericUnit.trim(),
        minimumTarget: parseFloat(minimumTarget),
        dailyTarget: dailyTarget ? parseFloat(dailyTarget) : undefined,
      } : undefined;

      const updatedTask: Partial<Task> = {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        importance,
        fear,
        skills,
        taskType,
        numericConfig,
        habit: {
          ...task.habit,
          enabled: habitEnabled,
          requiredDays: habitDays,
        },
        infinite: infiniteTask,
      };

      await storageService.updateTask(taskId, updatedTask);
      
      Alert.alert('Success', 'Task updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Task</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
          <Ionicons name="checkmark" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Task Details</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Task Title *"
          placeholderTextColor={Colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description *"
          placeholderTextColor={Colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Task Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Task Type</Text>
        <Text style={styles.warningText}>
          ⚠️ Changing task type will reset progress data
        </Text>
        
        <View style={styles.taskTypeContainer}>
          <TouchableOpacity
            style={[styles.taskTypeButton, taskType === 'binary' && styles.taskTypeButtonActive]}
            onPress={() => setTaskType('binary')}
          >
            <Ionicons name="checkbox" size={24} color={taskType === 'binary' ? Colors.background : Colors.primary} />
            <Text style={[styles.taskTypeText, taskType === 'binary' && styles.taskTypeTextActive]}>
              Binary
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.taskTypeButton, taskType === 'numeric' && styles.taskTypeButtonActive]}
            onPress={() => setTaskType('numeric')}
          >
            <Ionicons name="stats-chart" size={24} color={taskType === 'numeric' ? Colors.background : Colors.primary} />
            <Text style={[styles.taskTypeText, taskType === 'numeric' && styles.taskTypeTextActive]}>
              Numeric
            </Text>
          </TouchableOpacity>
        </View>

        {/* Numeric Configuration */}
        {taskType === 'numeric' && (
          <View style={styles.numericConfig}>
            <Text style={styles.label}>Unit *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., ml, pages, minutes"
              placeholderTextColor={Colors.textSecondary}
              value={numericUnit}
              onChangeText={setNumericUnit}
            />

            <View style={styles.numericRow}>
              <View style={styles.numericHalf}>
                <Text style={styles.label}>Minimum Target *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="100"
                  placeholderTextColor={Colors.textSecondary}
                  value={minimumTarget}
                  onChangeText={setMinimumTarget}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.numericHalf}>
                <Text style={styles.label}>Daily Target</Text>
                <TextInput
                  style={styles.input}
                  placeholder="150"
                  placeholderTextColor={Colors.textSecondary}
                  value={dailyTarget}
                  onChangeText={setDailyTarget}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Attributes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attributes</Text>
        
        <AttributeSlider
          label="Difficulty"
          value={difficulty}
          onValueChange={setDifficulty}
          descriptions={DIFFICULTY_DESCRIPTIONS}
          color={Colors.difficulty}
        />
        
        <AttributeSlider
          label="Importance"
          value={importance}
          onValueChange={setImportance}
          descriptions={IMPORTANCE_DESCRIPTIONS}
          color={Colors.importance}
        />
        
        <AttributeSlider
          label="Fear/Anxiety"
          value={fear}
          onValueChange={setFear}
          descriptions={FEAR_DESCRIPTIONS}
          color={Colors.fear}
        />
      </View>

      {/* Skills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills *</Text>
        
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, styles.skillInput]}
            placeholder="Add skill"
            placeholderTextColor={Colors.textSecondary}
            value={skillInput}
            onChangeText={setSkillInput}
            onSubmitEditing={addSkill}
          />
          <TouchableOpacity style={styles.addButton} onPress={addSkill}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {skills.map((skill, index) => (
          <View key={index} style={styles.skillItem}>
            <Text style={styles.skillText}>{skill}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeSkill(skill)}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Habit */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.sectionTitle}>Generate Habit</Text>
          <Switch
            value={habitEnabled}
            onValueChange={setHabitEnabled}
            trackColor={{ false: Colors.surfaceDark, true: Colors.success }}
            thumbColor={Colors.text}
          />
        </View>

        {habitEnabled && (
          <View style={styles.habitConfig}>
            <Text style={styles.label}>Required consecutive days:</Text>
            <TextInput
              style={styles.numberInput}
              value={habitDays.toString()}
              onChangeText={(text) => setHabitDays(Math.max(1, parseInt(text) || 1))}
              keyboardType="numeric"
            />
          </View>
        )}
      </View>

      {/* Infinite Task */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.sectionTitle}>Infinite Task</Text>
          <Switch
            value={infiniteTask}
            onValueChange={setInfiniteTask}
            trackColor={{ false: Colors.surfaceDark, true: Colors.warning }}
            thumbColor={Colors.text}
          />
        </View>
        <Text style={styles.sectionSubtitle}>
          {infiniteTask 
            ? '♾️ This task can be completed multiple times and will reset after each completion'
            : 'Normal task - can only be completed once'
          }
        </Text>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButtonLarge, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  saveButton: {
    padding: Spacing.sm,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  warningText: {
    fontSize: FontSizes.sm,
    color: Colors.warning,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  taskTypeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  taskTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  taskTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  taskTypeText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  taskTypeTextActive: {
    color: Colors.background,
  },
  numericConfig: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  numericRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  numericHalf: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  skillInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: Spacing.sm,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  skillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  skillText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    flex: 1,
  },
  removeButton: {
    backgroundColor: Colors.danger,
    borderRadius: 4,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  habitConfig: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  numberInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    width: 60,
    textAlign: 'center',
  },
  saveButtonLarge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    margin: Spacing.lg,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.surfaceDark,
  },
  saveButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.text,
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.danger,
  },
});

export default EditTaskScreen;