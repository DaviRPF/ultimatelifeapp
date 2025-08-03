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
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { DIFFICULTY_DESCRIPTIONS, IMPORTANCE_DESCRIPTIONS, FEAR_DESCRIPTIONS } from '../../constants/attributes';
import AttributeSlider from '../../components/AttributeSlider';
import TaskEvaluationQuestionnaire, { QuestionnaireResult } from '../../components/TaskEvaluationQuestionnaire';
import GameEngine from '../../services/GameEngine';
import StorageService from '../../services/StorageService';
import { RootStackParamList, Task, Quest, Group, RepetitionType, WeeklyRepetition } from '../../types';

type CreateItemScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateTask'>;

interface Props {
  navigation: CreateItemScreenNavigationProp;
}

type ItemType = 'task' | 'quest';

const CreateItemScreen: React.FC<Props> = ({ navigation }) => {
  // Type selection
  const [itemType, setItemType] = useState<ItemType>('task');
  
  // Common fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Task-specific fields
  const [difficulty, setDifficulty] = useState(50);
  const [importance, setImportance] = useState(50);
  const [fear, setFear] = useState(50);
  const [skillInput, setSkillInput] = useState('');
  const [characteristics, setCharacteristics] = useState<string[]>([]);
  const [characteristicInput, setCharacteristicInput] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Quest-specific fields
  const [priority, setPriority] = useState<Quest['priority']>('medium');
  const [xpReward, setXpReward] = useState('100');
  const [goldReward, setGoldReward] = useState('50');
  const [unlockableContent, setUnlockableContent] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  
  // Due date settings
  const [hasDueDate, setHasDueDate] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Task repetition settings
  const [repetition, setRepetition] = useState<RepetitionType>('one_time');
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);
  const [customInterval, setCustomInterval] = useState(1);
  const [customUnit, setCustomUnit] = useState<'days' | 'weeks' | 'months'>('days');
  
  // Task notifications and habits
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [autoFail, setAutoFail] = useState(false);
  const [habitEnabled, setHabitEnabled] = useState(false);
  const [habitDays, setHabitDays] = useState(7);
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Existing skills and characteristics
  const [availableCharacteristics, setAvailableCharacteristics] = useState<string[]>([]);
  const [showExistingCharacteristics, setShowExistingCharacteristics] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // Questionnaire states
  const [useQuestionnaire, setUseQuestionnaire] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);

  const gameEngine = GameEngine.getInstance();
  const storageService = StorageService.getInstance();

  useEffect(() => {
    loadGroups();
    loadExistingData();
    if (itemType === 'quest') {
      loadAvailableTasks();
    }
  }, [itemType]);

  const loadGroups = async () => {
    try {
      const data = await gameEngine.getAppData();
      setGroups(data.groups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadExistingData = async () => {
    try {
      await storageService.initializeAppData();
      const characteristics = storageService.getCharacteristics();
      
      setAvailableCharacteristics(Object.keys(characteristics));
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  };

  const loadAvailableTasks = async () => {
    try {
      const tasks = storageService.getTasks().filter(task => !task.completed);
      setAvailableTasks(tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  // Common functions

  const addCharacteristic = () => {
    if (characteristicInput.trim() && !characteristics.includes(characteristicInput.trim())) {
      setCharacteristics([...characteristics, characteristicInput.trim()]);
      setCharacteristicInput('');
    }
  };

  const removeCharacteristic = (charToRemove: string) => {
    setCharacteristics(characteristics.filter(char => char !== charToRemove));
  };


  const toggleExistingCharacteristic = (charName: string) => {
    if (characteristics.includes(charName)) {
      setCharacteristics(characteristics.filter(char => char !== charName));
    } else {
      setCharacteristics([...characteristics, charName]);
    }
  };


  const getAvailableCharacteristicsFiltered = () => {
    return availableCharacteristics.filter(charName => !characteristics.includes(charName));
  };


  // Quest-specific functions
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getPriorityColor = (priorityType: Quest['priority']) => {
    switch (priorityType) {
      case 'critical': return Colors.error;
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFB366';
      case 'low': return '#4ECDC4';
      default: return Colors.primary;
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', `${itemType === 'task' ? 'Task' : 'Quest'} title is required`);
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Error', `${itemType === 'task' ? 'Task' : 'Quest'} description is required`);
      return false;
    }

    if (itemType === 'task') {
      if (characteristics.length === 0) {
        Alert.alert('Error', 'At least one characteristic is required');
        return false;
      }
      
      if (repetition === 'weekly' && selectedDaysOfWeek.length === 0) {
        Alert.alert('Error', 'Please select at least one day of the week for weekly repetition');
        return false;
      }

      if (difficulty < 10 || importance < 10 || fear < 10) {
        Alert.alert('Error', 'All attributes must be at least 10%');
        return false;
      }
    }

    if (itemType === 'quest') {
      const xp = parseInt(xpReward) || 0;
      const gold = parseInt(goldReward) || 0;

      if (xp < 0 || gold < 0) {
        Alert.alert('Error', 'Rewards must be positive numbers');
        return false;
      }
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (itemType === 'task') {
        await createTask();
      } else {
        await createQuest();
      }
      
      Alert.alert('Success', `${itemType === 'task' ? 'Task' : 'Quest'} created successfully!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(`Error creating ${itemType}:`, error);
      Alert.alert('Error', `Failed to create ${itemType}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async () => {
    const taskData: Omit<Task, 'id' | 'xp' | 'createdAt' | 'completed' | 'failed' | 'completedAt'> = {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      importance,
      fear,
      characteristics,
      dueDate: hasDueDate ? dueDate.toISOString().split('T')[0] : '',
      dueTime: hasDueDate ? dueDate.toTimeString().split(' ')[0] : '',
      repetition,
      customRepetition: repetition === 'custom' ? {
        interval: customInterval,
        unit: customUnit,
      } : undefined,
      weeklyRepetition: repetition === 'weekly' ? {
        daysOfWeek: selectedDaysOfWeek,
      } : undefined,
      group: selectedGroup,
      notificationEnabled,
      notificationIntervals: notificationEnabled ? [60, 30, 10] : [],
      autoFail: hasDueDate && autoFail,
      habit: {
        enabled: habitEnabled,
        requiredDays: habitDays,
        currentStreak: 0,
        lastCompletedDate: '',
      },
    };

    await gameEngine.createTask(taskData);
  };

  const createQuest = async () => {
    const questData: Quest = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      status: 'active',
      priority,
      relatedTasks: selectedTasks,
      progress: 0,
      rewards: {
        xp: parseInt(xpReward) || 0,
        gold: parseInt(goldReward) || 0,
        unlockableContent: unlockableContent.trim() || undefined,
      },
      createdAt: new Date().toISOString(),
      dueDate: hasDueDate && dueDate ? dueDate.toISOString() : undefined,
      notes: [],
      characteristics,
    };

    await storageService.addQuest(questData);
  };

  const calculateXP = () => {
    if (itemType === 'quest') return parseInt(xpReward) || 0;
    return Math.round(((difficulty + importance + fear) / 3) * 2.5);
  };

  // Questionnaire handlers
  const handleQuestionnaireComplete = (result: QuestionnaireResult) => {
    setDifficulty(result.difficulty);
    setImportance(result.importance);
    setFear(result.fear);
    setQuestionnaireCompleted(true);
    setShowQuestionnaire(false);
  };

  const handleQuestionnaireCancel = () => {
    setShowQuestionnaire(false);
  };

  const startQuestionnaire = () => {
    setShowQuestionnaire(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Create New {itemType === 'task' ? 'Task' : 'Quest'}</Text>
      <Text style={styles.subtitle}>
        {itemType === 'task' 
          ? 'Individual action to build skills and earn XP' 
          : 'Epic journey with custom rewards and linked tasks'
        }
      </Text>

      {/* Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Type</Text>
        <Text style={styles.typeExplanation}>
          Choose what you want to create:
        </Text>
        
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeButton, itemType === 'task' && styles.typeButtonActive]}
            onPress={() => setItemType('task')}
          >
            <View style={styles.typeHeader}>
              <Ionicons name="checkbox" size={24} color={itemType === 'task' ? Colors.background : Colors.primary} />
              <Text style={[styles.typeText, itemType === 'task' && styles.typeTextActive]}>Task</Text>
            </View>
            <Text style={[styles.typeDescription, itemType === 'task' && styles.typeDescriptionActive]}>
              Individual actions with XP based on difficulty, importance, and fear. Builds skills and habits.
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.typeButton, itemType === 'quest' && styles.typeButtonActive]}
            onPress={() => setItemType('quest')}
          >
            <View style={styles.typeHeader}>
              <Ionicons name="journal" size={24} color={itemType === 'quest' ? Colors.background : Colors.primary} />
              <Text style={[styles.typeText, itemType === 'quest' && styles.typeTextActive]}>Quest</Text>
            </View>
            <Text style={[styles.typeDescription, itemType === 'quest' && styles.typeDescriptionActive]}>
              Epic journeys with custom rewards. Can group multiple tasks together for bigger achievements.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current Type Info */}
        <View style={styles.currentTypeInfo}>
          <View style={styles.currentTypeHeader}>
            <Ionicons 
              name={itemType === 'task' ? 'checkbox' : 'journal'} 
              size={20} 
              color={Colors.primary} 
            />
            <Text style={styles.currentTypeTitle}>
              {itemType === 'task' ? 'Creating a Task' : 'Creating a Quest'}
            </Text>
          </View>
          
          {itemType === 'task' ? (
            <View style={styles.typeFeatures}>
              <Text style={styles.featureItem}>• XP calculated from difficulty, importance & fear</Text>
              <Text style={styles.featureItem}>• Increases/decreases specific skills</Text>
              <Text style={styles.featureItem}>• Can create habits with streak tracking</Text>
              <Text style={styles.featureItem}>• Repetition options (one-time, continuous, custom)</Text>
              <Text style={styles.featureItem}>• Automatic failure on deadline</Text>
            </View>
          ) : (
            <View style={styles.typeFeatures}>
              <Text style={styles.featureItem}>• Custom XP and gold rewards</Text>
              <Text style={styles.featureItem}>• Priority levels (low, medium, high, critical)</Text>
              <Text style={styles.featureItem}>• Can link multiple existing tasks</Text>
              <Text style={styles.featureItem}>• Progress tracking across related tasks</Text>
              <Text style={styles.featureItem}>• Unlockable content/achievements</Text>
            </View>
          )}
        </View>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{itemType === 'task' ? 'Task' : 'Quest'} Details</Text>
        
        <TextInput
          style={styles.input}
          placeholder={`${itemType === 'task' ? 'Task' : 'Quest'} Title *`}
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

      {/* Quest Priority (Quest only) */}
      {itemType === 'quest' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityContainer}>
            {(['low', 'medium', 'high', 'critical'] as const).map((priorityOption) => (
              <TouchableOpacity
                key={priorityOption}
                style={[
                  styles.priorityButton,
                  priority === priorityOption && { backgroundColor: getPriorityColor(priorityOption) }
                ]}
                onPress={() => setPriority(priorityOption)}
              >
                <Text style={[
                  styles.priorityText,
                  priority === priorityOption && styles.selectedPriorityText
                ]}>
                  {priorityOption.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Task Attributes (Task only) */}
      {itemType === 'task' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Attributes</Text>
            <TouchableOpacity
              style={styles.questionnaireToggleButton}
              onPress={() => setUseQuestionnaire(!useQuestionnaire)}
            >
              <Text style={styles.questionnaireToggleButtonText}>
                {useQuestionnaire ? '🎚️ Sliders' : '📋 Questionário'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            {useQuestionnaire 
              ? 'Responda 15 perguntas para uma avaliação precisa dos atributos'
              : 'Set the challenge level - higher values = more XP'
            }
          </Text>

          {useQuestionnaire ? (
            <View style={styles.questionnaireSection}>
              {questionnaireCompleted ? (
                <View style={styles.questionnaireResults}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Dificuldade:</Text>
                    <Text style={[styles.resultValue, { color: Colors.difficulty }]}>{difficulty}%</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Importância:</Text>
                    <Text style={[styles.resultValue, { color: Colors.importance }]}>{importance}%</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Medo/Ansiedade:</Text>
                    <Text style={[styles.resultValue, { color: Colors.fear }]}>{fear}%</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.redoQuestionnaireButton}
                    onPress={startQuestionnaire}
                  >
                    <Ionicons name="refresh" size={16} color={Colors.primary} />
                    <Text style={styles.redoQuestionnaireText}>Refazer Questionário</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.startQuestionnaireButton}
                  onPress={startQuestionnaire}
                >
                  <Ionicons name="help-circle" size={20} color={Colors.background} />
                  <Text style={styles.startQuestionnaireText}>Iniciar Questionário de Avaliação</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.slidersSection}>
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
          )}

          <View style={styles.xpPreview}>
            <Text style={styles.xpText}>Estimated XP: {calculateXP()}</Text>
          </View>
        </View>
      )}

      {/* Quest Rewards (Quest only) */}
      {itemType === 'quest' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rewards</Text>
          <Text style={styles.sectionSubtitle}>
            Set custom rewards for completing this epic quest
          </Text>
          
          <View style={styles.rewardRow}>
            <View style={[styles.inputGroup, styles.rewardInput]}>
              <Text style={styles.label}>XP Reward</Text>
              <TextInput
                style={styles.input}
                value={xpReward}
                onChangeText={setXpReward}
                placeholder="100"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.rewardInput]}>
              <Text style={styles.label}>Gold Reward</Text>
              <TextInput
                style={styles.input}
                value={goldReward}
                onChangeText={setGoldReward}
                placeholder="50"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Unlockable Content (Optional)</Text>
            <TextInput
              style={styles.input}
              value={unlockableContent}
              onChangeText={setUnlockableContent}
              placeholder="Special reward or content unlocked"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.xpPreview}>
            <Text style={styles.xpText}>Total XP Reward: {calculateXP()}</Text>
          </View>
        </View>
      )}


      {/* Characteristics */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Characteristics {itemType === 'task' ? '*' : ''}</Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowExistingCharacteristics(!showExistingCharacteristics)}
          >
            <Text style={styles.toggleButtonText}>
              {showExistingCharacteristics ? 'Create New' : 'Use Existing'}
            </Text>
          </TouchableOpacity>
        </View>

        {showExistingCharacteristics ? (
          <View style={styles.existingSection}>
            <Text style={styles.sectionSubtitle}>Select from existing characteristics:</Text>
            {getAvailableCharacteristicsFiltered().length === 0 ? (
              <Text style={styles.noItemsText}>
                {availableCharacteristics.length === 0 
                  ? 'No characteristics available. Create characteristics first in the Skills tab.' 
                  : 'All available characteristics already selected.'}
              </Text>
            ) : (
              <View style={styles.existingItemsGrid}>
                {getAvailableCharacteristicsFiltered().map((charName) => (
                  <TouchableOpacity
                    key={charName}
                    style={styles.existingItem}
                    onPress={() => toggleExistingCharacteristic(charName)}
                  >
                    <Text style={styles.existingItemText}>{charName}</Text>
                    <Ionicons name="add-circle" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.skillInput]}
              placeholder="Add characteristic"
              placeholderTextColor={Colors.textSecondary}
              value={characteristicInput}
              onChangeText={setCharacteristicInput}
              onSubmitEditing={addCharacteristic}
            />
            <TouchableOpacity style={styles.addButton} onPress={addCharacteristic}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        )}

        {characteristics.map((char, index) => (
          <View key={index} style={styles.characteristicItem}>
            <Text style={styles.characteristicText}>{char}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeCharacteristic(char)}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Quest Related Tasks (Quest only) */}
      {itemType === 'quest' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related Tasks (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Select tasks that are part of this quest
          </Text>
          
          {availableTasks.length === 0 ? (
            <Text style={styles.noTasksText}>No available tasks found</Text>
          ) : (
            availableTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskItem,
                  selectedTasks.includes(task.id) && styles.selectedTaskItem
                ]}
                onPress={() => toggleTaskSelection(task.id)}
              >
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskXP}>{task.xp} XP</Text>
                </View>
                <Ionicons
                  name={selectedTasks.includes(task.id) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={selectedTasks.includes(task.id) ? Colors.success : Colors.textSecondary}
                />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Group Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Group</Text>
        <TouchableOpacity
          style={styles.groupSelector}
          onPress={() => setShowGroupModal(true)}
        >
          <Text style={styles.groupSelectorText}>
            {selectedGroup || 'Select Group (Optional)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Due Date */}
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.sectionTitle}>Due Date</Text>
          <Switch
            value={hasDueDate}
            onValueChange={setHasDueDate}
            trackColor={{ false: Colors.surfaceDark, true: Colors.primary }}
            thumbColor={Colors.text}
          />
        </View>

        {hasDueDate && (
          <>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {dueDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            
            {itemType === 'task' && (
              <>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {dueDate.toLocaleTimeString()}
                  </Text>
                </TouchableOpacity>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Auto-fail if not completed</Text>
                  <Switch
                    value={autoFail}
                    onValueChange={setAutoFail}
                    trackColor={{ false: Colors.surfaceDark, true: Colors.danger }}
                    thumbColor={Colors.text}
                  />
                </View>
              </>
            )}
          </>
        )}
      </View>

      {/* Task Repetition (Task only) */}
      {itemType === 'task' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repetition</Text>
          <View style={styles.repetitionContainer}>
            <View style={styles.repetitionButtons}>
              {[
                { value: 'one_time', label: 'One Time' },
                { value: 'daily', label: 'Daily' },
                { value: 'weekdays', label: 'Weekdays' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.repetitionButton,
                    repetition === type.value && styles.repetitionButtonActive
                  ]}
                  onPress={() => setRepetition(type.value as RepetitionType)}
                >
                  <Text style={[
                    styles.repetitionButtonText,
                    repetition === type.value && styles.repetitionButtonTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.repetitionButtons}>
              {[
                { value: 'weekends', label: 'Weekends' },
                { value: 'weekly', label: 'Custom Days' },
                { value: 'custom', label: 'Custom' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.repetitionButton,
                    repetition === type.value && styles.repetitionButtonActive
                  ]}
                  onPress={() => setRepetition(type.value as RepetitionType)}
                >
                  <Text style={[
                    styles.repetitionButtonText,
                    repetition === type.value && styles.repetitionButtonTextActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Days of Week Selector for Weekly repetition */}
            {repetition === 'weekly' && (
              <View style={styles.daysOfWeekContainer}>
                <Text style={styles.sectionLabel}>Select Days of Week:</Text>
                <View style={styles.daysOfWeekButtons}>
                  {[
                    { day: 0, label: 'Sun' },
                    { day: 1, label: 'Mon' },
                    { day: 2, label: 'Tue' },
                    { day: 3, label: 'Wed' },
                    { day: 4, label: 'Thu' },
                    { day: 5, label: 'Fri' },
                    { day: 6, label: 'Sat' },
                  ].map((dayInfo) => (
                    <TouchableOpacity
                      key={dayInfo.day}
                      style={[
                        styles.dayButton,
                        selectedDaysOfWeek.includes(dayInfo.day) && styles.dayButtonActive
                      ]}
                      onPress={() => {
                        if (selectedDaysOfWeek.includes(dayInfo.day)) {
                          setSelectedDaysOfWeek(selectedDaysOfWeek.filter(d => d !== dayInfo.day));
                        } else {
                          setSelectedDaysOfWeek([...selectedDaysOfWeek, dayInfo.day]);
                        }
                      }}
                    >
                      <Text style={[
                        styles.dayButtonText,
                        selectedDaysOfWeek.includes(dayInfo.day) && styles.dayButtonTextActive
                      ]}>
                        {dayInfo.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Task Generate Habit (Task only) */}
      {itemType === 'task' && (
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
              <Text style={styles.switchLabel}>Required consecutive days:</Text>
              <TextInput
                style={styles.numberInput}
                value={habitDays.toString()}
                onChangeText={(text) => setHabitDays(Math.max(1, parseInt(text) || 1))}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>
      )}

      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, isLoading && styles.createButtonDisabled]}
        onPress={handleCreate}
        disabled={isLoading}
      >
        <Text style={styles.createButtonText}>
          {isLoading ? `Creating ${itemType}...` : `Create ${itemType === 'task' ? 'Task' : 'Quest'}`}
        </Text>
      </TouchableOpacity>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={dueDate}
          mode="time"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Group Selection Modal */}
      <Modal
        visible={showGroupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Group</Text>
            
            <TouchableOpacity
              style={styles.groupOption}
              onPress={() => {
                setSelectedGroup('');
                setShowGroupModal(false);
              }}
            >
              <Text style={styles.groupOptionText}>No Group</Text>
            </TouchableOpacity>
            
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupOption}
                onPress={() => {
                  setSelectedGroup(group.name);
                  setShowGroupModal(false);
                }}
              >
                <View style={[styles.groupColorDot, { backgroundColor: group.color }]} />
                <Text style={styles.groupOptionText}>{group.name}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGroupModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Questionnaire Modal */}
      <Modal
        visible={showQuestionnaire}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <TaskEvaluationQuestionnaire
          onComplete={handleQuestionnaireComplete}
          onCancel={handleQuestionnaireCancel}
        />
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  typeExplanation: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  typeButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  typeText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  typeTextActive: {
    color: Colors.background,
  },
  typeDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  typeDescriptionActive: {
    color: Colors.background + 'CC',
  },
  currentTypeInfo: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  currentTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  currentTypeTitle: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  typeFeatures: {
    gap: Spacing.xs,
  },
  featureItem: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    lineHeight: 18,
  },
  skillDirectionHelp: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  skillDirectionText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontStyle: 'italic',
    lineHeight: 18,
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
  toggleButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  toggleButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.background,
    fontWeight: 'bold',
  },
  existingSection: {
    marginBottom: Spacing.md,
  },
  existingItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  existingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  existingItemText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  noItemsText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 8,
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
  skillControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillTypeButton: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 4,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  skillTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  skillTypeText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: 'bold',
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
  characteristicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  characteristicText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    flex: 1,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  selectedPriorityText: {
    color: Colors.background,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  rewardInput: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  xpPreview: {
    backgroundColor: Colors.gold + '20',
    borderRadius: 8,
    padding: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  xpText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.gold,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedTaskItem: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '20',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
  },
  taskXP: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  noTasksText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: Spacing.lg,
  },
  groupSelector: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupSelectorText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  switchLabel: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  dateButton: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateButtonText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    textAlign: 'center',
  },
  repetitionContainer: {
    gap: Spacing.sm,
  },
  repetitionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  repetitionButton: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.sm,
    flex: 1,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  repetitionButtonActive: {
    backgroundColor: Colors.primary,
  },
  repetitionButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  repetitionButtonTextActive: {
    color: Colors.textLight,
    fontWeight: 'bold',
  },
  daysOfWeekContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  daysOfWeekButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  dayButton: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    minWidth: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayButtonActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  dayButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  dayButtonTextActive: {
    color: Colors.textLight,
    fontWeight: 'bold',
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
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  createButtonDisabled: {
    backgroundColor: Colors.surfaceDark,
  },
  createButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
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
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  groupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  groupColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: Spacing.sm,
  },
  groupOptionText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  modalCloseButton: {
    backgroundColor: Colors.danger,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalCloseText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  // Questionnaire Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  questionnaireToggleButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  questionnaireToggleButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.background,
    fontWeight: 'bold',
  },
  questionnaireSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slidersSection: {
    // No specific styles needed, just a wrapper
  },
  startQuestionnaireButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  startQuestionnaireText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
  questionnaireResults: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  resultLabel: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  redoQuestionnaireButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing.xs,
  },
  redoQuestionnaireText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default CreateItemScreen;