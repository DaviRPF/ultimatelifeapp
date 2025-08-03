import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import StorageService from '../../services/StorageService';
import { BodyMeasurements, BodyMeasurementEntry } from '../../types';

const BodyMeasurementsScreen = () => {
  const navigation = useNavigation();
  const [measurements, setMeasurements] = useState<BodyMeasurements>({});
  const [measurementEntries, setMeasurementEntries] = useState<BodyMeasurementEntry[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BodyMeasurementEntry | null>(null);

  const storageService = StorageService.getInstance();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await storageService.initializeAppData();
      
      const hero = storageService.getHero();
      const entries = storageService.getBodyMeasurementEntries();
      
      setMeasurements(hero?.bodyMeasurements || {});
      setMeasurementEntries(entries);
    } catch (error) {
      console.error('Error loading body measurements:', error);
      Alert.alert('Error', 'Failed to load measurements');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const resetForm = () => {
    setMeasurements({});
    setNotes('');
    setEditingEntry(null);
  };

  const handleSaveMeasurements = async () => {
    try {
      // Check if at least one measurement is provided
      const hasAnyMeasurement = Object.values(measurements).some(value => value && value > 0);
      if (!hasAnyMeasurement) {
        Alert.alert('Error', 'Please enter at least one measurement');
        return;
      }

      if (editingEntry) {
        await storageService.updateBodyMeasurementEntry(editingEntry.id, measurements, notes);
      } else {
        await storageService.addBodyMeasurementEntry(measurements, notes);
      }

      setShowAddModal(false);
      resetForm();
      await loadData();
      
      Alert.alert('Success', editingEntry ? 'Measurements updated!' : 'Measurements saved!');
    } catch (error) {
      console.error('Error saving measurements:', error);
      Alert.alert('Error', 'Failed to save measurements');
    }
  };

  const handleEditEntry = (entry: BodyMeasurementEntry) => {
    setEditingEntry(entry);
    setMeasurements(entry.measurements);
    setNotes(entry.notes || '');
    setShowAddModal(true);
  };

  const handleDeleteEntry = (entry: BodyMeasurementEntry) => {
    Alert.alert(
      'Delete Measurements',
      'Are you sure you want to delete this measurement entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteBodyMeasurementEntry(entry.id);
              await loadData();
              Alert.alert('Success', 'Measurements deleted');
            } catch (error) {
              console.error('Error deleting measurements:', error);
              Alert.alert('Error', 'Failed to delete measurements');
            }
          }
        }
      ]
    );
  };

  const updateMeasurement = (key: keyof BodyMeasurements, value: string) => {
    const numValue = parseFloat(value) || undefined;
    setMeasurements(prev => ({
      ...prev,
      [key]: numValue
    }));
  };

  const renderMeasurementInput = (
    key: keyof BodyMeasurements,
    label: string,
    description: string,
    icon: string
  ) => (
    <View style={styles.inputRow}>
      <View style={styles.inputHeader}>
        <View style={styles.inputTitleRow}>
          <Ionicons name={icon as any} size={20} color={Colors.primary} />
          <Text style={styles.inputLabel}>{label}</Text>
        </View>
        <Text style={styles.inputDescription}>{description}</Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={measurements[key]?.toString() || ''}
          onChangeText={(value) => updateMeasurement(key, value)}
          placeholder="0.0"
          keyboardType="decimal-pad"
          placeholderTextColor={Colors.textSecondary}
        />
        <Text style={styles.unit}>cm</Text>
      </View>
    </View>
  );

  const renderMeasurementEntry = (entry: BodyMeasurementEntry, index: number) => {
    const date = new Date(entry.date);
    const measurementCount = Object.values(entry.measurements).filter(v => v && v > 0).length;
    
    return (
      <View key={entry.id} style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.entryInfo}>
            <Text style={styles.entryDate}>{date.toLocaleDateString()}</Text>
            <Text style={styles.entrySubtitle}>{measurementCount} measurements</Text>
          </View>
          <View style={styles.entryActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditEntry(entry)}
            >
              <Ionicons name="pencil" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteEntry(entry)}
            >
              <Ionicons name="trash" size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        {entry.notes && (
          <Text style={styles.entryNotes}>{entry.notes}</Text>
        )}
        
        <View style={styles.measurementSummary}>
          {Object.entries(entry.measurements).map(([key, value]) => {
            if (!value || value <= 0) return null;
            
            const labels: Record<string, string> = {
              bracoRelaxado: 'Braço Relaxado',
              bracoContraido: 'Braço Contraído',
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
                <Text style={styles.measurementName}>{labels[key] || key}</Text>
                <Text style={styles.measurementValue}>{value} cm</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <KeyboardAvoidingView 
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setShowAddModal(false);
              resetForm();
            }}
          >
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingEntry ? 'Edit Measurements' : 'Add Measurements'}
          </Text>
          <TouchableOpacity
            style={styles.modalSaveButton}
            onPress={handleSaveMeasurements}
          >
            <Text style={styles.modalSaveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💪 Membros Superiores</Text>
            {renderMeasurementInput('bracoRelaxado', 'Braço Relaxado', 'Maior circunferência do braço, membro solto', 'fitness')}
            {renderMeasurementInput('bracoContraido', 'Braço Contraído', 'Maior circunferência do braço, flexionando bíceps', 'barbell')}
            {renderMeasurementInput('antebraco', 'Antebraço', 'Maior circunferência, próximo ao cotovelo', 'arm')}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏥 Tronco</Text>
            {renderMeasurementInput('peitoral', 'Peitoral', 'Linha dos mamilos, no final da expiração', 'body')}
            {renderMeasurementInput('abdomen', 'Abdômen', 'Cintura, menor circunferência (altura do umbigo)', 'ellipse')}
            {renderMeasurementInput('gluteo', 'Glúteo', 'Quadril, maior circunferência dos glúteos', 'ellipse-outline')}
            {renderMeasurementInput('deltoides', 'Deltoides', 'Ombros, ao redor da maior circunferência', 'body')}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🦵 Membros Inferiores</Text>
            {renderMeasurementInput('perna', 'Perna (Coxa)', 'Coxa, maior circunferência (terço superior)', 'walk')}
            {renderMeasurementInput('panturrilha', 'Panturrilha', 'Maior circunferência da "batata da perna"', 'walk')}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Notes</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this measurement (optional)"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading measurements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Body Measurements</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {measurementEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="fitness" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No measurements yet</Text>
            <Text style={styles.emptySubtitle}>
              Track your body measurements to monitor your fitness progress
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle" size={20} color={Colors.background} />
              <Text style={styles.emptyButtonText}>Add First Measurement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.historyTitle}>Measurement History</Text>
            {measurementEntries
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(renderMeasurementEntry)}
          </>
        )}
      </ScrollView>

      {renderAddModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 25,
    gap: Spacing.sm,
  },
  emptyButtonText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.background,
  },
  historyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  entryInfo: {
    flex: 1,
  },
  entryDate: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  entrySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  entryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  entryNotes: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  measurementSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  measurementItem: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  measurementName: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  measurementValue: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalSaveButton: {
    padding: Spacing.xs,
  },
  modalSaveText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  inputRow: {
    marginBottom: Spacing.lg,
  },
  inputHeader: {
    marginBottom: Spacing.sm,
  },
  inputTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  inputDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  unit: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    paddingRight: Spacing.md,
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    height: 80,
  },
});

export default BodyMeasurementsScreen;