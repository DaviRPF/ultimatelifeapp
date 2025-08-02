import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CustomAchievement, CustomAchievementCondition } from '../../types';
import StorageService from '../../services/StorageService';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

const CreateAchievementScreen = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prize, setPrize] = useState('');
  const [conditions, setConditions] = useState<CustomAchievementCondition[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [availableCharacteristics, setAvailableCharacteristics] = useState<string[]>([]);

  // New condition form
  const [newConditionType, setNewConditionType] = useState<CustomAchievementCondition['type']>('task_executions');
  const [newConditionTarget, setNewConditionTarget] = useState('');
  const [newConditionSkill, setNewConditionSkill] = useState('');
  const [newConditionCharacteristic, setNewConditionCharacteristic] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storageService = StorageService.getInstance();
      const skills = storageService.getSkills();
      const characteristics = storageService.getCharacteristics();
      
      setAvailableSkills(Object.keys(skills));
      setAvailableCharacteristics(Object.keys(characteristics));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addCondition = () => {
    const target = parseInt(newConditionTarget);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Error', 'Please enter a valid target number');
      return;
    }

    let condition: CustomAchievementCondition;

    switch (newConditionType) {
      case 'task_executions':
        condition = { type: 'task_executions', target };
        break;
      case 'skill_level':
        if (!newConditionSkill) {
          Alert.alert('Error', 'Please select a skill');
          return;
        }
        condition = { type: 'skill_level', target, skillName: newConditionSkill };
        break;
      case 'characteristic_level':
        if (!newConditionCharacteristic) {
          Alert.alert('Error', 'Please select a characteristic');
          return;
        }
        condition = { type: 'characteristic_level', target, characteristicName: newConditionCharacteristic };
        break;
    }

    setConditions([...conditions, condition]);
    
    // Reset form
    setNewConditionTarget('');
    setNewConditionSkill('');
    setNewConditionCharacteristic('');
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleCreateAchievement = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an achievement title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter an achievement description');
      return;
    }

    if (!prize.trim()) {
      Alert.alert('Error', 'Please enter a prize description');
      return;
    }

    if (conditions.length === 0) {
      Alert.alert('Error', 'Please add at least one unlock condition');
      return;
    }

    try {
      const storageService = StorageService.getInstance();
      const achievements = storageService.getAchievements();
      
      const newAchievement: CustomAchievement = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        prize: prize.trim(),
        unlocked: false,
        conditions: [...conditions],
      };

      const updatedAchievements = {
        ...achievements,
        custom: [...achievements.custom, newAchievement],
      };

      await storageService.updateAchievements(updatedAchievements);
      
      Alert.alert('Success', 'Custom achievement created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating achievement:', error);
      Alert.alert('Error', 'Failed to create achievement. Please try again.');
    }
  };

  const getConditionDescription = (condition: CustomAchievementCondition) => {
    switch (condition.type) {
      case 'task_executions':
        return `Complete ${condition.target} tasks`;
      case 'skill_level':
        return `Reach level ${condition.target} in ${condition.skillName}`;
      case 'characteristic_level':
        return `Reach level ${condition.target} in ${condition.characteristicName}`;
      default:
        return 'Unknown condition';
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
        <Text style={styles.headerTitle}>Create Achievement</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievement Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Achievement name"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what this achievement is for..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prize *</Text>
            <TextInput
              style={styles.input}
              value={prize}
              onChangeText={setPrize}
              placeholder="What reward do you get? (e.g., Watch a movie, Buy a coffee)"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unlock Conditions</Text>
          <Text style={styles.sectionSubtitle}>
            All conditions must be met to unlock this achievement
          </Text>

          <View style={styles.conditionForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Condition Type</Text>
              <View style={styles.conditionTypeButtons}>
                {(['task_executions', 'skill_level', 'characteristic_level'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.conditionTypeButton,
                      newConditionType === type && styles.conditionTypeButtonActive
                    ]}
                    onPress={() => setNewConditionType(type)}
                  >
                    <Text style={[
                      styles.conditionTypeButtonText,
                      newConditionType === type && styles.conditionTypeButtonTextActive
                    ]}>
                      {type === 'task_executions' ? 'Tasks' :
                       type === 'skill_level' ? 'Skill' :
                       'Characteristic'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {newConditionType === 'skill_level' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Skill</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skillScroll}>
                  {availableSkills.map((skillName) => (
                    <TouchableOpacity
                      key={skillName}
                      style={[
                        styles.skillButton,
                        newConditionSkill === skillName && styles.skillButtonActive
                      ]}
                      onPress={() => setNewConditionSkill(skillName)}
                    >
                      <Text style={[
                        styles.skillButtonText,
                        newConditionSkill === skillName && styles.skillButtonTextActive
                      ]}>
                        {skillName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {newConditionType === 'characteristic_level' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Characteristic</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skillScroll}>
                  {availableCharacteristics.map((charName) => (
                    <TouchableOpacity
                      key={charName}
                      style={[
                        styles.skillButton,
                        newConditionCharacteristic === charName && styles.skillButtonActive
                      ]}
                      onPress={() => setNewConditionCharacteristic(charName)}
                    >
                      <Text style={[
                        styles.skillButtonText,
                        newConditionCharacteristic === charName && styles.skillButtonTextActive
                      ]}>
                        {charName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.targetRow}>
              <View style={styles.targetInputGroup}>
                <Text style={styles.label}>Target</Text>
                <TextInput
                  style={styles.targetInput}
                  value={newConditionTarget}
                  onChangeText={setNewConditionTarget}
                  placeholder="Number"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                style={styles.addConditionButton}
                onPress={addCondition}
              >
                <Ionicons name="add" size={20} color={Colors.background} />
                <Text style={styles.addConditionButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {conditions.length > 0 && (
            <View style={styles.conditionsList}>
              <Text style={styles.conditionsListTitle}>Conditions ({conditions.length})</Text>
              {conditions.map((condition, index) => (
                <View key={index} style={styles.conditionItem}>
                  <Text style={styles.conditionText}>
                    {getConditionDescription(condition)}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeConditionButton}
                    onPress={() => removeCondition(index)}
                  >
                    <Ionicons name="trash" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateAchievement}
        >
          <Ionicons name="trophy" size={24} color={Colors.background} />
          <Text style={styles.createButtonText}>Create Achievement</Text>
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
    height: 80,
    textAlignVertical: 'top',
  },
  conditionForm: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  conditionTypeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  conditionTypeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.textSecondary + '30',
    alignItems: 'center',
  },
  conditionTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  conditionTypeButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  conditionTypeButtonTextActive: {
    color: Colors.background,
  },
  skillScroll: {
    maxHeight: 50,
  },
  skillButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.textSecondary + '30',
    marginRight: Spacing.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  skillButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  skillButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  skillButtonTextActive: {
    color: Colors.background,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  targetInputGroup: {
    flex: 1,
  },
  targetInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.textSecondary + '30',
  },
  addConditionButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 8,
    gap: Spacing.xs,
    minWidth: 80,
  },
  addConditionButtonText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
  conditionsList: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
  },
  conditionsListTitle: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  conditionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.textSecondary + '20',
  },
  conditionText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  removeConditionButton: {
    padding: Spacing.xs,
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

export default CreateAchievementScreen;