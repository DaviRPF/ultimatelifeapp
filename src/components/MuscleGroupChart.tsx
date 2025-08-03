import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { Workout } from '../types';

interface MuscleGroupChartProps {
  workouts: Workout[];
  title?: string;
}

const { width } = Dimensions.get('window');

const MuscleGroupChart: React.FC<MuscleGroupChartProps> = ({ workouts, title = 'Análise por Grupo Muscular' }) => {
  if (workouts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nenhum treino registrado</Text>
        <Text style={styles.emptySubtext}>Adicione treinos para ver a análise por grupo muscular!</Text>
      </View>
    );
  }

  // Mapear grupos musculares dos exercícios
  const muscleGroupMapping: Record<string, string> = {
    // Peito
    'Supino': 'Peito',
    'Supino Inclinado': 'Peito', 
    'Crucifixo': 'Peito',
    'Flexão': 'Peito',
    'Supino Declinado': 'Peito',
    'Fly': 'Peito',
    
    // Costas
    'Puxada': 'Costas',
    'Remada': 'Costas',
    'Barra Fixa': 'Costas',
    'Pulley': 'Costas',
    'Levantamento Terra': 'Costas',
    'Remada Curvada': 'Costas',
    
    // Pernas
    'Agachamento': 'Pernas',
    'Leg Press': 'Pernas',
    'Extensora': 'Pernas',
    'Flexora': 'Pernas',
    'Cadeira Extensora': 'Pernas',
    'Mesa Flexora': 'Pernas',
    'Afundo': 'Pernas',
    'Stiff': 'Pernas',
    
    // Ombros
    'Desenvolvimento': 'Ombros',
    'Elevação Lateral': 'Ombros',
    'Elevação Frontal': 'Ombros',
    'Encolhimento': 'Ombros',
    'Arnold Press': 'Ombros',
    
    // Braços
    'Rosca': 'Braços',
    'Tríceps': 'Braços',
    'Francesa': 'Braços',
    'Mergulho': 'Braços',
    'Martelo': 'Braços',
    'Corda': 'Braços'
  };

  // Contar exercícios por grupo muscular
  const muscleGroupCounts: Record<string, number> = {};
  
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      // Tentar encontrar o grupo muscular baseado no nome do exercício
      let muscleGroup = 'Outros';
      
      for (const [keyword, group] of Object.entries(muscleGroupMapping)) {
        if (exercise.exerciseName.toLowerCase().includes(keyword.toLowerCase())) {
          muscleGroup = group;
          break;
        }
      }
      
      // Contar o número de séries para dar peso ao grupo muscular
      const setsCount = exercise.sets.length;
      muscleGroupCounts[muscleGroup] = (muscleGroupCounts[muscleGroup] || 0) + setsCount;
    });
  });

  // Converter para formato do gráfico
  const colors = [Colors.primary, Colors.success, Colors.warning, Colors.danger, Colors.info, Colors.accent];
  const chartData = Object.entries(muscleGroupCounts)
    .sort(([,a], [,b]) => b - a) // Ordenar por quantidade
    .map(([group, count], index) => ({
      value: count,
      label: group,
      frontColor: colors[index % colors.length],
      labelTextStyle: { fontSize: 12, color: Colors.text },
    }));

  const totalSets = chartData.reduce((sum, item) => sum + item.value, 0);

  const renderLegendItem = (item: any, index: number) => (
    <View key={index} style={styles.legendItem}>
      <View style={[styles.legendColor, { backgroundColor: item.frontColor }]} />
      <Text style={styles.legendText}>
        {item.label}: {item.value} séries ({((item.value / totalSets) * 100).toFixed(1)}%)
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {/* Estatísticas gerais */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workouts.length}</Text>
          <Text style={styles.statLabel}>Treinos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalSets}</Text>
          <Text style={styles.statLabel}>Total de Séries</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Object.keys(muscleGroupCounts).length}</Text>
          <Text style={styles.statLabel}>Grupos Musculares</Text>
        </View>
      </View>

      {/* Gráfico de barras horizontal */}
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={width - 100}
          height={Math.min(180, chartData.length * 35)}
          backgroundColor="transparent"
          horizontal
          barWidth={25}
          spacing={8}
          rulesType="solid"
          rulesColor={Colors.border}
          xAxisColor={Colors.border}
          yAxisColor={Colors.border}
          yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 9 }}
          xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 9 }}
          maxValue={Math.max(...chartData.map(d => d.value)) * 1.1}
          noOfSections={3}
          showReferenceLine1
          referenceLine1Config={{
            color: Colors.textSecondary,
            dashWidth: 1,
            dashGap: 2,
          }}
          referenceLine1Position={totalSets / chartData.length}
        />
      </View>

      {/* Legenda */}
      <View style={styles.legendContainer}>
        {chartData.map(renderLegendItem)}
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
  legendContainer: {
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
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

export default MuscleGroupChart;