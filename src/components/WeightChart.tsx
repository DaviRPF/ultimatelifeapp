import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { WeightEntry } from '../types';

interface WeightChartProps {
  weightEntries: WeightEntry[];
}

const { width } = Dimensions.get('window');

const WeightChart: React.FC<WeightChartProps> = ({ weightEntries }) => {
  if (weightEntries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhum dado de peso</Text>
        <Text style={styles.emptySubtext}>Adicione registros de peso para ver seu progresso!</Text>
      </View>
    );
  }

  // Sort entries by date (oldest first for chart)
  const sortedEntries = [...weightEntries].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Prepare data for gifted charts
  const chartData = sortedEntries.map((entry, index) => {
    const date = new Date(entry.date);
    const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    return {
      value: entry.weight,
      label,
      dataPointText: `${entry.weight}kg`,
      textShiftY: -10,
      textShiftX: 0,
      textColor: Colors.text,
      textFontSize: 10,
    };
  });

  const weights = sortedEntries.map(entry => entry.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1;
  const trend = weights.length > 1 ? weights[weights.length - 1] - weights[0] : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progresso do Peso</Text>
      
      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Registros</Text>
          <Text style={styles.statValue}>{sortedEntries.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mín - Máx</Text>
          <Text style={styles.statValue}>{minWeight.toFixed(1)} - {maxWeight.toFixed(1)} kg</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tendência</Text>
          <Text style={[styles.statValue, { color: trend >= 0 ? Colors.warning : Colors.success }]}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)} kg
          </Text>
        </View>
      </View>

      {/* Gráfico */}
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={width - 100}
          height={200}
          backgroundColor="transparent"
          curved
          thickness={2}
          color={Colors.primary}
          dataPointsColor={Colors.primary}
          dataPointsRadius={4}
          rulesType="solid"
          rulesColor={Colors.border}
          xAxisColor={Colors.border}
          yAxisColor={Colors.border}
          yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 9 }}
          yAxisSide="left"
          yAxisOffset={5}
          maxValue={Math.ceil(maxWeight + weightRange * 0.1)}
          minValue={Math.floor(minWeight - weightRange * 0.1)}
          animateOnDataChange
          animationDuration={800}
          showDataPointsOnFocus
          focusedDataPointColor={Colors.accent}
          showTextOnFocus
          textFontSize={10}
          textColor={Colors.text}
          noOfSections={4}
          spacing={Math.max(20, (width - 150) / Math.max(1, chartData.length - 1))}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    marginHorizontal: -Spacing.xs,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.xl,
    margin: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
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