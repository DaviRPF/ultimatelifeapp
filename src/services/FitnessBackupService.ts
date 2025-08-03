import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import StorageService from './StorageService';
import { WeightEntry, BodyMeasurementEntry, Workout, BodyMeasurements } from '../types';

export interface FitnessBackupData {
  version: string;
  exportDate: string;
  data: {
    weightEntries: WeightEntry[];
    bodyMeasurementEntries: BodyMeasurementEntry[];
    workouts: Workout[];
    heroFitnessData: {
      weight?: number;
      bodyMeasurements?: BodyMeasurements;
    };
  };
}

class FitnessBackupService {
  private static instance: FitnessBackupService;
  private storageService: StorageService;

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  public static getInstance(): FitnessBackupService {
    if (!FitnessBackupService.instance) {
      FitnessBackupService.instance = new FitnessBackupService();
    }
    return FitnessBackupService.instance;
  }

  /**
   * Coleta todos os dados relacionados ao fitness
   */
  private async collectFitnessData(): Promise<FitnessBackupData['data']> {
    await this.storageService.initializeAppData();
    const appData = await this.storageService.getAppData();

    return {
      weightEntries: this.storageService.getWeightEntries(),
      bodyMeasurementEntries: this.storageService.getBodyMeasurementEntries(),
      workouts: this.storageService.getWorkouts(),
      heroFitnessData: {
        weight: appData.hero.weight,
        bodyMeasurements: appData.hero.bodyMeasurements,
      },
    };
  }

  /**
   * Cria um backup completo dos dados fitness
   */
  async createBackup(): Promise<string> {
    try {
      const fitnessData = await this.collectFitnessData();
      
      const backupData: FitnessBackupData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: fitnessData,
      };

      const backupJson = JSON.stringify(backupData, null, 2);
      const fileName = `fitness_backup_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, backupJson);
      
      return filePath;
    } catch (error) {
      console.error('Error creating fitness backup:', error);
      throw new Error('Failed to create fitness backup');
    }
  }

  /**
   * Exporta o backup e permite compartilhamento
   */
  async exportBackup(): Promise<void> {
    try {
      const filePath = await this.createBackup();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export Fitness Backup',
        });
      } else {
        throw new Error('Sharing is not available on this platform');
      }
    } catch (error) {
      console.error('Error exporting fitness backup:', error);
      throw error;
    }
  }

  /**
   * Permite ao usuário selecionar um arquivo de backup
   */
  async selectBackupFile(): Promise<string | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('Error selecting backup file:', error);
      throw new Error('Failed to select backup file');
    }
  }

  /**
   * Valida se o arquivo é um backup fitness válido
   */
  private validateBackupData(data: any): data is FitnessBackupData {
    return (
      data &&
      typeof data === 'object' &&
      data.version &&
      data.exportDate &&
      data.data &&
      Array.isArray(data.data.weightEntries) &&
      Array.isArray(data.data.bodyMeasurementEntries) &&
      Array.isArray(data.data.workouts) &&
      typeof data.data.heroFitnessData === 'object'
    );
  }

  /**
   * Lê e valida um arquivo de backup
   */
  async readBackupFile(filePath: string): Promise<FitnessBackupData> {
    try {
      const fileContent = await FileSystem.readAsStringAsync(filePath);
      const backupData = JSON.parse(fileContent);

      if (!this.validateBackupData(backupData)) {
        throw new Error('Invalid backup file format');
      }

      return backupData;
    } catch (error) {
      console.error('Error reading backup file:', error);
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format in backup file');
      }
      throw new Error('Failed to read backup file');
    }
  }

  /**
   * Restaura os dados fitness a partir de um backup
   */
  async restoreFromBackup(filePath: string, replaceExisting: boolean = false): Promise<void> {
    try {
      const backupData = await this.readBackupFile(filePath);
      
      await this.storageService.initializeAppData();
      const appData = await this.storageService.getAppData();

      if (replaceExisting) {
        // Substitui todos os dados existentes
        appData.weightEntries = backupData.data.weightEntries;
        appData.bodyMeasurementEntries = backupData.data.bodyMeasurementEntries;
        appData.workouts = backupData.data.workouts;
        appData.hero.weight = backupData.data.heroFitnessData.weight;
        appData.hero.bodyMeasurements = backupData.data.heroFitnessData.bodyMeasurements;
      } else {
        // Mescla com os dados existentes
        
        // Weight entries - mescla evitando duplicatas por data
        const existingWeightDates = new Set(
          (appData.weightEntries || []).map(entry => entry.date)
        );
        const newWeightEntries = backupData.data.weightEntries.filter(
          entry => !existingWeightDates.has(entry.date)
        );
        appData.weightEntries = [...(appData.weightEntries || []), ...newWeightEntries];

        // Body measurement entries - mescla evitando duplicatas por data
        const existingMeasurementDates = new Set(
          (appData.bodyMeasurementEntries || []).map(entry => entry.date)
        );
        const newMeasurementEntries = backupData.data.bodyMeasurementEntries.filter(
          entry => !existingMeasurementDates.has(entry.date)
        );
        appData.bodyMeasurementEntries = [
          ...(appData.bodyMeasurementEntries || []),
          ...newMeasurementEntries
        ];

        // Workouts - mescla evitando duplicatas por ID
        const existingWorkoutIds = new Set(
          (appData.workouts || []).map(workout => workout.id)
        );
        const newWorkouts = backupData.data.workouts.filter(
          workout => !existingWorkoutIds.has(workout.id)
        );
        appData.workouts = [...(appData.workouts || []), ...newWorkouts];

        // Hero fitness data - usa os dados mais recentes do backup se existirem
        if (backupData.data.heroFitnessData.weight !== undefined) {
          appData.hero.weight = backupData.data.heroFitnessData.weight;
        }
        if (backupData.data.heroFitnessData.bodyMeasurements) {
          appData.hero.bodyMeasurements = {
            ...appData.hero.bodyMeasurements,
            ...backupData.data.heroFitnessData.bodyMeasurements,
          };
        }
      }

      await this.storageService.saveAppData();
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do backup
   */
  async getBackupStats(filePath: string): Promise<{
    weightEntries: number;
    bodyMeasurementEntries: number;
    workouts: number;
    exportDate: string;
    hasHeroData: boolean;
  }> {
    try {
      const backupData = await this.readBackupFile(filePath);
      
      return {
        weightEntries: backupData.data.weightEntries.length,
        bodyMeasurementEntries: backupData.data.bodyMeasurementEntries.length,
        workouts: backupData.data.workouts.length,
        exportDate: backupData.exportDate,
        hasHeroData: !!(
          backupData.data.heroFitnessData.weight || 
          backupData.data.heroFitnessData.bodyMeasurements
        ),
      };
    } catch (error) {
      console.error('Error getting backup stats:', error);
      throw error;
    }
  }

  /**
   * Limpa todos os dados fitness (para teste ou reset)
   */
  async clearAllFitnessData(): Promise<void> {
    try {
      await this.storageService.initializeAppData();
      const appData = await this.storageService.getAppData();

      appData.weightEntries = [];
      appData.bodyMeasurementEntries = [];
      appData.workouts = [];
      appData.hero.weight = undefined;
      appData.hero.bodyMeasurements = undefined;

      await this.storageService.saveAppData();
    } catch (error) {
      console.error('Error clearing fitness data:', error);
      throw new Error('Failed to clear fitness data');
    }
  }
}

export default FitnessBackupService;