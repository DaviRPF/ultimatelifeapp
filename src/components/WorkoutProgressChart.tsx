import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { Workout } from '../types';

interface WorkoutProgressChartProps {
  workouts: Workout[];
  chartType?: 'volume' | 'frequency' | 'duration';
  title?: string;
}

const { width } = Dimensions.get('window');

const WorkoutProgressChart: React.FC<WorkoutProgressChartProps> = ({ 
  workouts, 
  chartType = 'volume',
  title 
}) => {
  if (workouts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhum treino registrado</Text>
        <Text style={styles.emptySubtext}>Adicione treinos para ver o progresso!</Text>
      </View>
    );
  }

  // Organizar dados por semana
  const weeklyData: Record<string, { 
    volume: number, 
    frequency: number, 
    duration: number,
    workouts: Workout[]
  }> = {};

  workouts.forEach(workout => {
    const date = new Date(workout.date);
    // Calcular o início da semana (domingo)
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { volume: 0, frequency: 0, duration: 0, workouts: [] };
    }

    // Calcular volume total (peso x reps)
    const workoutVolume = workout.exercises.reduce((acc, exercise) => {
      return acc + exercise.sets.reduce((setAcc, set) => {
        return setAcc + (set.weight || 0) * set.reps;
      }, 0);
    }, 0);

    weeklyData[weekKey].volume += workoutVolume;
    weeklyData[weekKey].frequency += 1;
    weeklyData[weekKey].duration += workout.totalDuration || 0;
    weeklyData[weekKey].workouts.push(workout);
  });

  // Converter para array e ordenar por data
  const sortedWeeks = Object.entries(weeklyData)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-8); // Últimas 8 semanas

  // Preparar dados do gráfico baseado no tipo
  const chartData = sortedWeeks.map(([weekKey, data], index) => {
    const date = new Date(weekKey);
    const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    let value: number;
    let unit: string;
    let color: string;
    
    switch (chartType) {
      case 'frequency':
        value = data.frequency;
        unit = 'treinos';
        color = Colors.success;
        break;
      case 'duration':
        value = Math.round(data.duration / 60); // Converter para horas
        unit = 'horas';
        color = Colors.warning;
        break;
      case 'volume':
      default:
        value = Math.round(data.volume / 1000); // Converter para toneladas
        unit = 'ton';
        color = Colors.primary;
        break;
    }

    return {
      value,
      label,
      frontColor: color,
      dataPointText: `${value}${unit === 'ton' ? 't' : unit === 'horas' ? 'h' : ''}`,
      textShiftY: -10,
      textColor: Colors.text,
      textFontSize: 10,
    };
  });

  const values = chartData.map(d => d.value);
  const maxValue = Math.max(...values);
  const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
  const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;

  // Títulos baseados no tipo
  const titles = {
    volume: 'Volume de Treino Semanal',
    frequency: 'Frequência de Treinos',
    duration: 'Duração dos Treinos'
  };

  const units = {
    volume: 'toneladas',
    frequency: 'treinos',
    duration: 'horas'
  };

  const displayTitle = title || titles[chartType];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{displayTitle}</Text>
      
      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Semanas</Text>
          <Text style={styles.statValue}>{sortedWeeks.length}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Média</Text>
          <Text style={styles.statValue}>{avgValue.toFixed(1)} {units[chartType]}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Máximo</Text>
          <Text style={styles.statValue}>{maxValue} {units[chartType]}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tendência</Text>
          <Text style={[styles.statValue, { 
            color: trend > 0 ? Colors.success : trend < 0 ? Colors.danger : Colors.text 
          }]}>
            {trend > 0 ? '↗️' : trend < 0 ? '↘️' : '➡️'}
          </Text>
        </View>
      </View>

      {/* Gráfico */}
      <View style={styles.chartContainer}>
        {chartType === 'frequency' ? (
          <BarChart
            data={chartData}
            width={width - 100}
            height={180}
            backgroundColor="transparent"
            barWidth={20}
            spacing={12}
            rulesType="solid"
            rulesColor={Colors.border}
            xAxisColor={Colors.border}
            yAxisColor={Colors.border}
            yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 9 }}
            maxValue={Math.ceil(maxValue * 1.2)}
            noOfSections={4}
            showReferenceLine1
            referenceLine1Config={{
              color: Colors.textSecondary,
              dashWidth: 1,
              dashGap: 2,
              labelText: `Média: ${avgValue.toFixed(1)}`,
              labelTextStyle: { color: Colors.textSecondary, fontSize: 9 },
            }}
            referenceLine1Position={avgValue}
          />
        ) : (
          <LineChart
            data={chartData}
            width={width - 100}
            height={180}
            backgroundColor="transparent"
            curved
            thickness={2}
            color={chartData[0]?.frontColor || Colors.primary}
            dataPointsColor={chartData[0]?.frontColor || Colors.primary}
            dataPointsRadius={4}
            rulesType="solid"
            rulesColor={Colors.border}
            xAxisColor={Colors.border}
            yAxisColor={Colors.border}
            yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 9 }}
            maxValue={Math.ceil(maxValue * 1.2)}
            noOfSections={4}
            spacing={Math.max(15, (width - 150) / Math.max(1, chartData.length - 1))}
            showReferenceLine1
            referenceLine1Config={{
              color: Colors.textSecondary,
              dashWidth: 1,
              dashGap: 2,
              labelText: `Média: ${avgValue.toFixed(1)}`,
              labelTextStyle: { color: Colors.textSecondary, fontSize: 9 },
            }}
            referenceLine1Position={avgValue}
            animateOnDataChange
            animationDuration={800}
            areaChart
            startFillColor={chartData[0]?.frontColor || Colors.primary}
            startOpacity={0.2}
            endFillColor={chartData[0]?.frontColor || Colors.primary}
            endOpacity={0.05}
          />
        )}
      </View>

      {/* Informações adicionais */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <View style={[styles.infoIndicator, { 
            backgroundColor: trend > 0 ? Colors.success : trend < 0 ? Colors.danger : Colors.border 
          }]} />
          <Text style={styles.infoText}>
            {trend > 0 ? 'Progresso crescente' : trend < 0 ? 'Progresso decrescente' : 'Progresso estável'} 
            {chartType === 'volume' && ' no volume de treino'}
            {chartType === 'frequency' && ' na frequência de treinos'}
            {chartType === 'duration' && ' na duração dos treinos'}
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
  infoContainer: {
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoText: {
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

export default WorkoutProgressChart;