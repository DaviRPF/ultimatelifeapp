import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import StorageService from '../../services/StorageService';
import WeightChart from '../../components/WeightChart';
import { WeightEntry, Hero } from '../../types';

const FitnessScreen = () => {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [hero, setHero] = useState<Hero | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  
  // Form states
  const [weightInput, setWeightInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const storageService = StorageService.getInstance();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      await storageService.initializeAppData();
      const appData = await storageService.getAppData();
      setHero(appData.hero);
      setWeightEntries(storageService.getWeightEntries().sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error('Error loading fitness data:', error);
      Alert.alert('Error', 'Failed to load fitness data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddWeight = async () => {
    const weight = parseFloat(weightInput);
    if (!weightInput.trim() || isNaN(weight) || weight <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    if (weight > 1000) {
      Alert.alert('Error', 'Weight seems too high. Please check your input.');
      return;
    }

    setIsLoading(true);
    try {
      await storageService.addWeightEntry(weight, notesInput);
      await loadData();
      resetModal();
      Alert.alert('Success', 'Weight recorded successfully!');
    } catch (error) {
      console.error('Error adding weight:', error);
      Alert.alert('Error', 'Failed to record weight');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditWeight = async () => {
    if (!editingEntry) return;

    const weight = parseFloat(weightInput);
    if (!weightInput.trim() || isNaN(weight) || weight <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }

    setIsLoading(true);
    try {
      await storageService.updateWeightEntry(editingEntry.id, weight, notesInput);
      await loadData();
      resetEditModal();
      Alert.alert('Success', 'Weight updated successfully!');
    } catch (error) {
      console.error('Error updating weight:', error);
      Alert.alert('Error', 'Failed to update weight');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWeight = (entry: WeightEntry) => {
    Alert.alert(
      'Delete Weight Entry',
      'Are you sure you want to delete this weight entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteWeightEntry(entry.id);
              await loadData();
              Alert.alert('Success', 'Weight entry deleted');
            } catch (error) {
              console.error('Error deleting weight:', error);
              Alert.alert('Error', 'Failed to delete weight entry');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (entry: WeightEntry) => {
    setEditingEntry(entry);
    setWeightInput(entry.weight.toString());
    setNotesInput(entry.notes || '');
    setShowEditModal(true);
  };

  const resetModal = () => {
    setWeightInput('');
    setNotesInput('');
    setShowAddModal(false);
  };

  const resetEditModal = () => {
    setEditingEntry(null);
    setWeightInput('');
    setNotesInput('');
    setShowEditModal(false);
  };

  const getWeightTrend = () => {
    if (weightEntries.length < 2) return null;
    
    const latest = weightEntries[0].weight;
    const previous = weightEntries[1].weight;
    const diff = latest - previous;
    
    if (diff > 0) {
      return { direction: 'up', value: diff, color: Colors.warning };
    } else if (diff < 0) {
      return { direction: 'down', value: Math.abs(diff), color: Colors.success };
    } else {
      return { direction: 'same', value: 0, color: Colors.textSecondary };
    }
  };

  const weightTrend = getWeightTrend();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fitness Tracker</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Current Weight Card */}
      {hero?.weight && (
        <TouchableOpacity 
          style={styles.currentWeightCard}
          onPress={() => setShowChart(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitle}>Current Weight 📊 Tap to view chart</Text>
          <View style={styles.weightDisplay}>
            <Text style={styles.currentWeight}>{hero.weight.toFixed(1)} kg</Text>
            {weightTrend && (
              <View style={styles.trendContainer}>
                <Ionicons 
                  name={weightTrend.direction === 'up' ? 'trending-up' : weightTrend.direction === 'down' ? 'trending-down' : 'remove'} 
                  size={20} 
                  color={weightTrend.color} 
                />
                <Text style={[styles.trendText, { color: weightTrend.color }]}>
                  {weightTrend.direction === 'same' ? 'No change' : `${weightTrend.value.toFixed(1)} kg`}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Weight History */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {weightEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No weight entries yet</Text>
            <Text style={styles.emptySubtitle}>
              Start tracking your fitness journey by recording your weight!
            </Text>
            <TouchableOpacity
              style={styles.firstEntryButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.firstEntryButtonText}>Record First Weight</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Weight History</Text>
            {weightEntries.map((entry, index) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryWeight}>{entry.weight.toFixed(1)} kg</Text>
                    <Text style={styles.entryDate}>
                      {new Date(entry.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.entryActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditModal(entry)}
                    >
                      <Ionicons name="pencil" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteWeight(entry)}
                    >
                      <Ionicons name="trash" size={16} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                {entry.notes && (
                  <Text style={styles.entryNotes}>{entry.notes}</Text>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Add Weight Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={resetModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Weight</Text>
            
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Weight (kg) *</Text>
              <TextInput
                style={styles.input}
                placeholder="75.5"
                placeholderTextColor={Colors.textSecondary}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="How are you feeling? Any notes about your progress..."
                placeholderTextColor={Colors.textSecondary}
                value={notesInput}
                onChangeText={setNotesInput}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={resetModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                onPress={handleAddWeight}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Recording...' : 'Record'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Weight Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={resetEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Weight</Text>
            
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Weight (kg) *</Text>
              <TextInput
                style={styles.input}
                placeholder="75.5"
                placeholderTextColor={Colors.textSecondary}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="How are you feeling? Any notes about your progress..."
                placeholderTextColor={Colors.textSecondary}
                value={notesInput}
                onChangeText={setNotesInput}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={resetEditModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                onPress={handleEditWeight}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Weight Chart Modal */}
      <Modal
        visible={showChart}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChart(false)}
      >
        <View style={styles.chartModalOverlay}>
          <View style={styles.chartModalContent}>
            <View style={styles.chartModalHeader}>
              <Text style={styles.chartModalTitle}>Weight Progress Chart</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowChart(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.chartScrollView}>
              <Text style={styles.debugText}>
                Debug: Weight entries count: {weightEntries.length}
              </Text>
              <WeightChart weightEntries={weightEntries} />
            </ScrollView>
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
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentWeightCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  weightDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentWeight: {
    fontSize: FontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryInfo: {
    flex: 1,
  },
  entryWeight: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  entryDate: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderColor: Colors.danger,
  },
  entryNotes: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  firstEntryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  firstEntryButtonText: {
    fontSize: FontSizes.md,
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
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
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
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
    flex: 1,
    marginLeft: Spacing.sm,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.surfaceDark,
  },
  saveButtonText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
  // Chart Modal Styles
  chartModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartModalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    width: '95%',
    height: '80%',
    overflow: 'hidden',
  },
  chartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chartModalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartScrollView: {
    flex: 1,
  },
  debugText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    margin: Spacing.sm,
    borderRadius: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default FitnessScreen;