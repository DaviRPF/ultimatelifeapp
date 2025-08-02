import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Quest, Task } from '../../types';
import StorageService from '../../services/StorageService';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

const CreateQuestScreen: React.FC = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Quest['priority']>('medium');
  const [xpReward, setXpReward] = useState('100');
  const [goldReward, setGoldReward] = useState('50');
  const [unlockableContent, setUnlockableContent] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasDueDate, setHasDueDate] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  
  // Skills and Characteristics
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [availableCharacteristics, setAvailableCharacteristics] = useState<string[]>([]);
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableData();
  }, []);

  const loadAvailableData = async () => {
    try {
      const storageService = StorageService.getInstance();
      const tasks = storageService.getTasks().filter(task => !task.completed);
      const skills = storageService.getSkills();
      const characteristics = storageService.getCharacteristics();
      
      setAvailableTasks(tasks);
      setAvailableSkills(Object.keys(skills));
      setAvailableCharacteristics(Object.keys(characteristics));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreateQuest = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a quest title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a quest description');
      return;
    }

    const xp = parseInt(xpReward) || 0;
    const gold = parseInt(goldReward) || 0;

    if (xp < 0 || gold < 0) {
      Alert.alert('Error', 'Rewards must be positive numbers');
      return;
    }

    try {
      const storageService = StorageService.getInstance();
      
      const newQuest: Quest = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        status: 'active',
        priority,
        relatedTasks: selectedTasks,
        progress: 0,
        rewards: {
          xp,
          gold,
          unlockableContent: unlockableContent.trim() || undefined,
        },
        createdAt: new Date().toISOString(),
        dueDate: hasDueDate && dueDate ? dueDate.toISOString() : undefined,
        notes: [],
        characteristics: selectedCharacteristics,
      };

      await storageService.addQuest(newQuest);
      
      Alert.alert('Success', 'Quest created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating quest:', error);
      Alert.alert('Error', 'Failed to create quest. Please try again.');
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSkillSelection = (skillName: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillName) 
        ? prev.filter(name => name !== skillName)
        : [...prev, skillName]
    );
  };

  const toggleCharacteristicSelection = (charName: string) => {
    setSelectedCharacteristics(prev => 
      prev.includes(charName) 
        ? prev.filter(name => name !== charName)
        : [...prev, charName]
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.background} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Quest</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quest Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter quest title"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your quest..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rewards</Text>
          
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills & Characteristics</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Associated Skills</Text>
            <Text style={styles.subsectionSubtitle}>
              Select existing skills that this quest will affect
            </Text>
            
            {availableSkills.length === 0 ? (
              <Text style={styles.noItemsText}>No skills available. Create skills first in the Skills tab.</Text>
            ) : (
              <View style={styles.skillsGrid}>
                {availableSkills.map((skillName) => (
                  <TouchableOpacity
                    key={skillName}
                    style={[
                      styles.skillItem,
                      selectedSkills.includes(skillName) && styles.selectedSkillItem
                    ]}
                    onPress={() => toggleSkillSelection(skillName)}
                  >
                    <Text style={[
                      styles.skillText,
                      selectedSkills.includes(skillName) && styles.selectedSkillText
                    ]}>
                      {skillName}
                    </Text>
                    {selectedSkills.includes(skillName) && (
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Associated Characteristics</Text>
            <Text style={styles.subsectionSubtitle}>
              Select existing characteristics that this quest will affect
            </Text>
            
            {availableCharacteristics.length === 0 ? (
              <Text style={styles.noItemsText}>No characteristics available. Create characteristics first in the Skills tab.</Text>
            ) : (
              <View style={styles.skillsGrid}>
                {availableCharacteristics.map((charName) => (
                  <TouchableOpacity
                    key={charName}
                    style={[
                      styles.skillItem,
                      selectedCharacteristics.includes(charName) && styles.selectedSkillItem
                    ]}
                    onPress={() => toggleCharacteristicSelection(charName)}
                  >
                    <Text style={[
                      styles.skillText,
                      selectedCharacteristics.includes(charName) && styles.selectedSkillText
                    ]}>
                      {charName}
                    </Text>
                    {selectedCharacteristics.includes(charName) && (
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Due Date</Text>
          
          <View style={styles.dueDateRow}>
            <Switch
              value={hasDueDate}
              onValueChange={setHasDueDate}
              trackColor={{ false: Colors.textSecondary, true: Colors.primary }}
              thumbColor={hasDueDate ? Colors.secondary : Colors.surface}
            />
            <Text style={styles.dueDateLabel}>Set due date</Text>
          </View>

          {hasDueDate && (
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.dateButtonText}>
                {dueDate ? dueDate.toLocaleDateString() : 'Select date'}
              </Text>
            </TouchableOpacity>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

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

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateQuest}
        >
          <Ionicons name="add-circle" size={24} color={Colors.background} />
          <Text style={styles.createButtonText}>Create Quest</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    backgroundColor: Colors.primary,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.background,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
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
    marginBottom: Spacing.md,
  },
  subsection: {
    marginBottom: Spacing.lg,
  },
  subsectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subsectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.textSecondary + '30',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
    borderColor: Colors.textSecondary + '30',
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
  },
  rewardInput: {
    flex: 1,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.textSecondary + '30',
    gap: Spacing.xs,
  },
  selectedSkillItem: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  skillText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  selectedSkillText: {
    color: Colors.primary,
    fontWeight: 'bold',
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
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dueDateLabel: {
    fontSize: FontSizes.md,
    color: Colors.text,
    marginLeft: Spacing.md,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.textSecondary + '30',
    gap: Spacing.sm,
  },
  dateButtonText: {
    fontSize: FontSizes.md,
    color: Colors.text,
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
    borderColor: Colors.textSecondary + '30',
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
  createButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: 12,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  createButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.background,
  },
});

export default CreateQuestScreen;