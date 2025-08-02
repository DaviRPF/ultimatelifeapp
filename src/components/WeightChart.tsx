import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { WeightEntry } from '../types';

interface WeightChartProps {
  weightEntries: WeightEntry[];
}

const { width } = Dimensions.get('window');

const WeightChart: React.FC<WeightChartProps> = ({ weightEntries }) => {
  console.log('WeightChart received entries:', weightEntries.length);
  
  if (weightEntries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No weight data to display</Text>
        <Text style={styles.emptySubtext}>Add some weight entries to see your progress chart!</Text>
      </View>
    );
  }

  // Sort entries by date (oldest first for chart)
  const sortedEntries = [...weightEntries].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Get min and max weights for scaling
  const weights = sortedEntries.map(entry => entry.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight Progress</Text>
      
      {/* Simple list view for now */}
      <View style={styles.simpleListContainer}>
        <Text style={styles.statsText}>Total Entries: {sortedEntries.length}</Text>
        <Text style={styles.statsText}>Weight Range: {minWeight.toFixed(1)} - {maxWeight.toFixed(1)} kg</Text>
        
        {sortedEntries.slice(0, 5).map((entry, index) => (
          <View key={entry.id} style={styles.entryRow}>
            <Text style={styles.entryDate}>
              {new Date(entry.date).toLocaleDateString()}
            </Text>
            <Text style={styles.entryWeight}>{entry.weight.toFixed(1)} kg</Text>
          </View>
        ))}
        
        {sortedEntries.length > 5 && (
          <Text style={styles.moreText}>... and {sortedEntries.length - 5} more entries</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    margin: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.xl,
    margin: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  simpleListContainer: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
  },
  statsText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    marginVertical: 2,
    borderRadius: 6,
  },
  entryDate: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  entryWeight: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: 'bold',
  },
  moreText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});

export default WeightChart;