import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  Linking,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import StorageService from '../../services/StorageService';
import SoundService from '../../services/SoundService';

interface SettingsData {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  soundVolume: number;
  notificationsEnabled: boolean;
  darkMode: boolean;
  xpMultiplier: number;
  autoBackup: boolean;
}

const SettingsScreen = () => {
  const [settings, setSettings] = useState<SettingsData>({
    soundEnabled: true,
    hapticEnabled: true,
    soundVolume: 0.7,
    notificationsEnabled: true,
    darkMode: false,
    xpMultiplier: 1.0,
    autoBackup: false
  });
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPhrase, setResetPhrase] = useState('');
  const [confirmationStep, setConfirmationStep] = useState(0);
  
  const soundService = SoundService.getInstance();
  const storageService = StorageService.getInstance();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('app_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        
        // Apply sound settings
        soundService.setEnabled(parsedSettings.soundEnabled);
        soundService.setVolume(parsedSettings.soundVolume);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: SettingsData) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Apply sound settings immediately
      soundService.setEnabled(newSettings.soundEnabled);
      soundService.setVolume(newSettings.soundVolume);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleSoundToggle = (value: boolean) => {
    const newSettings = { ...settings, soundEnabled: value };
    saveSettings(newSettings);
    if (value) {
      soundService.playTaskComplete();
    }
  };

  const handleHapticToggle = (value: boolean) => {
    const newSettings = { ...settings, hapticEnabled: value };
    saveSettings(newSettings);
  };

  const handleVolumeChange = (volume: number) => {
    const newSettings = { ...settings, soundVolume: volume };
    saveSettings(newSettings);
  };

  const handleNotificationsToggle = (value: boolean) => {
    const newSettings = { ...settings, notificationsEnabled: value };
    saveSettings(newSettings);
  };

  const handleDarkModeToggle = (value: boolean) => {
    const newSettings = { ...settings, darkMode: value };
    saveSettings(newSettings);
    Alert.alert('Dark Mode', 'Dark mode will be applied in the next app update!');
  };

  const handleXPMultiplierChange = (multiplier: number) => {
    const newSettings = { ...settings, xpMultiplier: multiplier };
    saveSettings(newSettings);
  };

  const handleAutoBackupToggle = (value: boolean) => {
    const newSettings = { ...settings, autoBackup: value };
    saveSettings(newSettings);
  };

  const exportData = async () => {
    try {
      const allData = {
        tasks: storageService.getTasks(),
        skills: storageService.getSkills(),
        characteristics: storageService.getCharacteristics(),
        hero: storageService.getHero(),
        achievements: storageService.getAchievements(),
        rewards: storageService.getRewards(),
        settings: settings,
        exportDate: new Date().toISOString()
      };
      
      const dataString = JSON.stringify(allData, null, 2);
      
      await Share.share({
        message: dataString,
        title: 'DoItNow RPG - Data Export'
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const importData = () => {
    Alert.alert(
      'Import Data',
      'To import data, you\'ll need to manually restore from a backup file. This feature will be enhanced in future updates.',
      [{ text: 'OK' }]
    );
  };

  const resetAllData = () => {
    setShowResetModal(true);
    setConfirmationStep(0);
    setResetPhrase('');
  };

  const handleResetConfirmation = async () => {
    const requiredPhrase = "Eu entendo que vou perder todo meu progresso permanentemente";
    
    if (confirmationStep === 0) {
      if (resetPhrase.trim() === requiredPhrase) {
        setConfirmationStep(1);
        setResetPhrase('');
      } else {
        Alert.alert(
          'Frase Incorreta',
          'Por favor, digite exatamente a frase solicitada para confirmar que você entende as consequências.'
        );
      }
    } else if (confirmationStep === 1) {
      if (resetPhrase.trim() === requiredPhrase) {
        try {
          await AsyncStorage.clear();
          setShowResetModal(false);
          setConfirmationStep(0);
          setResetPhrase('');
          Alert.alert('Sucesso', 'Todos os dados foram apagados. Por favor, reinicie o aplicativo.');
        } catch (error) {
          Alert.alert('Erro', 'Falha ao apagar os dados');
        }
      } else {
        Alert.alert(
          'Confirmação Final Incorreta',
          'Frase incorreta. Digite novamente para confirmar definitivamente a exclusão de todos os dados.'
        );
      }
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setConfirmationStep(0);
    setResetPhrase('');
  };

  const openGitHub = () => {
    Linking.openURL('https://github.com/DoItNowRPG/app');
  };

  const sendFeedback = () => {
    Linking.openURL('mailto:feedback@doitnowrpg.com?subject=App Feedback');
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSettingRow = (
    icon: string,
    title: string,
    description: string,
    value: boolean | number | string,
    onPress?: () => void,
    component?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && !component}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={Colors.primary} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.settingRight}>
        {component || (
          typeof value === 'boolean' ? (
            <Switch
              value={value}
              onValueChange={onPress as any}
              trackColor={{ false: Colors.textSecondary, true: Colors.primary }}
              thumbColor={value ? Colors.secondary : Colors.surface}
            />
          ) : (
            <Text style={styles.settingValue}>{value}</Text>
          )
        )}
      </View>
    </TouchableOpacity>
  );

  const renderVolumeSlider = () => {
    const volumePercentage = Math.round(settings.soundVolume * 100);
    return (
      <View style={styles.volumeContainer}>
        <View style={styles.volumeLabels}>
          <Text style={styles.volumeLabel}>🔇</Text>
          <Text style={styles.volumeLabel}>{volumePercentage}%</Text>
          <Text style={styles.volumeLabel}>🔊</Text>
        </View>
        <View style={styles.volumeSlider}>
          {/* Simple volume bar implementation */}
          <View style={styles.volumeTrack}>
            <View 
              style={[
                styles.volumeFill,
                { width: `${volumePercentage}%` }
              ]} 
            />
          </View>
          <View style={styles.volumeButtons}>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((vol) => (
              <TouchableOpacity
                key={vol}
                style={[
                  styles.volumeButton,
                  settings.soundVolume === vol && styles.volumeButtonActive
                ]}
                onPress={() => handleVolumeChange(vol)}
              >
                <Text style={{
                  color: settings.soundVolume === vol ? Colors.background : Colors.text,
                  fontSize: 12
                }}>
                  {Math.round(vol * 100)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderXPMultiplierButtons = () => (
    <View style={styles.multiplierContainer}>
      {[0.5, 1.0, 1.5, 2.0].map((multiplier) => (
        <TouchableOpacity
          key={multiplier}
          style={[
            styles.multiplierButton,
            settings.xpMultiplier === multiplier && styles.multiplierButtonActive
          ]}
          onPress={() => handleXPMultiplierChange(multiplier)}
        >
          <Text style={[
            styles.multiplierText,
            settings.xpMultiplier === multiplier && styles.multiplierTextActive
          ]}>
            {multiplier}x
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your DoItNow RPG experience</Text>
      </View>

      {renderSection('🔊 Audio & Haptics', (
        <>
          {renderSettingRow(
            'volume-high',
            'Sound Effects',
            'Enable dopaminergic sounds for completions',
            settings.soundEnabled,
            () => handleSoundToggle(!settings.soundEnabled)
          )}
          
          {settings.soundEnabled && (
            <View style={styles.subSetting}>
              <Text style={styles.subSettingTitle}>Volume Level</Text>
              {renderVolumeSlider()}
            </View>
          )}
          
          {renderSettingRow(
            'phone-portrait',
            'Haptic Feedback',
            'Enable vibration feedback',
            settings.hapticEnabled,
            () => handleHapticToggle(!settings.hapticEnabled)
          )}
        </>
      ))}

      {renderSection('🎮 Gameplay', (
        <>
          {renderSettingRow(
            'star',
            'XP Multiplier',
            'Adjust experience point gain rate',
            `${settings.xpMultiplier}x`,
            undefined,
            renderXPMultiplierButtons()
          )}
          
          {renderSettingRow(
            'notifications',
            'Notifications',
            'Enable task reminders and achievements',
            settings.notificationsEnabled,
            () => handleNotificationsToggle(!settings.notificationsEnabled)
          )}
        </>
      ))}

      {renderSection('🎨 Appearance', (
        <>
          {renderSettingRow(
            'moon',
            'Dark Mode',
            'Switch to dark theme (coming soon)',
            settings.darkMode,
            () => handleDarkModeToggle(!settings.darkMode)
          )}
        </>
      ))}

      {renderSection('💾 Data Management', (
        <>
          {renderSettingRow(
            'cloud-upload',
            'Auto Backup',
            'Automatically backup data (coming soon)',
            settings.autoBackup,
            () => handleAutoBackupToggle(!settings.autoBackup)
          )}
          
          {renderSettingRow(
            'download',
            'Export Data',
            'Share/backup all your progress',
            '',
            exportData
          )}
          
          {renderSettingRow(
            'cloud-download',
            'Import Data',
            'Restore from backup file',
            '',
            importData
          )}
          
          {renderSettingRow(
            'trash',
            'Reset All Data',
            'Permanently delete all progress',
            '',
            resetAllData
          )}
        </>
      ))}

      {renderSection('ℹ️ About', (
        <>
          {renderSettingRow(
            'logo-github',
            'Source Code',
            'View project on GitHub',
            '',
            openGitHub
          )}
          
          {renderSettingRow(
            'mail',
            'Send Feedback',
            'Help us improve the app',
            '',
            sendFeedback
          )}
          
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>DoItNow RPG v1.0.0</Text>
            <Text style={styles.versionSubtext}>Made with ❤️ for productivity warriors</Text>
          </View>
        </>
      ))}

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeResetModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resetModalContent}>
            <View style={styles.resetModalHeader}>
              <Ionicons name="warning" size={48} color={Colors.danger} />
              <Text style={styles.resetModalTitle}>
                {confirmationStep === 0 ? 'ATENÇÃO: Resetar Todos os Dados' : 'CONFIRMAÇÃO FINAL'}
              </Text>
            </View>

            <Text style={styles.resetModalDescription}>
              {confirmationStep === 0 
                ? 'Esta ação irá PERMANENTEMENTE deletar:\n\n• Todas as suas tasks e progresso\n• Todas as skills e níveis\n• Todas as conquistas\n• Todo o histórico de atividades\n• Todas as configurações\n\nEsta ação NÃO PODE ser desfeita!'
                : 'ÚLTIMA CHANCE!\n\nTodos os seus dados serão perdidos PARA SEMPRE.\n\nSe você tem certeza absoluta, digite a frase novamente:'
              }
            </Text>

            <View style={styles.resetInputContainer}>
              <Text style={styles.resetInputLabel}>
                Digite exatamente esta frase para continuar:
              </Text>
              <Text style={styles.requiredPhrase}>
                "Eu entendo que vou perder todo meu progresso permanentemente"
              </Text>
              <TextInput
                style={styles.resetInput}
                placeholder="Digite a frase aqui..."
                placeholderTextColor={Colors.textSecondary}
                value={resetPhrase}
                onChangeText={setResetPhrase}
                multiline={true}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.resetModalButtons}>
              <TouchableOpacity 
                style={styles.resetCancelButton} 
                onPress={closeResetModal}
              >
                <Text style={styles.resetCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.resetConfirmButton,
                  confirmationStep === 1 && styles.resetFinalConfirmButton
                ]} 
                onPress={handleResetConfirmation}
              >
                <Text style={styles.resetConfirmText}>
                  {confirmationStep === 0 ? 'Continuar' : 'APAGAR TUDO'}
                </Text>
              </TouchableOpacity>
            </View>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    marginLeft: Spacing.lg,
    marginTop: Spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  settingRight: {
    alignItems: 'flex-end',
  },
  settingValue: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  subSetting: {
    backgroundColor: Colors.background,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subSettingTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  volumeContainer: {
    width: '100%',
  },
  volumeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  volumeLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  volumeSlider: {
    width: '100%',
  },
  volumeTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    marginBottom: Spacing.sm,
  },
  volumeFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  volumeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  volumeButton: {
    width: 40,
    height: 30,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  volumeButtonActive: {
    backgroundColor: Colors.primary,
  },
  multiplierContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  multiplierButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  multiplierButtonActive: {
    backgroundColor: Colors.primary,
  },
  multiplierText: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  multiplierTextActive: {
    color: Colors.background,
  },
  versionContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  versionText: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  versionSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Reset Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  resetModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  resetModalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  resetModalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.danger,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  resetModalDescription: {
    fontSize: FontSizes.md,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  resetInputContainer: {
    marginBottom: Spacing.lg,
  },
  resetInputLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  requiredPhrase: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  resetModalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  resetCancelButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  resetCancelText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600',
  },
  resetConfirmButton: {
    flex: 1,
    backgroundColor: Colors.warning,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
  },
  resetFinalConfirmButton: {
    backgroundColor: Colors.danger,
  },
  resetConfirmText: {
    fontSize: FontSizes.md,
    color: Colors.background,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;