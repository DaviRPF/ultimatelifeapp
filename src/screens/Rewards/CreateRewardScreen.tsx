import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import GameEngine from '../../services/GameEngine';
import { Reward } from '../../types';

type CreateRewardScreenNavigationProp = StackNavigationProp<any, 'CreateReward'>;

interface Props {
  navigation: CreateRewardScreenNavigationProp;
}

const CreateRewardScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const gameEngine = GameEngine.getInstance();

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Reward title is required');
      return false;
    }

    const costNumber = parseInt(cost);
    if (!cost.trim() || isNaN(costNumber) || costNumber <= 0) {
      Alert.alert('Error', 'Please enter a valid cost (positive number)');
      return false;
    }

    return true;
  };

  const handleCreateReward = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const rewardData: Omit<Reward, 'id' | 'purchased' | 'timePurchased' | 'createdAt'> = {
        title: title.trim(),
        description: description.trim(),
        cost: parseInt(cost),
      };

      await gameEngine.createReward(rewardData);
      Alert.alert('Success', 'Reward created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating reward:', error);
      Alert.alert('Error', 'Failed to create reward. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCostChange = (text: string) => {
    // Only allow positive integers
    const numericText = text.replace(/[^0-9]/g, '');
    setCost(numericText);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Create New Reward</Text>
      <Text style={styles.subtitle}>
        Design a custom reward to motivate yourself! This could be anything from a treat to a special activity.
      </Text>

      <View style={styles.form}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>Reward Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Watch a movie, Buy a coffee, Take a day off"
            placeholderTextColor={Colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your reward in more detail..."
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Cost in Gold *</Text>
          <View style={styles.costInputContainer}>
            <Text style={styles.goldIcon}>🏆</Text>
            <TextInput
              style={styles.costInput}
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
              value={cost}
              onChangeText={handleCostChange}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
          <Text style={styles.helpText}>
            Set a cost that feels meaningful but achievable. Consider how much gold you typically earn per quest.
          </Text>
        </View>

        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>💡 Reward Ideas</Text>
          <Text style={styles.exampleText}>• Small treats (10-50 gold): Coffee, snack, short break</Text>
          <Text style={styles.exampleText}>• Medium rewards (50-200 gold): Movie, book, takeout meal</Text>
          <Text style={styles.exampleText}>• Big rewards (200+ gold): Day trip, shopping, special activity</Text>
        </View>

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateReward}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creating Reward...' : 'Create Reward'}
          </Text>
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
  scrollContent: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  form: {
    flex: 1,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
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
    borderColor: Colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  costInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: Spacing.md,
  },
  goldIcon: {
    fontSize: FontSizes.lg,
    marginRight: Spacing.sm,
  },
  costInput: {
    flex: 1,
    padding: Spacing.md,
    paddingLeft: 0,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  helpText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  examplesSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  examplesTitle: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  exampleText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  createButtonDisabled: {
    backgroundColor: Colors.surfaceDark,
  },
  createButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
});

export default CreateRewardScreen;