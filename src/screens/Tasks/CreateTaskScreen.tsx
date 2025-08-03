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
// import TaskEvaluationQuestionnaire, { QuestionnaireResult } from '../../components/TaskEvaluationQuestionnaire';
import GameEngine from '../../services/GameEngine';
import StorageService from '../../services/StorageService';
import { RootStackParamList, Task, Group } from '../../types';

type CreateTaskScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateTask'>;

interface Props {
  navigation: CreateTaskScreenNavigationProp;
}

const CreateTaskScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(50);
  const [importance, setImportance] = useState(50);
  const [fear, setFear] = useState(50);
  const [characteristics, setCharacteristics] = useState<string[]>([]);
  const [characteristicInput, setCharacteristicInput] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Due date settings
  const [hasDueDate, setHasDueDate] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Repetition settings
  const [repetition, setRepetition] = useState<'one_time' | 'continuous' | 'custom'>('one_time');
  const [customInterval, setCustomInterval] = useState(1);
  const [customUnit, setCustomUnit] = useState<'days' | 'weeks' | 'months'>('days');
  
  // Notifications and habits
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [autoFail, setAutoFail] = useState(false);
  const [habitEnabled, setHabitEnabled] = useState(false);
  const [habitDays, setHabitDays] = useState(7);
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Existing characteristics
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
  }, []);

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


  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return false;
    }


    if (characteristics.length === 0) {
      Alert.alert('Error', 'At least one characteristic is required');
      return false;
    }

    if (difficulty < 10 || importance < 10 || fear < 10) {
      Alert.alert('Error', 'All attributes must be at least 10%');
      return false;
    }

    if (useQuestionnaire && !questionnaireCompleted) {
      Alert.alert('Error', 'Please complete the questionnaire or switch to sliders to set attributes');
      return false;
    }

    return true;
  };

  const handleCreateTask = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
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
        } : {
          interval: 1,
          unit: 'days',
        },
        group: selectedGroup,
        notificationEnabled,
        notificationIntervals: notificationEnabled ? [60, 30, 10] : [], // Default intervals in minutes
        autoFail: hasDueDate && autoFail,
        habit: {
          enabled: habitEnabled,
          requiredDays: habitDays,
          currentStreak: 0,
          lastCompletedDate: '',
        },
      };

      await gameEngine.createTask(taskData);
      Alert.alert('Success', 'Quest created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create quest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateXP = () => {
    return Math.round(((difficulty + importance + fear) / 3) * 2.5);
  };

  // Questionnaire handlers
  const handleQuestionnaireComplete = (result: any) => {
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

  const resetToSliders = () => {
    setUseQuestionnaire(false);
    setQuestionnaireCompleted(false);
    setDifficulty(50);
    setImportance(50);
    setFear(50);
  };

  // Debug para verificar se o estado está sendo alterado
  console.log('🔍 RENDER - useQuestionnaire:', useQuestionnaire);

  // Early return para teste - só mostrar o debug
  if (true) { // FORÇANDO TESTE - mudando para true para mostrar apenas o debug
    return (
      <View style={{ flex: 1, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'white', fontSize: 24, textAlign: 'center', marginBottom: 20 }}>
          🚨 TESTE FORÇADO 🚨{'\n'}
          CreateTaskScreen
        </Text>
        <Text style={{ color: 'yellow', fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
          useQuestionnaire: {useQuestionnaire.toString()}
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10 }}
          onPress={() => {
            console.log('🔄 BOTÃO CLICADO!');
            setUseQuestionnaire(!useQuestionnaire);
          }}
        >
          <Text style={{ color: 'red', fontSize: 16, fontWeight: 'bold' }}>
            CLIQUE PARA TESTAR: {useQuestionnaire ? 'QUESTIONÁRIO ATIVO' : 'SLIDERS ATIVOS'}
          </Text>
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 14, textAlign: 'center' }}>
          Se você vê esta tela vermelha, o componente está funcionando.{'\n'}
          Se não vê, há um erro mais profundo.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Create New Quest</Text>
      
      {/* DEBUG HEADER - DEVE APARECER NO TOPO */}
      <View style={{ backgroundColor: 'purple', padding: 15, margin: 10 }}>
        <Text style={{ color: 'white', textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
          🚨 SISTEMA DE QUESTIONÁRIO ADICIONADO 🚨
        </Text>
        <Text style={{ color: 'white', textAlign: 'center', fontSize: 14 }}>
          Estado: {useQuestionnaire ? 'Questionário Ativo' : 'Sliders Ativos'}
        </Text>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quest Details</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Quest Title *"
          placeholderTextColor={Colors.textSecondary}
          value={title}
          onChangeText={setTitle}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          placeholderTextColor={Colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Attributes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attributes</Text>
        
        {/* TESTE VISIBILIDADE */}
        <View style={{ backgroundColor: 'red', padding: 20, marginVertical: 10 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16 }}>
            TESTE VISIBILIDADE - Se você vê isso, o código está funcionando
          </Text>
        </View>
        
        {/* BOTÃO PARA ALTERNAR MÉTODO */}
        <TouchableOpacity
          style={{
            backgroundColor: useQuestionnaire ? '#4CAF50' : '#2196F3',
            padding: 15,
            borderRadius: 10,
            marginVertical: 10,
            alignItems: 'center',
          }}
          onPress={() => {
            console.log('🔄 TOGGLE PRESSED - Current:', useQuestionnaire, '-> New:', !useQuestionnaire);
            setUseQuestionnaire(!useQuestionnaire);
          }}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            {useQuestionnaire ? '📋 USANDO QUESTIONÁRIO - Clique para Sliders' : '🎚️ USANDO SLIDERS - Clique para Questionário'}
          </Text>
        </TouchableOpacity>

        <View style={{ backgroundColor: 'yellow', padding: 10, marginVertical: 5 }}>
          <Text style={{ color: 'black', textAlign: 'center' }}>
            Estado atual: {useQuestionnaire ? 'QUESTIONÁRIO' : 'SLIDERS'}
          </Text>
        </View>

        {useQuestionnaire ? (
          <View style={styles.questionnaireSection}>
            <Text style={styles.sectionSubtitle}>
              Responda 15 perguntas para uma avaliação mais precisa dos atributos da sua quest.
            </Text>
            
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
                <Text style={styles.startQuestionnaireText}>Iniciar Questionário</Text>
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


      {/* Characteristics */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Characteristics *</Text>
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
      </View>

      {/* Repetition */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repetition</Text>
        <View style={styles.repetitionButtons}>
          {['one_time', 'continuous', 'custom'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.repetitionButton,
                repetition === type && styles.repetitionButtonActive
              ]}
              onPress={() => setRepetition(type as any)}
            >
              <Text style={styles.repetitionButtonText}>
                {type.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Generate Habit */}
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

      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, isLoading && styles.createButtonDisabled]}
        onPress={handleCreateTask}
        disabled={isLoading}
      >
        <Text style={styles.createButtonText}>
          {isLoading ? 'Creating Quest...' : 'Create Quest'}
        </Text>
      </TouchableOpacity>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDueDate(selectedDate);
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={dueDate}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) setDueDate(selectedTime);
          }}
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
        <View style={{ flex: 1, backgroundColor: 'green', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 20, textAlign: 'center' }}>
            MODAL DO QUESTIONÁRIO{'\n'}
            (Componente será adicionado aqui)
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginTop: 20 }}
            onPress={handleQuestionnaireCancel}
          >
            <Text style={{ color: 'green', fontSize: 16, fontWeight: 'bold' }}>Fechar</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: Spacing.lg,
    textAlign: 'center',
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
  repetitionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
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
  // Questionnaire Toggle Styles
  questionnaireToggleContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  toggleLabel: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  questionnaireToggle: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  questionnaireToggleActive: {
    backgroundColor: Colors.primary,
  },
  questionnaireToggleText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  questionnaireToggleTextActive: {
    color: Colors.background,
  },
  debugText: {
    fontSize: FontSizes.xs,
    color: Colors.warning,
    textAlign: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.xs,
    borderRadius: 4,
    marginBottom: Spacing.md,
    fontFamily: 'monospace',
  },
  // Questionnaire Styles
  questionnaireSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
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
    marginTop: Spacing.md,
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
    marginTop: Spacing.md,
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

export default CreateTaskScreen;