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
import Slider from '@react-native-community/slider';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { DIFFICULTY_DESCRIPTIONS, IMPORTANCE_DESCRIPTIONS, FEAR_DESCRIPTIONS } from '../../constants/attributes';
import AttributeSlider from '../../components/AttributeSlider';
import TaskEvaluationQuestionnaire, { QuestionnaireResult } from '../../components/TaskEvaluationQuestionnaire';
import GameEngine from '../../services/GameEngine';
import StorageService from '../../services/StorageService';
import { RootStackParamList, Task, Quest, Group, RepetitionType, WeeklyRepetition, TaskType, NumericTaskConfig } from '../../types';

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
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [skillImpacts, setSkillImpacts] = useState<{ [key: string]: number }>({});
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
  const [infiniteTask, setInfiniteTask] = useState(false);
  
  // Numeric task settings
  const [taskType, setTaskType] = useState<TaskType>('binary');
  const [numericUnit, setNumericUnit] = useState('');
  const [minimumTarget, setMinimumTarget] = useState('');
  const [dailyTarget, setDailyTarget] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Existing skills and characteristics
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [showExistingSkills, setShowExistingSkills] = useState(false);
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
      const skills = storageService.getSkills();
      
      setAvailableSkills(Object.keys(skills));
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

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      const newSkill = skillInput.trim();
      setSkills([...skills, newSkill]);
      setSkillImpacts({ ...skillImpacts, [newSkill]: 100 }); // Default 100% impact
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
    const newImpacts = { ...skillImpacts };
    delete newImpacts[skillToRemove];
    setSkillImpacts(newImpacts);
  };


  const toggleExistingSkill = (skillName: string) => {
    if (skills.includes(skillName)) {
      setSkills(skills.filter(skill => skill !== skillName));
      const newImpacts = { ...skillImpacts };
      delete newImpacts[skillName];
      setSkillImpacts(newImpacts);
    } else {
      setSkills([...skills, skillName]);
      setSkillImpacts({ ...skillImpacts, [skillName]: 100 }); // Default 100% impact
    }
  };

  const updateSkillImpact = (skillName: string, impact: number) => {
    setSkillImpacts({ ...skillImpacts, [skillName]: impact });
  };


  const getAvailableSkillsFiltered = () => {
    return availableSkills.filter(skillName => !skills.includes(skillName));
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
      if (skills.length === 0) {
        Alert.alert('Error', 'At least one skill is required');
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
    const numericConfig: NumericTaskConfig | undefined = taskType === 'numeric' ? {
      unit: numericUnit.trim(),
      minimumTarget: parseFloat(minimumTarget),
      dailyTarget: dailyTarget ? parseFloat(dailyTarget) : undefined,
    } : undefined;

    const taskData: Omit<Task, 'id' | 'xp' | 'createdAt' | 'completed' | 'failed' | 'completedAt'> = {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      importance,
      fear,
      skills,
      skillImpacts,
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
      infinite: infiniteTask,
      taskType,
      numericConfig,
      currentDayValue: taskType === 'numeric' ? 0 : undefined,
      pendingValue: taskType === 'numeric' ? 0 : undefined,
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
      skills,
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

      {/* Task Type (Task only) */}
      {itemType === 'task' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Type</Text>
          <Text style={styles.sectionSubtitle}>
            Choose how you want to track progress for this task
          </Text>
          
          <View style={styles.taskTypeContainer}>
            <TouchableOpacity
              style={[styles.taskTypeButton, taskType === 'binary' && styles.taskTypeButtonActive]}
              onPress={() => setTaskType('binary')}
            >
              <View style={styles.taskTypeHeader}>
                <Ionicons name="checkbox" size={24} color={taskType === 'binary' ? Colors.background : Colors.primary} />
                <Text style={[styles.taskTypeText, taskType === 'binary' && styles.taskTypeTextActive]}>Binária</Text>
              </View>
              <Text style={[styles.taskTypeDescription, taskType === 'binary' && styles.taskTypeDescriptionActive]}>
                Tarefa tradicional: Concluir ou Falhar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.taskTypeButton, taskType === 'numeric' && styles.taskTypeButtonActive]}
              onPress={() => setTaskType('numeric')}
            >
              <View style={styles.taskTypeHeader}>
                <Ionicons name="stats-chart" size={24} color={taskType === 'numeric' ? Colors.background : Colors.primary} />
                <Text style={[styles.taskTypeText, taskType === 'numeric' && styles.taskTypeTextActive]}>Numérica</Text>
              </View>
              <Text style={[styles.taskTypeDescription, taskType === 'numeric' && styles.taskTypeDescriptionActive]}>
                Registro de valores quantitativos (ex: 500ml de água)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Numeric Configuration */}
          {taskType === 'numeric' && (
            <View style={styles.numericConfig}>
              <Text style={styles.numericConfigTitle}>📊 Configuração Numérica</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Unidade de Medida *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: ml, páginas, minutos, km"
                  placeholderTextColor={Colors.textSecondary}
                  value={numericUnit}
                  onChangeText={setNumericUnit}
                />
              </View>

              <View style={styles.numericInputRow}>
                <View style={[styles.inputGroup, styles.numericInputHalf]}>
                  <Text style={styles.label}>Meta Mínima *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    placeholderTextColor={Colors.textSecondary}
                    value={minimumTarget}
                    onChangeText={setMinimumTarget}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.inputHelp}>Valor mínimo para considerar sucesso</Text>
                </View>

                <View style={[styles.inputGroup, styles.numericInputHalf]}>
                  <Text style={styles.label}>Meta Diária (Opcional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="150"
                    placeholderTextColor={Colors.textSecondary}
                    value={dailyTarget}
                    onChangeText={setDailyTarget}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.inputHelp}>Meta ideal para o dia</Text>
                </View>
              </View>

              <View style={styles.numericExampleBox}>
                <Text style={styles.numericExampleTitle}>💡 Exemplo:</Text>
                <Text style={styles.numericExampleText}>
                  {numericUnit && minimumTarget ? 
                    `• Você precisa registrar pelo menos ${minimumTarget} ${numericUnit} para considerar sucesso\n` +
                    (dailyTarget ? `• Meta ideal: ${dailyTarget} ${numericUnit} por dia\n` : '') +
                    `• Pode inserir valores durante o dia e enviar manualmente\n` +
                    `• Ou deixar valores pendentes para envio automático à meia-noite`
                    :
                    'Configure a unidade e meta mínima para ver o exemplo'
                  }
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

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
                  {priorityOption ? priorityOption.toUpperCase() : ''}
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


      {/* Skills */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Skills {itemType === 'task' ? '*' : ''}</Text>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowExistingSkills(!showExistingSkills)}
          >
            <Text style={styles.toggleButtonText}>
              {showExistingSkills ? 'Create New' : 'Use Existing'}
            </Text>
          </TouchableOpacity>
        </View>

        {showExistingSkills ? (
          <View style={styles.existingSection}>
            <Text style={styles.sectionSubtitle}>Select from existing skills:</Text>
            {getAvailableSkillsFiltered().length === 0 ? (
              <Text style={styles.noItemsText}>
                {availableSkills.length === 0 
                  ? 'No skills available. Create skills first in the Skills tab.' 
                  : 'All available skills already selected.'}
              </Text>
            ) : (
              <View style={styles.existingItemsGrid}>
                {getAvailableSkillsFiltered().map((skillName) => (
                  <TouchableOpacity
                    key={skillName}
                    style={styles.existingItem}
                    onPress={() => toggleExistingSkill(skillName)}
                  >
                    <Text style={styles.existingItemText}>{skillName}</Text>
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
        )}

        {skills.map((skill, index) => (
          <View key={index} style={styles.skillItemWithImpact}>
            <View style={styles.skillHeader}>
              <Text style={styles.skillText}>{skill}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeSkill(skill)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.impactSliderContainer}>
              <Text style={styles.impactLabel}>
                Impacto: {skillImpacts[skill] || 100}%
              </Text>
              <Slider
                style={styles.impactSlider}
                minimumValue={0}
                maximumValue={100}
                value={skillImpacts[skill] || 100}
                onValueChange={(value) => updateSkillImpact(skill, Math.round(value))}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.surface}
                thumbStyle={{ backgroundColor: Colors.primary, width: 20, height: 20 }}
                trackStyle={{ height: 4, borderRadius: 2 }}
                step={5}
              />
              <Text style={styles.impactDescription}>
                Define quanto do XP da tarefa será aplicado a esta skill
              </Text>
            </View>
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

      {/* Infinite Task Option (Task only) */}
      {itemType === 'task' && (
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
  // Impact slider styles
  skillItemWithImpact: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  skillText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  impactSliderContainer: {
    marginTop: Spacing.sm,
  },
  impactLabel: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  impactSlider: {
    width: '100%',
    height: 40,
    marginBottom: Spacing.xs,
  },
  impactDescription: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  // Task Type Styles
  taskTypeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  taskTypeButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  taskTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  taskTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  taskTypeText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  taskTypeTextActive: {
    color: Colors.background,
  },
  taskTypeDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  taskTypeDescriptionActive: {
    color: Colors.background + 'CC',
  },
  // Numeric Configuration Styles
  numericConfig: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  numericConfigTitle: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  numericInputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  numericInputHalf: {
    flex: 1,
  },
  inputHelp: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
    lineHeight: 14,
  },
  numericExampleBox: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  numericExampleTitle: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  numericExampleText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    lineHeight: 18,
  },
});

export default CreateItemScreen;