import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { BodyMeasurementEntry } from '../types';

interface BodyMeasurementChartProps {
  entries: BodyMeasurementEntry[];
  measurementKey: keyof BodyMeasurementEntry['measurements'];
  title?: string;
}

const { width } = Dimensions.get('window');

const BodyMeasurementChart: React.FC<BodyMeasurementChartProps> = ({ 
  entries, 
  measurementKey, 
  title 
}) => {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhuma medição registrada</Text>
        <Text style={styles.emptySubtext}>Adicione medições corporais para ver o progresso!</Text>
      </View>
    );
  }

  // Filtrar e ordenar entradas que têm a medição desejada
  const filteredEntries = entries
    .filter(entry => entry.measurements[measurementKey] && entry.measurements[measurementKey]! > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (filteredEntries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhuma medição de {title?.toLowerCase()}</Text>
        <Text style={styles.emptySubtext}>Registre medições para ver a evolução!</Text>
      </View>
    );
  }

  // Preparar dados para o gráfico
  const chartData = filteredEntries.map((entry, index) => {
    const date = new Date(entry.date);
    const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const value = entry.measurements[measurementKey]!;
    
    return {
      value,
      label,
      dataPointText: `${value}cm`,
      textShiftY: -10,
      textShiftX: 0,
      textColor: Colors.text,
      textFontSize: 10,
    };
  });

  const values = chartData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;

  // Nomes das medições em português
  const measurementNames: Record<string, string> = {
    bracoRelaxado: 'Braço Relaxado',
    bracoContraido: 'Braço Contraído',
    antebraco: 'Antebraço',
    peitoral: 'Peitoral',
    abdomen: 'Abdômen',
    gluteo: 'Glúteo',
    deltoides: 'Deltoides',
    perna: 'Perna (Coxa)',
    panturrilha: 'Panturrilha',
  };

  const displayTitle = title || measurementNames[measurementKey] || measurementKey;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Evolução - {displayTitle}</Text>
      
      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Registros</Text>
          <Text style={styles.statValue}>{filteredEntries.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mín - Máx</Text>
          <Text style={styles.statValue}>{minValue.toFixed(1)} - {maxValue.toFixed(1)} cm</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Variação</Text>
          <Text style={[styles.statValue, { 
            color: trend > 0 ? Colors.warning : trend < 0 ? Colors.success : Colors.text 
          }]}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)} cm
          </Text>
        </View>
      </View>

      {/* Gráfico */}
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={width - 100}
          height={180}
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
          yAxisSide={'left' as any}
          yAxisOffset={5}
          maxValue={Math.ceil(maxValue + valueRange * 0.1)}
          minValue={Math.floor(minValue - valueRange * 0.1)}
          animateOnDataChange
          animationDuration={800}
          showDataPointsOnFocus
          focusedDataPointColor={Colors.accent}
          showTextOnFocus
          textFontSize={10}
          textColor={Colors.text}
          noOfSections={4}
          spacing={Math.max(20, (width - 150) / Math.max(1, chartData.length - 1))}
          areaChart
          startFillColor={Colors.primary}
          startOpacity={0.2}
          endFillColor={Colors.primary}
          endOpacity={0.05}
        />
      </View>

      {/* Informações de tendência */}
      <View style={styles.trendContainer}>
        <View style={styles.trendItem}>
          <View style={[styles.trendIndicator, { 
            backgroundColor: trend > 0 ? Colors.warning : trend < 0 ? Colors.success : Colors.border 
          }]} />
          <Text style={styles.trendText}>
            {trend > 0 ? 'Tendência de aumento' : trend < 0 ? 'Tendência de diminuição' : 'Estável'}
          </Text>
        </View>
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
    marginBottom: Spacing.md,
    marginHorizontal: -Spacing.xs,
  },
  trendContainer: {
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trendText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
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
});

export default BodyMeasurementChart;