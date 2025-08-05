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
  
  // Impact management states
  const [characteristicImpacts, setCharacteristicImpacts] = useState<{ [key: string]: number }>({});
  const [editCharacteristicImpacts, setEditCharacteristicImpacts] = useState<{ [key: string]: number }>({});
  
  // Impact questionnaire states
  const [showImpactQuestionnaireModal, setShowImpactQuestionnaireModal] = useState(false);
  const [currentQuestionnaireChar, setCurrentQuestionnaireChar] = useState('');
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Backup states
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

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
    // Remove impact when characteristic is removed
    setCharacteristicImpacts(prev => {
      const updated = { ...prev };
      delete updated[charToRemove];
      return updated;
    });
  };

  const toggleExistingCharacteristic = (charName: string) => {
    if (newCharacteristics.includes(charName)) {
      setNewCharacteristics(newCharacteristics.filter(char => char !== charName));
      // Remove impact when characteristic is removed
      setCharacteristicImpacts(prev => {
        const updated = { ...prev };
        delete updated[charName];
        return updated;
      });
    } else {
      const updatedChars = [...newCharacteristics, charName];
      setNewCharacteristics(updatedChars);
      // Set equal impact for all characteristics
      const equalImpact = Math.floor(100 / updatedChars.length);
      const impacts: { [key: string]: number } = {};
      updatedChars.forEach((char, index) => {
        impacts[char] = equalImpact + (index === 0 ? 100 - (equalImpact * updatedChars.length) : 0);
      });
      setCharacteristicImpacts(impacts);
    }
  };

  const getAvailableCharacteristics = () => {
    return Object.keys(appData?.characteristics || {}).filter(
      charName => !newCharacteristics.includes(charName)
    );
  };

  // Impact management functions
  const updateCharacteristicImpact = (charName: string, impact: number) => {
    setCharacteristicImpacts(prev => ({
      ...prev,
      [charName]: Math.max(1, Math.min(100, impact))
    }));
  };

  const updateEditCharacteristicImpact = (charName: string, impact: number) => {
    setEditCharacteristicImpacts(prev => ({
      ...prev,
      [charName]: Math.max(1, Math.min(100, impact))
    }));
  };

  const getTotalImpact = (impacts: { [key: string]: number }) => {
    return Object.values(impacts).reduce((sum, impact) => sum + impact, 0);
  };

  const normalizeImpacts = (impacts: { [key: string]: number }) => {
    const total = getTotalImpact(impacts);
    if (total === 0) return impacts;
    
    const normalized: { [key: string]: number } = {};
    Object.entries(impacts).forEach(([char, impact]) => {
      normalized[char] = Math.round((impact / total) * 100);
    });
    
    return normalized;
  };

  // Impact questionnaire functions
  const getQuestions = (skillName: string, charName: string) => [
    {
      question: `Quão diretamente "${skillName}" influencia "${charName}"?`,
      options: [
        { text: 'O impacto é indireto ou complementar. A skill contribui de forma mínima ou é mais um suporte.', value: 25 },
        { text: 'O impacto é moderado. A skill é uma parte importante, mas não a única, da característica.', value: 50 },
        { text: 'O impacto é alto. A skill é essencial e um dos pilares da característica.', value: 75 },
        { text: 'O impacto é total. A skill define a própria característica, sendo sua manifestação principal.', value: 100 }
      ]
    },
    {
      question: `Qual é a frequência com que "${skillName}" é utilizada para melhorar "${charName}"?`,
      options: [
        { text: 'Uso raro ou sazonal. A skill é ativada apenas em ocasiões específicas.', value: 25 },
        { text: 'Uso regular, mas não constante. A skill é praticada com alguma frequência.', value: 50 },
        { text: 'Uso frequente. A skill é uma das principais tarefas na rotina de aprimoramento.', value: 75 },
        { text: 'Uso diário ou constante. A skill é a atividade central para o desenvolvimento.', value: 100 }
      ]
    },
    {
      question: `Se "${skillName}" for removida, qual seria o impacto no progresso de "${charName}"?`,
      options: [
        { text: 'Pouco ou nenhum impacto. O progresso continuaria praticamente o mesmo.', value: 25 },
        { text: 'Impacto perceptível. O progresso seria mais lento, mas ainda possível.', value: 50 },
        { text: 'Impacto severo. A progressão ficaria seriamente comprometida.', value: 75 },
        { text: 'Impacto crítico. A característica não poderia progredir sem a skill.', value: 100 }
      ]
    },
    {
      question: `Qual é a importância de "${skillName}" para a definição de "${charName}"?`,
      options: [
        { text: 'A skill é um detalhe. É uma parte menor, útil para completar o quadro.', value: 25 },
        { text: 'A skill é uma base. É um componente fundamental que ajuda a manter estabilidade.', value: 50 },
        { text: 'A skill é um pilar. É um dos elementos principais que sustentam a característica.', value: 75 },
        { text: 'A skill é a essência. É a principal razão pela qual a característica existe.', value: 100 }
      ]
    }
  ];

  const startImpactQuestionnaire = (charName: string, editMode: boolean = false) => {
    console.log('🔍 startImpactQuestionnaire called:', { charName, editMode, newSkillName, editSkillName });
    setCurrentQuestionnaireChar(charName);
    setQuestionnaireAnswers([]);
    setCurrentQuestion(0);
    setIsEditMode(editMode);
    setShowImpactQuestionnaireModal(true);
    console.log('🔍 Modal should be visible now');
  };

  const handleQuestionnaireAnswer = (value: number) => {
    const newAnswers = [...questionnaireAnswers, value];
    setQuestionnaireAnswers(newAnswers);

    if (currentQuestion < 3) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate final impact percentage
      const averageImpact = Math.round(newAnswers.reduce((sum, val) => sum + val, 0) / newAnswers.length);
      
      if (isEditMode) {
        updateEditCharacteristicImpact(currentQuestionnaireChar, averageImpact);
      } else {
        updateCharacteristicImpact(currentQuestionnaireChar, averageImpact);
      }
      
      // Close questionnaire
      setShowImpactQuestionnaireModal(false);
      setQuestionnaireAnswers([]);
      setCurrentQuestion(0);
    }
  };

  const closeImpactQuestionnaire = () => {
    setShowImpactQuestionnaireModal(false);
    setQuestionnaireAnswers([]);
    setCurrentQuestion(0);
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
      await gameEngine.createSkill(newSkillName.trim(), newSkillType, newCharacteristics, characteristicImpacts);
      setShowAddModal(false);
      setNewSkillName('');
      setNewCharacteristics([]);
      setCharacteristicInput('');
      setCharacteristicImpacts({});
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
    setCharacteristicImpacts({});
    setShowAddModal(false);
  };

  // Edit functions
  const handleEditSkill = (skillName: string) => {
    const skill = appData?.skills[skillName];
    if (skill) {
      setEditingSkillName(skillName);
      setEditSkillName(skillName);
      setEditSkillType(skill.type);
      setEditCharacteristics(skill.characteristic ? [skill.characteristic] : []);
      setEditCharacteristicImpacts(skill.characteristicImpacts || {});
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
        await gameEngine.createSkill(editSkillName.trim(), editSkillType, editCharacteristics, editCharacteristicImpacts);
      } else {
        await gameEngine.updateSkillComplete(editingSkillName, editSkillType, editCharacteristics, editCharacteristicImpacts);
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
    setEditCharacteristicImpacts({});
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
    // Remove impact when characteristic is removed
    setEditCharacteristicImpacts(prev => {
      const updated = { ...prev };
      delete updated[charToRemove];
      return updated;
    });
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

  // Backup functions
  const handleExportData = async () => {
    try {
      const skills = appData?.skills || {};
      const characteristics = appData?.characteristics || {};
      
      const exportData = {
        skills,
        characteristics,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Copy to clipboard for mobile
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(jsonString);
        Alert.alert(
          'Backup Exportado!', 
          'O backup foi copiado para a área de transferência. Cole em um arquivo de texto para salvar.',
          [{ text: 'OK' }]
        );
      } else {
        // Fallback - show the JSON in an alert for manual copy
        Alert.alert(
          'Backup Gerado', 
          'Copie o texto abaixo e salve em um arquivo:\n\n' + jsonString.substring(0, 200) + '...',
          [{ text: 'OK' }]
        );
      }
      
      setShowBackupModal(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Erro', 'Falha ao exportar backup');
    }
  };

  const handleImportData = async () => {
    if (!importText.trim()) {
      Alert.alert('Erro', 'Por favor, cole o conteúdo do backup');
      return;
    }

    try {
      const importData = JSON.parse(importText);
      
      if (!importData.skills || !importData.characteristics) {
        Alert.alert('Erro', 'Formato de backup inválido');
        return;
      }

      // Import skills
      for (const [skillName, skill] of Object.entries(importData.skills)) {
        await gameEngine.storageService.updateSkill(skillName, skill as any);
      }

      // Import characteristics
      for (const [charName, characteristic] of Object.entries(importData.characteristics)) {
        await gameEngine.storageService.updateCharacteristic(charName, characteristic as any);
      }

      setImportText('');
      setShowImportModal(false);
      await loadData();
      Alert.alert('Sucesso', 'Backup importado com sucesso!');
    } catch (error) {
      console.error('Error importing data:', error);
      Alert.alert('Erro', 'Falha ao importar backup. Verifique o formato do arquivo.');
    }
  };

  const handleDeleteAll = () => {
    setShowBackupModal(false);
    setShowDeleteModal(true);
  };

  const confirmDeleteAll = () => {
    setShowDeleteModal(false);
    setShowDeleteConfirmModal(true);
    setDeleteConfirmText('');
  };

  const executeDeleteAll = async () => {
    const requiredText = "Eu confirmo que quero apagar permanentemente todas as minhas skills e características";
    
    if (deleteConfirmText.trim() !== requiredText) {
      Alert.alert('Erro', 'Texto de confirmação incorreto. Digite exatamente a frase solicitada.');
      return;
    }

    try {
      // Delete all skills
      const skills = appData?.skills || {};
      for (const skillName of Object.keys(skills)) {
        await gameEngine.deleteSkill(skillName);
      }

      // Delete all characteristics
      const characteristics = appData?.characteristics || {};
      for (const charName of Object.keys(characteristics)) {
        await gameEngine.deleteCharacteristic(charName);
      }

      setShowDeleteConfirmModal(false);
      setDeleteConfirmText('');
      await loadData();
      Alert.alert('Sucesso', 'Todas as skills e características foram apagadas.');
    } catch (error) {
      console.error('Error deleting all data:', error);
      Alert.alert('Erro', 'Falha ao apagar dados');
    }
  };

  const resetBackupModals = () => {
    setShowBackupModal(false);
    setShowDeleteModal(false);
    setShowDeleteConfirmModal(false);
    setShowImportModal(false);
    setDeleteConfirmText('');
    setImportText('');
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
            style={styles.backupButton}
            onPress={() => setShowBackupModal(true)}
          >
            <Ionicons name="cloud-upload-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
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

      {/* Impact Questionnaire Modal */}
      <Modal
        visible={showImpactQuestionnaireModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeImpactQuestionnaire}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.questionnaireModalContent}>
            <ScrollView 
              style={styles.questionnaireScrollContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.questionnaireScrollContent}
            >
              <View style={styles.questionnaireHeader}>
                <Text style={styles.questionnaireTitle}>
                  Configurar Impacto
                </Text>
                <Text style={styles.questionnaireProgress}>
                  Pergunta {currentQuestion + 1} de 4
                </Text>
              </View>

              <View style={styles.questionnaireBody}>
                <View style={styles.questionContainer}>
                  <Text style={styles.questionText}>
                    {(() => {
                      const skillName = isEditMode ? editSkillName || 'Nova Skill' : newSkillName || 'Nova Skill';
                      const questions = currentQuestionnaireChar ? getQuestions(skillName, currentQuestionnaireChar) : [];
                      const question = questions[currentQuestion]?.question || 'Carregando pergunta...';
                      console.log('🔍 Question data:', { skillName, currentQuestionnaireChar, currentQuestion, question, questions });
                      return question;
                    })()}
                  </Text>
                </View>

                <View style={styles.optionsContainer}>
                  {(() => {
                    const skillName = isEditMode ? editSkillName || 'Nova Skill' : newSkillName || 'Nova Skill';
                    const questions = currentQuestionnaireChar ? getQuestions(skillName, currentQuestionnaireChar) : [];
                    const options = questions[currentQuestion]?.options || [];
                    
                    console.log('🔍 Options data:', { options, optionsLength: options.length });
                    
                    return options.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.optionButton}
                        onPress={() => {
                          console.log('🔍 Option selected:', option);
                          handleQuestionnaireAnswer(option.value);
                        }}
                      >
                        <View style={styles.optionHeader}>
                          <Text style={styles.optionLetter}>
                            {String.fromCharCode(65 + index)}. ({option.value}%)
                          </Text>
                        </View>
                        <Text style={styles.optionText}>
                          {option.text}
                        </Text>
                      </TouchableOpacity>
                    ));
                  })()}
                </View>
              </View>

              <View style={styles.questionnaireFooter}>
                <TouchableOpacity
                  style={styles.questionnaireCancelButton}
                  onPress={closeImpactQuestionnaire}
                >
                  <Text style={styles.questionnaireCancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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

              {newCharacteristics.map((char, index) => {
                console.log('🔍 Rendering characteristic:', char, 'Impact:', characteristicImpacts[char]);
                return (
                  <View key={index} style={styles.characteristicItem}>
                    <Text style={styles.characteristicText}>{char}</Text>
                    <View style={styles.impactControls}>
                      <Text style={styles.impactText}>
                        {characteristicImpacts[char] || 0}%
                      </Text>
                      <TouchableOpacity
                        style={styles.questionnaireButton}
                        onPress={() => {
                          console.log('🔍 Starting questionnaire for:', char);
                          startImpactQuestionnaire(char, false);
                        }}
                      >
                        <Text style={styles.questionnaireButtonText}>📋</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeCharacteristic(char)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              
              {newCharacteristics.length > 0 && (
                <View style={styles.impactSummary}>
                  <Text style={styles.impactSummaryText}>
                    Total de Impacto: {getTotalImpact(characteristicImpacts)}%
                  </Text>
                  {getTotalImpact(characteristicImpacts) !== 100 && (
                    <Text style={styles.impactWarning}>
                      ⚠️ Recomendado: 100% total
                    </Text>
                  )}
                </View>
              )}
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
                  <View style={styles.impactControls}>
                    <Text style={styles.impactText}>
                      {editCharacteristicImpacts[char] || 0}%
                    </Text>
                    <TouchableOpacity
                      style={styles.questionnaireButton}
                      onPress={() => {
                        console.log('🔍 Starting questionnaire for edit:', char);
                        startImpactQuestionnaire(char, true);
                      }}
                    >
                      <Text style={styles.questionnaireButtonText}>📋</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeEditCharacteristic(char)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {editCharacteristics.length > 0 && (
                <View style={styles.impactSummary}>
                  <Text style={styles.impactSummaryText}>
                    Total de Impacto: {getTotalImpact(editCharacteristicImpacts)}%
                  </Text>
                  {getTotalImpact(editCharacteristicImpacts) !== 100 && (
                    <Text style={styles.impactWarning}>
                      ⚠️ Recomendado: 100% total
                    </Text>
                  )}
                </View>
              )}
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

      {/* Backup Main Modal */}
      <Modal
        visible={showBackupModal}
        transparent
        animationType="slide"
        onRequestClose={resetBackupModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Backup & Restore</Text>
            
            <TouchableOpacity style={styles.backupOptionButton} onPress={handleExportData}>
              <Ionicons name="download-outline" size={24} color={Colors.primary} />
              <View style={styles.backupOptionContent}>
                <Text style={styles.backupOptionTitle}>Exportar</Text>
                <Text style={styles.backupOptionDescription}>Salvar suas skills e características</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backupOptionButton} onPress={() => setShowImportModal(true)}>
              <Ionicons name="cloud-upload-outline" size={24} color={Colors.secondary} />
              <View style={styles.backupOptionContent}>
                <Text style={styles.backupOptionTitle}>Importar</Text>
                <Text style={styles.backupOptionDescription}>Restaurar de um backup</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.backupOptionButton, styles.dangerOption]} onPress={handleDeleteAll}>
              <Ionicons name="trash-outline" size={24} color={Colors.danger} />
              <View style={styles.backupOptionContent}>
                <Text style={[styles.backupOptionTitle, styles.dangerText]}>Apagar Tudo</Text>
                <Text style={[styles.backupOptionDescription, styles.dangerText]}>Remove todas as skills e características</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={resetBackupModals}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Import Modal */}
      <Modal
        visible={showImportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Importar Backup</Text>
            
            <Text style={styles.importInstructions}>
              Cole o conteúdo do arquivo de backup abaixo:
            </Text>
            
            <TextInput
              style={styles.importTextArea}
              placeholder="Cole o JSON do backup aqui..."
              placeholderTextColor={Colors.textSecondary}
              value={importText}
              onChangeText={setImportText}
              multiline
              numberOfLines={10}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowImportModal(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={handleImportData}>
                <Text style={styles.createButtonText}>Importar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal 1 */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Confirmação</Text>
            
            <Text style={styles.warningText}>
              Você está prestes a apagar TODAS as suas skills e características.
              {'\n\n'}
              Esta ação é PERMANENTE e não pode ser desfeita.
              {'\n\n'}
              Tem certeza absoluta que deseja continuar?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.createButton, styles.dangerButton]} onPress={confirmDeleteAll}>
                <Text style={styles.createButtonText}>Sim, continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal 2 - Final */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeleteConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🚨 CONFIRMAÇÃO FINAL</Text>
            
            <Text style={styles.warningText}>
              ÚLTIMA CHANCE! Esta ação irá apagar permanentemente:
              {'\n\n'}
              • Todas as suas skills
              {'\n'}
              • Todas as suas características  
              {'\n'}
              • Todo o progresso associado
              {'\n\n'}
              Para confirmar, digite EXATAMENTE a frase abaixo:
            </Text>

            <Text style={styles.confirmationPhrase}>
              "Eu confirmo que quero apagar permanentemente todas as minhas skills e características"
            </Text>
            
            <TextInput
              style={styles.confirmationInput}
              placeholder="Digite a frase de confirmação aqui..."
              placeholderTextColor={Colors.textSecondary}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDeleteConfirmModal(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.createButton, styles.dangerButton]} onPress={executeDeleteAll}>
                <Text style={styles.createButtonText}>APAGAR TUDO</Text>
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
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
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
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  skillActions: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: Spacing.xs,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.error,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Impact control styles
  impactControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    padding: 4,
  },
  impactText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: 'bold',
    minWidth: 35,
    textAlign: 'center',
  },
  questionnaireButton: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    padding: 6,
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionnaireButtonText: {
    fontSize: 14,
    color: Colors.background,
  },
  impactSummary: {
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: 8,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  impactSummaryText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: 'bold',
  },
  impactWarning: {
    fontSize: FontSizes.xs,
    color: Colors.warning,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  // Questionnaire modal styles
  questionnaireModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: '95%',
    height: '90%',
  },
  questionnaireScrollContainer: {
    flex: 1,
  },
  questionnaireScrollContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  questionnaireHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexShrink: 0,
  },
  questionnaireTitle: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  questionnaireProgress: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  questionnaireBody: {
    flex: 1,
    minHeight: 400,
  },
  questionContainer: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: 80,
  },
  questionText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'left',
    lineHeight: 22,
    width: '100%',
  },
  optionsContainer: {
    paddingVertical: Spacing.sm,
  },
  optionButton: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 55,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    marginBottom: Spacing.xs,
  },
  optionHeader: {
    marginBottom: Spacing.xs,
  },
  optionLetter: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: FontSizes.xs,
    color: Colors.text,
    lineHeight: 18,
    textAlign: 'left',
    flexWrap: 'wrap',
    flex: 1,
    flexShrink: 1,
  },
  questionnaireFooter: {
    marginTop: Spacing.sm,
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexShrink: 0,
  },
  questionnaireCancelButton: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 120,
    alignItems: 'center',
  },
  questionnaireCancelText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600',
  },
  // Backup styles
  backupButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  backupOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backupOptionContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  backupOptionTitle: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  backupOptionDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  dangerOption: {
    borderColor: Colors.danger,
    backgroundColor: Colors.danger + '10',
  },
  dangerText: {
    color: Colors.danger,
  },
  dangerButton: {
    backgroundColor: Colors.danger,
  },
  importInstructions: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  importTextArea: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  warningText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  confirmationPhrase: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.primary + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  confirmationInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.danger,
    marginBottom: Spacing.lg,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default SkillsScreen;