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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import StorageService from '../../services/StorageService';
import WeightChart from '../../components/WeightChart';
import FitnessBackupService from '../../services/FitnessBackupService';
import { WeightEntry, Hero, Workout } from '../../types';

const FitnessScreen = () => {
  const navigation = useNavigation();
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [hero, setHero] = useState<Hero | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  
  // Form states
  const [weightInput, setWeightInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const storageService = StorageService.getInstance();
  const backupService = FitnessBackupService.getInstance();

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
      const workouts = storageService.getRecentWorkouts(5) || [];
      setRecentWorkouts(workouts);
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

  // Backup functions
  const handleExportBackup = async () => {
    try {
      setIsLoading(true);
      await backupService.exportBackup();
      Alert.alert(
        'Backup Exported! 📦',
        'Your fitness data has been exported successfully. You can share or save this file to restore your data later.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export backup. Please try again.');
    } finally {
      setIsLoading(false);
      setShowBackupModal(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      const filePath = await backupService.selectBackupFile();
      if (!filePath) return;

      const stats = await backupService.getBackupStats(filePath);
      
      Alert.alert(
        'Import Fitness Backup',
        `This backup contains:
• ${stats.weightEntries} weight entries
• ${stats.bodyMeasurementEntries} body measurements
• ${stats.workouts} workouts
• Exported: ${new Date(stats.exportDate).toLocaleDateString()}

How would you like to import this data?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Merge with existing',
            onPress: () => performRestore(filePath, false),
          },
          {
            text: 'Replace all data',
            style: 'destructive',
            onPress: () => confirmReplaceAll(filePath),
          },
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import backup. Please check if the file is valid.');
    }
  };

  const confirmReplaceAll = (filePath: string) => {
    Alert.alert(
      'Replace All Data?',
      'This will permanently delete all your current fitness data and replace it with the backup data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace All',
          style: 'destructive',
          onPress: () => performRestore(filePath, true),
        },
      ]
    );
  };

  const performRestore = async (filePath: string, replaceExisting: boolean) => {
    try {
      setIsLoading(true);
      await backupService.restoreFromBackup(filePath, replaceExisting);
      await loadData();
      
      Alert.alert(
        'Backup Restored! ✅',
        replaceExisting 
          ? 'All fitness data has been replaced with the backup data.'
          : 'Backup data has been merged with your existing data.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore backup. Please try again.');
    } finally {
      setIsLoading(false);
      setShowBackupModal(false);
    }
  };

  // Delete All Functions
  const requiredConfirmationText = "Eu quero apagar todos os meus dados de fitness permanentemente";

  const handleDeleteAllData = async () => {
    if (confirmationText.trim() !== requiredConfirmationText) {
      Alert.alert(
        'Texto de confirmação incorreto',
        'Digite exatamente a frase solicitada para confirmar a exclusão de todos os dados.'
      );
      return;
    }

    try {
      setIsLoading(true);
      await backupService.clearAllFitnessData();
      await loadData();
      setShowDeleteAllModal(false);
      setConfirmationText('');
      
      Alert.alert(
        'Dados Apagados! 🗑️',
        'Todos os seus dados de fitness foram apagados permanentemente.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error deleting all data:', error);
      Alert.alert('Erro', 'Falha ao apagar todos os dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetDeleteAllModal = () => {
    setConfirmationText('');
    setShowDeleteAllModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fitness Tracker</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.backupButton}
            onPress={() => setShowBackupModal(true)}
          >
            <Ionicons name="cloud" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
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

      {/* Body Measurements Card */}
      <TouchableOpacity 
        style={styles.measurementsCard}
        onPress={() => navigation.navigate('BodyMeasurements' as never)}
        activeOpacity={0.7}
      >
        <Text style={styles.cardTitle}>Body Measurements 📏</Text>
        <View style={styles.measurementsDisplay}>
          {hero?.bodyMeasurements ? (
            <View style={styles.measurementSummary}>
              {Object.entries(hero.bodyMeasurements)
                .filter(([_, value]) => value && value > 0)
                .slice(0, 3) // Show only first 3 measurements
                .map(([key, value]) => {
                  const labels: Record<string, string> = {
                    bracoRelaxado: 'Braço',
                    bracoContraido: 'Braço C.',
                    antebraco: 'Antebraço',
                    peitoral: 'Peitoral',
                    abdomen: 'Abdômen',
                    gluteo: 'Glúteo',
                    deltoides: 'Deltoides',
                    perna: 'Perna',
                    panturrilha: 'Panturrilha'
                  };
                  
                  return (
                    <View key={key} style={styles.measurementItem}>
                      <Text style={styles.measurementLabel}>{labels[key] || key}</Text>
                      <Text style={styles.measurementValue}>{value} cm</Text>
                    </View>
                  );
                })}
              {Object.keys(hero.bodyMeasurements).length > 3 && (
                <Text style={styles.moreText}>+{Object.keys(hero.bodyMeasurements).length - 3} more</Text>
              )}
            </View>
          ) : (
            <View style={styles.noMeasurementsContainer}>
              <Text style={styles.noMeasurementsText}>No measurements recorded</Text>
              <Text style={styles.tapToAddText}>Tap to add measurements</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Workouts Card */}
      <TouchableOpacity 
        style={styles.workoutsCard}
        onPress={() => navigation.navigate('WorkoutHistory' as never)}
        activeOpacity={0.7}
      >
        <View style={styles.workoutsHeader}>
          <Text style={styles.cardTitle}>Strength Training 💪</Text>
          <TouchableOpacity
            style={styles.addWorkoutButton}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('CreateWorkout' as never);
            }}
          >
            <Ionicons name="add-circle" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.workoutsDisplay}>
          {recentWorkouts.length > 0 ? (
            <View style={styles.workoutsSummary}>
              <View style={styles.workoutsStats}>
                <View style={styles.workoutStatItem}>
                  <Text style={styles.workoutStatValue}>{recentWorkouts.length}</Text>
                  <Text style={styles.workoutStatLabel}>Recent</Text>
                </View>
                <View style={styles.workoutStatItem}>
                  <Text style={styles.workoutStatValue}>
                    {recentWorkouts.reduce((acc, w) => acc + (w.exercises?.length || 0), 0)}
                  </Text>
                  <Text style={styles.workoutStatLabel}>Exercises</Text>
                </View>
                <View style={styles.workoutStatItem}>
                  <Text style={styles.workoutStatValue}>
                    {recentWorkouts.length > 0 
                      ? Math.round(recentWorkouts.reduce((acc, w) => acc + (w.totalDuration || 0), 0) / recentWorkouts.length)
                      : 0}m
                  </Text>
                  <Text style={styles.workoutStatLabel}>Avg Time</Text>
                </View>
              </View>
              <View style={styles.recentWorkoutsList}>
                {recentWorkouts.slice(0, 2).map((workout) => (
                  <View key={workout.id} style={styles.recentWorkoutItem}>
                    <Text style={styles.recentWorkoutName}>{workout.name}</Text>
                    <Text style={styles.recentWorkoutDate}>
                      {new Date(workout.date).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
                {recentWorkouts.length > 2 && (
                  <Text style={styles.moreWorkoutsText}>+{recentWorkouts.length - 2} more workouts</Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.noWorkoutsContainer}>
              <Text style={styles.noWorkoutsText}>No workouts recorded</Text>
              <Text style={styles.tapToAddWorkoutText}>Tap to create your first workout</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

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

      {/* Backup Modal */}
      <Modal
        visible={showBackupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBackupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Fitness Backup & Restore</Text>
            
            <View style={styles.backupSection}>
              <Text style={styles.backupSectionTitle}>📦 Export Backup</Text>
              <Text style={styles.backupDescription}>
                Create a backup file with all your fitness data including weights, measurements, and workouts.
              </Text>
              <TouchableOpacity
                style={[styles.backupActionButton, styles.exportButton]}
                onPress={handleExportBackup}
                disabled={isLoading}
              >
                <Ionicons name="download" size={20} color={Colors.background} />
                <Text style={styles.backupActionButtonText}>
                  {isLoading ? 'Exporting...' : 'Export Backup'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.backupSection}>
              <Text style={styles.backupSectionTitle}>📁 Import Backup</Text>
              <Text style={styles.backupDescription}>
                Restore your fitness data from a previously exported backup file.
              </Text>
              <TouchableOpacity
                style={[styles.backupActionButton, styles.importButton]}
                onPress={handleImportBackup}
                disabled={isLoading}
              >
                <Ionicons name="cloud-upload" size={20} color={Colors.background} />
                <Text style={styles.backupActionButtonText}>
                  {isLoading ? 'Importing...' : 'Import Backup'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.backupSection}>
              <Text style={styles.backupSectionTitle}>🗑️ Apagar Todos os Dados</Text>
              <Text style={styles.backupDescription}>
                ATENÇÃO: Esta ação apagará permanentemente todos os seus dados de fitness, incluindo pesos, medidas e treinos.
              </Text>
              <TouchableOpacity
                style={[styles.backupActionButton, styles.deleteAllButton]}
                onPress={() => {
                  setShowBackupModal(false);
                  setShowDeleteAllModal(true);
                }}
                disabled={isLoading}
              >
                <Ionicons name="trash" size={20} color={Colors.background} />
                <Text style={styles.backupActionButtonText}>
                  Apagar Tudo
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowBackupModal(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      {/* Delete All Confirmation Modal */}
      <Modal
        visible={showDeleteAllModal}
        transparent
        animationType="slide"
        onRequestClose={resetDeleteAllModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Apagar Todos os Dados</Text>
            
            <View style={styles.warningSection}>
              <Text style={styles.warningTitle}>ATENÇÃO: Esta ação é irreversível!</Text>
              <Text style={styles.warningText}>
                Todos os seus dados de fitness serão apagados permanentemente, incluindo:
              </Text>
              <Text style={styles.warningList}>
                • Histórico de peso{'\n'}
                • Medidas corporais{'\n'}
                • Treinos e exercícios{'\n'}
                • Todas as estatísticas
              </Text>
              <Text style={styles.warningText}>
                Para confirmar, digite exatamente a frase abaixo:
              </Text>
              <Text style={styles.confirmationPhrase}>
                "{requiredConfirmationText}"
              </Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Digite a frase de confirmação:</Text>
              <TextInput
                style={[styles.input, styles.confirmationInput]}
                placeholder="Digite a frase exata..."
                placeholderTextColor={Colors.textSecondary}
                value={confirmationText}
                onChangeText={setConfirmationText}
                multiline
                numberOfLines={3}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={resetDeleteAllModal}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteAllConfirmButton, 
                  (confirmationText.trim() !== requiredConfirmationText || isLoading) && styles.deleteAllConfirmButtonDisabled
                ]}
                onPress={handleDeleteAllData}
                disabled={confirmationText.trim() !== requiredConfirmationText || isLoading}
              >
                <Text style={styles.deleteAllConfirmButtonText}>
                  {isLoading ? 'Apagando...' : 'Apagar Tudo'}
                </Text>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backupButton: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
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
  measurementsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  measurementsDisplay: {
    minHeight: 60,
  },
  measurementSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  measurementItem: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  measurementLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  measurementValue: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  moreText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  noMeasurementsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  noMeasurementsText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  tapToAddText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  workoutsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workoutsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addWorkoutButton: {
    padding: Spacing.xs,
  },
  workoutsDisplay: {
    minHeight: 80,
  },
  workoutsSummary: {
    gap: Spacing.md,
  },
  workoutsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
  },
  workoutStatItem: {
    alignItems: 'center',
  },
  workoutStatValue: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  workoutStatLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  recentWorkoutsList: {
    gap: Spacing.sm,
  },
  recentWorkoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentWorkoutName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  recentWorkoutDate: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  moreWorkoutsText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  noWorkoutsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  noWorkoutsText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  tapToAddWorkoutText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '500',
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
  // Backup Modal Styles
  backupSection: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backupSectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  backupDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  backupActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  exportButton: {
    backgroundColor: Colors.success,
  },
  importButton: {
    backgroundColor: Colors.primary,
  },
  deleteAllButton: {
    backgroundColor: Colors.danger,
  },
  backupActionButtonText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
  // Delete All Modal Styles
  warningSection: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  warningTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.danger,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  warningText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  warningList: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.md,
    lineHeight: 20,
  },
  confirmationPhrase: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.danger,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: 6,
    marginTop: Spacing.sm,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  confirmationInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  deleteAllConfirmButton: {
    backgroundColor: Colors.danger,
    borderRadius: 8,
    padding: Spacing.md,
    flex: 1,
    marginLeft: Spacing.sm,
    alignItems: 'center',
  },
  deleteAllConfirmButtonDisabled: {
    backgroundColor: Colors.surfaceDark,
    opacity: 0.5,
  },
  deleteAllConfirmButtonText: {
    color: Colors.background,
    fontSize: FontSizes.md,
    fontWeight: 'bold',
  },
});

export default FitnessScreen;