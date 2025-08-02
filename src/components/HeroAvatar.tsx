import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors, FontSizes, Spacing } from '../constants/theme';

export interface HeroEvolution {
  level: number;
  emoji: string;
  title: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

interface HeroAvatarProps {
  level: number;
  size?: 'small' | 'medium' | 'large';
}

const HeroAvatar: React.FC<HeroAvatarProps> = ({ level, size = 'medium' }) => {
  const getHeroEvolution = () => {
    if (level >= 25) {
      return {
        emoji: '🦸‍♂️',
        title: 'Legendary Hero',
        backgroundColor: '#FFD700',
        borderColor: '#FFA500',
        textColor: '#8B4513',
      };
    } else if (level >= 20) {
      return {
        emoji: '🥷',
        title: 'Master Warrior',
        backgroundColor: '#9B59B6',
        borderColor: '#8E44AD',
        textColor: '#FFFFFF',
      };
    } else if (level >= 15) {
      return {
        emoji: '⚔️',
        title: 'Skilled Fighter',
        backgroundColor: '#E74C3C',
        borderColor: '#C0392B',
        textColor: '#FFFFFF',
      };
    } else if (level >= 10) {
      return {
        emoji: '🗡️',
        title: 'Adventurer',
        backgroundColor: '#3498DB',
        borderColor: '#2980B9',
        textColor: '#FFFFFF',
      };
    } else if (level >= 5) {
      return {
        emoji: '🛡️',
        title: 'Novice',
        backgroundColor: '#2ECC71',
        borderColor: '#27AE60',
        textColor: '#FFFFFF',
      };
    } else {
      return {
        emoji: '👤',
        title: 'Beginner',
        backgroundColor: '#95A5A6',
        borderColor: '#7F8C8D',
        textColor: '#2C3E50',
      };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 60, height: 60 },
          emoji: { fontSize: 24 },
          level: { fontSize: 10, bottom: -2, right: -2, width: 20, height: 20 },
        };
      case 'large':
        return {
          container: { width: 120, height: 120 },
          emoji: { fontSize: 48 },
          level: { fontSize: 14, bottom: 5, right: 5, width: 30, height: 30 },
        };
      default: // medium
        return {
          container: { width: 80, height: 80 },
          emoji: { fontSize: 32 },
          level: { fontSize: 12, bottom: 0, right: 0, width: 25, height: 25 },
        };
    }
  };

  const heroData = getHeroEvolution();
  const sizeStyles = getSizeStyles();

  return (
    <View style={[
      styles.container,
      sizeStyles.container,
      { 
        backgroundColor: heroData.backgroundColor,
        borderColor: heroData.borderColor,
      }
    ]}>
      <Text style={[styles.emoji, sizeStyles.emoji]}>
        {heroData.emoji}
      </Text>
      
      {/* Level badge */}
      <View style={[
        styles.levelBadge,
        sizeStyles.level,
        { backgroundColor: heroData.borderColor }
      ]}>
        <Text style={[
          styles.levelText,
          { 
            fontSize: sizeStyles.level.fontSize,
            color: heroData.textColor === '#FFFFFF' ? '#FFFFFF' : '#2C3E50'
          }
        ]}>
          {level}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emoji: {
    textAlign: 'center',
  },
  levelBadge: {
    position: 'absolute',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  levelText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

// Export function to get all hero evolutions
export const getAllHeroEvolutions = (): HeroEvolution[] => {
  return [
    {
      level: 1,
      emoji: '👤',
      title: 'Beginner',
      backgroundColor: '#95A5A6',
      borderColor: '#7F8C8D',
      textColor: '#2C3E50',
    },
    {
      level: 5,
      emoji: '🛡️',
      title: 'Novice',
      backgroundColor: '#2ECC71',
      borderColor: '#27AE60',
      textColor: '#FFFFFF',
    },
    {
      level: 10,
      emoji: '🗡️',
      title: 'Adventurer',
      backgroundColor: '#3498DB',
      borderColor: '#2980B9',
      textColor: '#FFFFFF',
    },
    {
      level: 15,
      emoji: '⚔️',
      title: 'Skilled Fighter',
      backgroundColor: '#E74C3C',
      borderColor: '#C0392B',
      textColor: '#FFFFFF',
    },
    {
      level: 20,
      emoji: '🥷',
      title: 'Master Warrior',
      backgroundColor: '#9B59B6',
      borderColor: '#8E44AD',
      textColor: '#FFFFFF',
    },
    {
      level: 25,
      emoji: '🦸‍♂️',
      title: 'Legendary Hero',
      backgroundColor: '#FFD700',
      borderColor: '#FFA500',
      textColor: '#8B4513',
    },
  ];
};

export { HeroAvatar };
export default HeroAvatar;