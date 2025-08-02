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
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [characteristics, setCharacteristics] = useState<string[]>([]);
  const [characteristicInput, setCharacteristicInput] = useState('');
  const [increasingSkills, setIncreasingSkills] = useState<string[]>([]);
  const [decreasingSkills, setDecreasingSkills] = useState<string[]>([]);
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
  
  // Existing skills and characteristics
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [availableCharacteristics, setAvailableCharacteristics] = useState<string[]>([]);
  const [showExistingSkills, setShowExistingSkills] = useState(false);
  const [showExistingCharacteristics, setShowExistingCharacteristics] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

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
      const skills = storageService.getSkills();
      const characteristics = storageService.getCharacteristics();
      
      setAvailableSkills(Object.keys(skills));
      setAvailableCharacteristics(Object.keys(characteristics));
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      const newSkill = skillInput.trim();
      setSkills([...skills, newSkill]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
    setIncreasingSkills(increasingSkills.filter(skill => skill !== skillToRemove));
    setDecreasingSkills(decreasingSkills.filter(skill => skill !== skillToRemove));
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

  const toggleExistingSkill = (skillName: string) => {
    if (skills.includes(skillName)) {
      setSkills(skills.filter(skill => skill !== skillName));
    } else {
      setSkills([...skills, skillName]);
    }
  };

  const toggleExistingCharacteristic = (charName: string) => {
    if (characteristics.includes(charName)) {
      setCharacteristics(characteristics.filter(char => char !== charName));
    } else {
      setCharacteristics([...characteristics, charName]);
    }
  };

  const getAvailableSkillsFiltered = () => {
    return availableSkills.filter(skillName => !skills.includes(skillName));
  };

  const getAvailableCharacteristicsFiltered = () => {
    return availableCharacteristics.filter(charName => !characteristics.includes(charName));
  };

  const toggleSkillType = (skill: string, type: 'increasing' | 'decreasing') => {
    if (type === 'increasing') {
      if (increasingSkills.includes(skill)) {
        setIncreasingSkills(increasingSkills.filter(s => s !== skill));
      } else {
        setIncreasingSkills([...increasingSkills, skill]);
        setDecreasingSkills(decreasingSkills.filter(s => s !== skill));
      }
    } else {
      if (decreasingSkills.includes(skill)) {
        setDecreasingSkills(decreasingSkills.filter(s => s !== skill));
      } else {
        setDecreasingSkills([...decreasingSkills, skill]);
        setIncreasingSkills(increasingSkills.filter(s => s !== skill));
      }
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return false;
    }

    if (skills.length === 0) {
      Alert.alert('Error', 'At least one skill is required');
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
        skills,
        characteristics,
        increasingSkills,
        decreasingSkills,
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Create New Quest</Text>

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

        <View style={styles.xpPreview}>
          <Text style={styles.xpText}>Estimated XP: {calculateXP()}</Text>
        </View>
      </View>

      {/* Skills */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Skills *</Text>
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
          <View key={index} style={styles.skillItem}>
            <Text style={styles.skillText}>{skill}</Text>
            <View style={styles.skillControls}>
              <TouchableOpacity
                style={[
                  styles.skillTypeButton,
                  increasingSkills.includes(skill) && styles.skillTypeButtonActive
                ]}
                onPress={() => toggleSkillType(skill, 'increasing')}
              >
                <Text style={styles.skillTypeText}>↑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.skillTypeButton,
                  decreasingSkills.includes(skill) && styles.skillTypeButtonActive
                ]}
                onPress={() => toggleSkillType(skill, 'decreasing')}
              >
                <Text style={styles.skillTypeText}>↓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeSkill(skill)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
});

export default CreateTaskScreen;