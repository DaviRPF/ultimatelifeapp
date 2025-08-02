import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { AttributeDescription } from '../types';

interface AttributeSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  descriptions: AttributeDescription[];
  color?: string;
}

const AttributeSlider: React.FC<AttributeSliderProps> = ({
  label,
  value,
  onValueChange,
  descriptions,
  color = Colors.primary,
}) => {
  // Find the closest description for current value
  const getCurrentDescription = () => {
    const closest = descriptions.reduce((prev, curr) => {
      return Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev;
    });
    return closest;
  };

  const currentDesc = getCurrentDescription();

  // Handle value change with validation (never allow 0%)
  const handleValueChange = (newValue: number) => {
    const validValue = Math.max(10, Math.round(newValue / 10) * 10); // Minimum 10%, rounded to 10s
    onValueChange(validValue);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.percentage, { color }]}>{value}%</Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={10}
          maximumValue={100}
          step={10}
          value={value}
          onValueChange={handleValueChange}
          minimumTrackTintColor={color}
          maximumTrackTintColor={Colors.surfaceDark}
          thumbStyle={[styles.thumb, { backgroundColor: color }]}
        />
      </View>

      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>{currentDesc.label}</Text>
        <Text style={styles.descriptionText}>{currentDesc.description}</Text>
      </View>

      {/* Scale indicators */}
      <View style={styles.scaleContainer}>
        <Text style={styles.scaleText}>10%</Text>
        <Text style={styles.scaleText}>50%</Text>
        <Text style={styles.scaleText}>100%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  percentage: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  sliderContainer: {
    marginVertical: Spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  descriptionContainer: {
    backgroundColor: Colors.backgroundDark,
    borderRadius: 8,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  descriptionTitle: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  scaleText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});

export default AttributeSlider;