import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import SkillBar from '../../components/SkillBar';
import GameEngine from '../../services/GameEngine';
import { AppData, Skill, Characteristic } from '../../types';

const SkillsScreen = () => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillType, setNewSkillType] = useState<'increasing' | 'decreasing'>('increasing');
  const [newCharacteristics, setNewCharacteristics] = useState<string[]>([]);
  const [characteristicInput, setCharacteristicInput] = useState('');
  const [activeTab, setActiveTab] = useState<'skills' | 'characteristics'>('skills');
  
  // Edit states
  const [showEditSkillModal, setShowEditSkillModal] = useState(false);
  const [showEditCharModal, setShowEditCharModal] = useState(false);
  const [showAddCharModal, setShowAddCharModal] = useState(false);
  const [editingSkillName, setEditingSkillName] = useState('');
  const [editingCharName, setEditingCharName] = useState('');
  const [editSkillName, setEditSkillName] = useState('');
  const [editSkillType, setEditSkillType] = useState<'increasing' | 'decreasing'>('increasing');
  const [editCharacteristics, setEditCharacteristics] = useState<string[]>([]);
  const [editCharInput, setEditCharInput] = useState('');
  const [newCharName, setNewCharName] = useState('');
  const [showExistingChars, setShowExistingChars] = useState(false);

  const gameEngine = GameEngine.getInstance();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const data = await gameEngine.getAppData();
      setAppData(data);
    } catch (error) {
      console.error('Error loading skills data:', error);
      Alert.alert('Error', 'Failed to load skills data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const addCharacteristic = () => {
    if (characteristicInput.trim() && !newCharacteristics.includes(characteristicInput.trim())) {
      setNewCharacteristics([...newCharacteristics, characteristicInput.trim()]);
      setCharacteristicInput('');
    }
  };

  const removeCharacteristic = (charToRemove: string) => {
    setNewCharacteristics(newCharacteristics.filter(char => char !== charToRemove));
  };

  const toggleExistingCharacteristic = (charName: string) => {
    if (newCharacteristics.includes(charName)) {
      setNewCharacteristics(newCharacteristics.filter(char => char !== charName));
    } else {
      setNewCharacteristics([...newCharacteristics, charName]);
    }
  };

  const getAvailableCharacteristics = () => {
    return Object.keys(appData?.characteristics || {}).filter(
      charName => !newCharacteristics.includes(charName)
    );
  };

  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) {
      Alert.alert('Error', 'Skill name is required');
      return;
    }

    if (newCharacteristics.length === 0) {
      Alert.alert('Error', 'At least one characteristic is required');
      return;
    }

    if (appData?.skills[newSkillName.trim()]) {
      Alert.alert('Error', 'Skill already exists');
      return;
    }

    try {
      await gameEngine.createSkill(newSkillName.trim(), newSkillType, newCharacteristics);
      setShowAddModal(false);
      setNewSkillName('');
      setNewCharacteristics([]);
      setCharacteristicInput('');
      await loadData();
      Alert.alert('Success', 'Skill created successfully!');
    } catch (error) {
      console.error('Error creating skill:', error);
      Alert.alert('Error', 'Failed to create skill');
    }
  };

  const resetModal = () => {
    setNewSkillName('');
    setNewCharacteristics([]);
    setCharacteristicInput('');
    setNewSkillType('increasing');
    setShowExistingChars(false);
    setShowAddModal(false);
  };

  // Edit functions
  const handleEditSkill = (skillName: string) => {
    const skill = appData?.skills[skillName];
    if (skill) {
      setEditingSkillName(skillName);
      setEditSkillName(skillName);
      setEditSkillType(skill.type);
      setEditCharacteristics([...skill.characteristics]);
      setShowEditSkillModal(true);
    }
  };

  const handleDeleteSkill = (skillName: string) => {
    Alert.alert(
      'Delete Skill',
      `Are you sure you want to delete "${skillName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await gameEngine.deleteSkill(skillName);
              await loadData();
              Alert.alert('Success', 'Skill deleted successfully!');
            } catch (error) {
              console.error('Error deleting skill:', error);
              Alert.alert('Error', 'Failed to delete skill');
            }
          },
        },
      ]
    );
  };

  const handleUpdateSkill = async () => {
    if (!editSkillName.trim()) {
      Alert.alert('Error', 'Skill name is required');
      return;
    }

    if (editCharacteristics.length === 0) {
      Alert.alert('Error', 'At least one characteristic is required');
      return;
    }

    try {
      // If name changed, we need to create new and delete old
      if (editSkillName.trim() !== editingSkillName) {
        if (appData?.skills[editSkillName.trim()]) {
          Alert.alert('Error', 'Skill with this name already exists');
          return;
        }
        await gameEngine.deleteSkill(editingSkillName);
        await gameEngine.createSkill(editSkillName.trim(), editSkillType, editCharacteristics);
      } else {
        await gameEngine.updateSkill(editingSkillName, editSkillType, editCharacteristics);
      }
      
      resetEditSkillModal();
      await loadData();
      Alert.alert('Success', 'Skill updated successfully!');
    } catch (error) {
      console.error('Error updating skill:', error);
      Alert.alert('Error', 'Failed to update skill');
    }
  };

  const resetEditSkillModal = () => {
    setEditingSkillName('');
    setEditSkillName('');
    setEditCharacteristics([]);
    setEditCharInput('');
    setEditSkillType('increasing');
    setShowEditSkillModal(false);
  };

  const addEditCharacteristic = () => {
    if (editCharInput.trim() && !editCharacteristics.includes(editCharInput.trim())) {
      setEditCharacteristics([...editCharacteristics, editCharInput.trim()]);
      setEditCharInput('');
    }
  };

  const removeEditCharacteristic = (charToRemove: string) => {
    setEditCharacteristics(editCharacteristics.filter(char => char !== charToRemove));
  };

  // Characteristic functions
  const handleEditCharacteristic = (charName: string) => {
    setEditingCharName(charName);
    setNewCharName(charName);
    setShowEditCharModal(true);
  };

  const handleDeleteCharacteristic = (charName: string) => {
    Alert.alert(
      'Delete Characteristic',
      `Are you sure you want to delete "${charName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await gameEngine.deleteCharacteristic(charName);
              await loadData();
              Alert.alert('Success', 'Characteristic deleted successfully!');
            } catch (error) {
              console.error('Error deleting characteristic:', error);
              Alert.alert('Error', 'Failed to delete characteristic');
            }
          },
        },
      ]
    );
  };

  const handleUpdateCharacteristic = async () => {
    if (!newCharName.trim()) {
      Alert.alert('Error', 'Characteristic name is required');
      return;
    }

    try {
      if (newCharName.trim() !== editingCharName) {
        if (appData?.characteristics[newCharName.trim()]) {
          Alert.alert('Error', 'Characteristic with this name already exists');
          return;
        }
        // Rename characteristic
        const oldChar = appData?.characteristics[editingCharName];
        if (oldChar) {
          await gameEngine.deleteCharacteristic(editingCharName);
          await gameEngine.createStandaloneCharacteristic(newCharName.trim());
        }
      }
      
      resetEditCharModal();
      await loadData();
      Alert.alert('Success', 'Characteristic updated successfully!');
    } catch (error) {
      console.error('Error updating characteristic:', error);
      Alert.alert('Error', 'Failed to update characteristic');
    }
  };

  const resetEditCharModal = () => {
    setEditingCharName('');
    setNewCharName('');
    setShowEditCharModal(false);
  };

  const handleCreateStandaloneCharacteristic = async () => {
    if (!newCharName.trim()) {
      Alert.alert('Error', 'Characteristic name is required');
      return;
    }

    if (appData?.characteristics[newCharName.trim()]) {
      Alert.alert('Error', 'Characteristic already exists');
      return;
    }

    try {
      await gameEngine.createStandaloneCharacteristic(newCharName.trim());
      resetAddCharModal();
      await loadData();
      Alert.alert('Success', 'Characteristic created successfully!');
    } catch (error) {
      console.error('Error creating characteristic:', error);
      Alert.alert('Error', 'Failed to create characteristic');
    }
  };

  const resetAddCharModal = () => {
    setNewCharName('');
    setShowAddCharModal(false);
  };

  const renderSkills = () => {
    if (!appData?.skills || Object.keys(appData.skills).length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No skills yet</Text>
          <Text style={styles.emptySubtext}>Complete quests to develop skills!</Text>
        </View>
      );
    }

    return Object.entries(appData.skills).map(([skillName, skill]) => (
      <View key={skillName} style={styles.skillContainer}>
        <SkillBar
          skillName={skillName}
          skill={skill}
        />
        <View style={styles.skillActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditSkill(skillName)}
          >
            <Ionicons name="pencil" size={16} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteSkill(skillName)}
          >
            <Ionicons name="trash" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    ));
  };

  const renderCharacteristics = () => {
    if (!appData?.characteristics || Object.keys(appData.characteristics).length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No characteristics yet</Text>
          <Text style={styles.emptySubtext}>Create skills to develop characteristics!</Text>
        </View>
      );
    }

    return Object.entries(appData.characteristics).map(([charName, characteristic]) => (
      <View key={charName} style={styles.characteristicCard}>
        <View style={styles.characteristicHeader}>
          <Text style={styles.characteristicName}>{charName}</Text>
          <View style={styles.characteristicHeaderRight}>
            <Text style={styles.characteristicLevel}>LV {characteristic.level}</Text>
            <View style={styles.charActions}>
              <TouchableOpacity
                style={styles.editCharButton}
                onPress={() => handleEditCharacteristic(charName)}
              >
                <Ionicons name="pencil" size={14} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteCharButton}
                onPress={() => handleDeleteCharacteristic(charName)}
              >
                <Ionicons name="trash" size={14} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${Math.min(100, (characteristic.xp / (characteristic.level * 100)) * 100)}%`,
                  backgroundColor: Colors.secondary
                }
              ]} 
            />
          </View>
          <Text style={styles.xpText}>
            {characteristic.xp}/{characteristic.level * 100} XP
          </Text>
        </View>

        {characteristic.associatedSkills && characteristic.associatedSkills.length > 0 && (
          <View style={styles.associatedSkillsContainer}>
            <Text style={styles.associatedSkillsLabel}>Associated Skills:</Text>
            <View style={styles.skillsList}>
              {characteristic.associatedSkills.map((skillName, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skillName}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Skills & Stats</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Skill</Text>
          </TouchableOpacity>
          {activeTab === 'characteristics' && (
            <TouchableOpacity 
              style={[styles.addButton, styles.addCharacteristicButton]}
              onPress={() => setShowAddCharModal(true)}
            >
              <Text style={styles.addButtonText}>+ Char</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'skills' && styles.activeTab]}
          onPress={() => setActiveTab('skills')}
        >
          <Text style={[styles.tabText, activeTab === 'skills' && styles.activeTabText]}>
            Skills
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'characteristics' && styles.activeTab]}
          onPress={() => setActiveTab('characteristics')}
        >
          <Text style={[styles.tabText, activeTab === 'characteristics' && styles.activeTabText]}>
            Characteristics
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'skills' ? renderSkills() : renderCharacteristics()}
      </ScrollView>

      {/* Add Skill Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={resetModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Skill</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Skill Name"
              placeholderTextColor={Colors.textSecondary}
              value={newSkillName}
              onChangeText={setNewSkillName}
            />

            <View style={styles.typeSelector}>
              <Text style={styles.sectionLabel}>Skill Type:</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newSkillType === 'increasing' && styles.typeButtonActive
                  ]}
                  onPress={() => setNewSkillType('increasing')}
                >
                  <Text style={styles.typeButtonText}>Increasing ↗️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newSkillType === 'decreasing' && styles.typeButtonActive
                  ]}
                  onPress={() => setNewSkillType('decreasing')}
                >
                  <Text style={styles.typeButtonText}>Decreasing ↘️</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.characteristicsSection}>
              <View style={styles.characteristicHeader}>
                <Text style={styles.sectionLabel}>Characteristics (Required):</Text>
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setShowExistingChars(!showExistingChars)}
                >
                  <Text style={styles.toggleButtonText}>
                    {showExistingChars ? 'Create New' : 'Use Existing'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {!showExistingChars ? (
                <View>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.input, styles.characteristicInput]}
                      placeholder="Add characteristic"
                      placeholderTextColor={Colors.textSecondary}
                      value={characteristicInput}
                      onChangeText={setCharacteristicInput}
                      onSubmitEditing={addCharacteristic}
                    />
                    <TouchableOpacity style={styles.addCharButton} onPress={addCharacteristic}>
                      <Text style={styles.addCharButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.existingCharacteristics}>
                  {getAvailableCharacteristics().length > 0 ? (
                    <View style={styles.existingCharGrid}>
                      {getAvailableCharacteristics().map((charName) => (
                        <TouchableOpacity
                          key={charName}
                          style={[
                            styles.existingCharCard,
                            newCharacteristics.includes(charName) && styles.existingCharCardSelected
                          ]}
                          onPress={() => toggleExistingCharacteristic(charName)}
                        >
                          <Text style={[
                            styles.existingCharCardText,
                            newCharacteristics.includes(charName) && styles.existingCharCardTextSelected
                          ]}>
                            {charName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noExistingCharsText}>
                      No available existing characteristics. Create new ones or switch to "Create New" mode.
                    </Text>
                  )}
                </View>
              )}

              {newCharacteristics.map((char, index) => (
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

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateSkill}>
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Skill Modal */}
      <Modal
        visible={showEditSkillModal}
        transparent
        animationType="slide"
        onRequestClose={resetEditSkillModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Skill</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Skill Name"
              placeholderTextColor={Colors.textSecondary}
              value={editSkillName}
              onChangeText={setEditSkillName}
            />

            <View style={styles.typeSelector}>
              <Text style={styles.sectionLabel}>Skill Type:</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    editSkillType === 'increasing' && styles.typeButtonActive
                  ]}
                  onPress={() => setEditSkillType('increasing')}
                >
                  <Text style={styles.typeButtonText}>Increasing ↗️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    editSkillType === 'decreasing' && styles.typeButtonActive
                  ]}
                  onPress={() => setEditSkillType('decreasing')}
                >
                  <Text style={styles.typeButtonText}>Decreasing ↘️</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.characteristicsSection}>
              <Text style={styles.sectionLabel}>Characteristics (Required):</Text>
              
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.characteristicInput]}
                  placeholder="Add characteristic"
                  placeholderTextColor={Colors.textSecondary}
                  value={editCharInput}
                  onChangeText={setEditCharInput}
                  onSubmitEditing={addEditCharacteristic}
                />
                <TouchableOpacity style={styles.addCharButton} onPress={addEditCharacteristic}>
                  <Text style={styles.addCharButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              {editCharacteristics.map((char, index) => (
                <View key={index} style={styles.characteristicItem}>
                  <Text style={styles.characteristicText}>{char}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeEditCharacteristic(char)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetEditSkillModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={handleUpdateSkill}>
                <Text style={styles.createButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Characteristic Modal */}
      <Modal
        visible={showEditCharModal}
        transparent
        animationType="slide"
        onRequestClose={resetEditCharModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Characteristic</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Characteristic Name"
              placeholderTextColor={Colors.textSecondary}
              value={newCharName}
              onChangeText={setNewCharName}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetEditCharModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={handleUpdateCharacteristic}>
                <Text style={styles.createButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Standalone Characteristic Modal */}
      <Modal
        visible={showAddCharModal}
        transparent
        animationType="slide"
        onRequestClose={resetAddCharModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Characteristic</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Characteristic Name"
              placeholderTextColor={Colors.textSecondary}
              value={newCharName}
              onChangeText={setNewCharName}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetAddCharModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateStandaloneCharacteristic}>
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addButtonText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  characteristicCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  characteristicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  characteristicName: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  characteristicLevel: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.secondary,
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  progressContainer: {
    marginBottom: Spacing.sm,
  },
  progressBackground: {
    height: 8,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  associatedSkillsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  associatedSkillsLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    backgroundColor: Colors.primary + '30',
    borderRadius: 6,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  skillText: {
    fontSize: FontSizes.xs,
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
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  typeSelector: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    flex: 1,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  characteristicsSection: {
    marginBottom: Spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  characteristicInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: Spacing.sm,
  },
  addCharButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCharButtonText: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  characteristicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  characteristicText: {
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 8,
    padding: Spacing.md,
    flex: 1,
    marginRight: Spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
    flex: 1,
    marginLeft: Spacing.sm,
    alignItems: 'center',
  },
  createButtonText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  // New styles for edit functionality
  skillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  skillActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  editButton: {
    backgroundColor: Colors.surface,
    borderRadius: 6,
    padding: Spacing.xs,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.surface,
    borderRadius: 6,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  characteristicHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  charActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  editCharButton: {
    backgroundColor: Colors.surface,
    borderRadius: 4,
    padding: Spacing.xs,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  deleteCharButton: {
    backgroundColor: Colors.surface,
    borderRadius: 4,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addCharacteristicButton: {
    marginLeft: Spacing.sm,
    backgroundColor: Colors.secondary,
  },
  // New styles for toggle and existing characteristics
  characteristicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  toggleButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  toggleButtonText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  existingCharacteristics: {
    marginBottom: Spacing.sm,
  },
  existingCharGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  existingCharCard: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  existingCharCardSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  existingCharCardText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  existingCharCardTextSelected: {
    color: Colors.text,
    fontWeight: 'bold',
  },
  noExistingCharsText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: Spacing.md,
  },
});

export default SkillsScreen;