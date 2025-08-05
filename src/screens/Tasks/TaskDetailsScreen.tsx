import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { Colors, FontSizes, Spacing } from '../../constants/theme';
import { Task, RootStackParamList, BinaryTaskEntry, NumericTaskEntry } from '../../types';
import StorageService from '../../services/StorageService';
import HeatmapCalendar from '../../components/HeatmapCalendar';

type TaskDetailsScreenRouteProp = RouteProp<RootStackParamList, 'TaskDetails'>;
type TaskDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TaskDetails'>;

const { width } = Dimensions.get('window');
const chartConfig = {
  backgroundColor: Colors.surface,
  backgroundGradientFrom: Colors.surface,
  backgroundGradientTo: Colors.background,
  backgroundGradientFromOpacity: 0.1,
  backgroundGradientToOpacity: 0.3,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => Colors.text,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: Colors.primary,
    fill: Colors.primary,
  },
  propsForBackgroundLines: {
    strokeDasharray: '', // solid background lines
    stroke: Colors.border,
    strokeWidth: 1,
    strokeOpacity: 0.3,
  },
  useShadowColorFromDataset: false,
  fillShadowGradient: Colors.primary,
  fillShadowGradientOpacity: 0.2,
};

const TaskDetailsScreen: React.FC = () => {
  const route = useRoute<TaskDetailsScreenRouteProp>();
  const navigation = useNavigation<TaskDetailsScreenNavigationProp>();
  const { taskId } = route.params;

  const [task, setTask] = useState<Task | null>(null);
  const [binaryHistory, setBinaryHistory] = useState<BinaryTaskEntry[]>([]);
  const [numericHistory, setNumericHistory] = useState<NumericTaskEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const storageService = StorageService.getInstance();

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  useEffect(() => {
    loadTaskDetails();
  }, [taskId]);

  const loadTaskDetails = async () => {
    try {
      setLoading(true);
      await storageService.initializeAppData();
      
      const taskData = storageService.getTaskById(taskId);
      if (!taskData) {
        Alert.alert('Error', 'Task not found');
        navigation.goBack();
        return;
      }

      const history = storageService.getTaskHistory(taskId);
      
      
      setTask(taskData);
      setBinaryHistory(history.binary.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setNumericHistory(history.numeric.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (error) {
      console.error('Error loading task details:', error);
      Alert.alert('Error', 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = () => {
    navigation.navigate('EditTask', { taskId });
  };

  const handleDeleteTask = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteTask(taskId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  // Função auxiliar para normalizar datas (YYYY-MM-DD)
  const normalizeDate = (date: string | Date) => {
    if (typeof date === 'string') {
      return date.split('T')[0]; // Remove time part if exists
    }
    return date.toISOString().split('T')[0];
  };

  const getStreakData = () => {
    if (task?.taskType === 'binary') {
      const last7Days = getLast7Days();
      // Normalize dates in binary history for comparison
      const normalizedHistory = binaryHistory.map(entry => ({
        ...entry,
        normalizedDate: normalizeDate(entry.date)
      }));
      
      const chartData = last7Days.map((date, index) => {
        // Find ALL entries for this date, not just the first one
        const dayEntries = normalizedHistory.filter(h => h.normalizedDate === date);
        
        // Calculate net score for the day (completed = +1, failed = -1)
        const dayScore = dayEntries.reduce((score, entry) => {
          return score + (entry.status === 'completed' ? 1 : entry.status === 'failed' ? -1 : 0);
        }, 0);
        
        const day = new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' });
        
        return {
          value: dayScore,
          label: day.charAt(0).toUpperCase() + day.slice(1),
          frontColor: dayScore > 0 ? Colors.success : dayScore < 0 ? Colors.danger : Colors.border,
          topLabelComponent: () => (
            <Text style={{ fontSize: 10, color: Colors.text, textAlign: 'center' }}>
              {dayScore > 0 ? `+${dayScore}` : dayScore < 0 ? `${dayScore}` : '0'}
            </Text>
          ),
        };
      });
      
      // Se todos os valores são 0 ou não há dados históricos, mostrar dados de exemplo
      const hasAnyData = chartData.some(item => item.value !== 0);
      if (binaryHistory.length === 0 || !hasAnyData) {
        return last7Days.map((date, index) => {
          const day = new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' });
          const exampleValue = index % 3 === 0 ? 1 : index % 4 === 0 ? -1 : 0; // Dados de exemplo
          
          return {
            value: exampleValue,
            label: day.charAt(0).toUpperCase() + day.slice(1),
            frontColor: exampleValue > 0 ? Colors.success : exampleValue < 0 ? Colors.danger : Colors.border,
            topLabelComponent: () => (
              <Text style={{ fontSize: 10, color: Colors.textSecondary, textAlign: 'center' }}>
                {exampleValue > 0 ? '+1' : exampleValue < 0 ? '-1' : '0'}
              </Text>
            ),
          };
        });
      }
      
      return chartData;
    }
    return [];
  };

  const getNumericProgressData = () => {
    if (task?.taskType === 'numeric') {
      const last7Days = getLast7Days();
      const dailyTotals = new Map();
      
      // Initialize all days with 0
      last7Days.forEach(date => dailyTotals.set(date, 0));
      
      // Sum up values for each day with better date matching
      numericHistory.forEach(entry => {
        const entryDate = normalizeDate(entry.date);
        if (last7Days.includes(entryDate) || last7Days.includes(entry.date)) {
          const targetDate = last7Days.includes(entryDate) ? entryDate : entry.date;
          const existing = dailyTotals.get(targetDate) || 0;
          dailyTotals.set(targetDate, existing + entry.value);
        }
      });

      const chartData = last7Days.map((date, index) => {
        const value = dailyTotals.get(date) || 0;
        const day = new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' });
        const minimumTarget = task?.numericConfig?.minimumTarget || 0;
        
        return {
          value,
          label: day.charAt(0).toUpperCase() + day.slice(1),
          dataPointColor: value >= minimumTarget ? Colors.success : Colors.warning,
          hideDataPoint: false,
        };
      });
      
      // Se não há dados históricos ou todos são zero, mostrar dados de exemplo
      const hasAnyData = chartData.some(item => item.value > 0);
      if (numericHistory.length === 0 || !hasAnyData) {
        const minimumTarget = task?.numericConfig?.minimumTarget || 10;
        return last7Days.map((date, index) => {
          const day = new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' });
          const exampleValue = Math.floor(Math.random() * (minimumTarget * 2)) + index * 2; // Dados de exemplo
          
          return {
            value: exampleValue,
            label: day.charAt(0).toUpperCase() + day.slice(1),
            dataPointColor: exampleValue >= minimumTarget ? Colors.success : Colors.warning,
            hideDataPoint: false,
          };
        });
      }
      
      return chartData;
    }
    return [];
  };

  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const getSuccessRate = () => {
    if (binaryHistory.length === 0) return 0;
    const completedCount = binaryHistory.filter(h => h.status === 'completed').length;
    return Math.round((completedCount / binaryHistory.length) * 100);
  };

  const getTotalXP = () => {
    return binaryHistory.reduce((total, entry) => total + (entry.xpGained || 0), 0);
  };

  const getCurrentStreak = () => {
    let streak = 0;
    const sortedHistory = [...binaryHistory].reverse();
    
    for (const entry of sortedHistory) {
      if (entry.status === 'completed') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Prepare heatmap data
  const getHeatmapData = () => {
    const heatmapData: { date: string; value: number; status?: 'completed' | 'failed' | 'partial' | 'none'; count?: number }[] = [];
    
    console.log('🔍 Preparing heatmap data for task:', task?.title);
    console.log('🔍 Binary history entries:', binaryHistory.length);
    console.log('🔍 Numeric history entries:', numericHistory.length);
    
    if (task?.taskType === 'binary') {
      // Group binary entries by date
      const dailyEntries = new Map<string, { completed: number; failed: number }>();
      
      binaryHistory.forEach(entry => {
        const date = normalizeDate(entry.date);
        const existing = dailyEntries.get(date) || { completed: 0, failed: 0 };
        
        console.log('🔍 Processing binary entry:', { date, status: entry.status, originalDate: entry.date });
        
        if (entry.status === 'completed') {
          existing.completed++;
        } else if (entry.status === 'failed') {
          existing.failed++;
        }
        
        dailyEntries.set(date, existing);
      });
      
      console.log('🔍 Daily entries map:', Array.from(dailyEntries.entries()));
      
      // Convert to heatmap format
      dailyEntries.forEach((stats, date) => {
        const netScore = stats.completed - stats.failed;
        const totalCount = stats.completed + stats.failed;
        
        let status: 'completed' | 'failed' | 'partial' | 'none' = 'none';
        let value = 0;
        
        if (stats.completed > stats.failed) {
          status = 'completed';
          value = stats.completed;
        } else if (stats.failed > stats.completed) {
          status = 'failed';
          value = stats.failed;
        } else if (totalCount > 0) {
          status = 'partial';
          value = totalCount;
        }
        
        heatmapData.push({
          date,
          value,
          status,
          count: totalCount
        });
      });
    } else if (task?.taskType === 'numeric') {
      // Group numeric entries by date
      const dailyTotals = new Map<string, number>();
      
      numericHistory.forEach(entry => {
        const date = normalizeDate(entry.date);
        const existing = dailyTotals.get(date) || 0;
        dailyTotals.set(date, existing + entry.value);
        
        console.log('🔍 Processing numeric entry:', { date, value: entry.value, total: existing + entry.value });
      });
      
      // Convert to heatmap format
      const minimumTarget = task?.numericConfig?.minimumTarget || 1;
      dailyTotals.forEach((total, date) => {
        let status: 'completed' | 'failed' | 'partial' | 'none' = 'none';
        let value = 0;
        
        if (total >= minimumTarget) {
          status = 'completed';
          value = Math.min(4, Math.ceil(total / minimumTarget));
        } else if (total > 0) {
          status = 'partial';
          value = 1;
        }
        
        heatmapData.push({
          date,
          value,
          status,
          count: total
        });
      });
    }
    
    console.log('🔍 Final heatmap data:', heatmapData.length, 'entries');
    return heatmapData;
  };

  const handleDayPress = (dayData: { date: string; value: number; status?: string; count?: number }) => {
    const date = new Date(dayData.date).toLocaleDateString('pt-BR');
    const statusText = dayData.status === 'completed' ? 'Sucesso' : 
                     dayData.status === 'failed' ? 'Falhou' : 
                     dayData.status === 'partial' ? 'Parcial' : 
                     'Sem atividade';
    
    const message = task?.taskType === 'binary' 
      ? `${date}\nStatus: ${statusText}\nExecuções: ${dayData.count || 0}`
      : `${date}\nStatus: ${statusText}\nValor: ${dayData.count || 0} ${task?.numericConfig?.unit || ''}`;
    
    Alert.alert('Detalhes do Dia', message);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEditTask} style={styles.actionButton}>
            <Ionicons name="pencil" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteTask} style={styles.actionButton}>
            <Ionicons name="trash" size={20} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.title}>{task?.title}</Text>
      <Text style={styles.description}>{task?.description}</Text>
      
      <View style={styles.taskType}>
        <Ionicons 
          name={task?.taskType === 'numeric' ? 'stats-chart' : 'checkbox'} 
          size={16} 
          color={Colors.primary} 
        />
        <Text style={styles.taskTypeText}>
          {task?.taskType === 'numeric' ? 'Numérica' : 'Binária'}
        </Text>
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>📊 Estatísticas</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{binaryHistory.length}</Text>
          <Text style={styles.statLabel}>Total Execuções</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{getSuccessRate()}%</Text>
          <Text style={styles.statLabel}>Taxa de Sucesso</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.warning }]}>{getCurrentStreak()}</Text>
          <Text style={styles.statLabel}>Streak Atual</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.gold }]}>{getTotalXP()}</Text>
          <Text style={styles.statLabel}>XP Total</Text>
        </View>
      </View>
    </View>
  );

  const renderBinaryChart = () => {
    const streakData = getStreakData();
    const hasRealData = binaryHistory.length > 0 && streakData.some(item => item.value !== 0);
    
    if (streakData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Nenhum dado ainda</Text>
          <Text style={styles.noDataSubtext}>Complete ou falhe esta task para ver gráficos</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          Últimos 7 dias - Performance {!hasRealData && '(Exemplo)'}
        </Text>
        <BarChart
          data={streakData}
          width={width - 80}
          height={180}
          backgroundColor="transparent"
          barWidth={25}
          spacing={15}
          rulesType="solid"
          rulesColor={Colors.border}
          xAxisColor={Colors.border}
          yAxisColor={Colors.border}
          yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
          noOfSections={4}
          maxValue={Math.max(...streakData.map(d => d.value), 5)}
          stepValue={1}
          showReferenceLine1
          referenceLine1Config={{
            color: Colors.border,
            dashWidth: 1,
            dashGap: 2,
          }}
          referenceLine1Position={0}
        />
        
        {!hasRealData && (
          <Text style={styles.exampleText}>
            Execute esta task para ver dados reais aqui
          </Text>
        )}
        
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>Score Positivo (mais sucessos)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Colors.danger }]} />
            <Text style={styles.legendText}>Score Negativo (mais falhas)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Colors.border }]} />
            <Text style={styles.legendText}>Neutro (empate ou sem ação)</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderNumericChart = () => {
    const progressData = getNumericProgressData();
    const hasRealData = numericHistory.length > 0 && progressData.some(item => item.value > 0);
    
    if (progressData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Nenhum dado ainda</Text>
          <Text style={styles.noDataSubtext}>Registre valores para ver gráficos</Text>
        </View>
      );
    }
    
    const maxValue = Math.max(...progressData.map(d => d.value), task?.numericConfig?.minimumTarget || 0);
    const minimumTarget = task?.numericConfig?.minimumTarget || 0;
    
    return (
      <View>
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            Últimos 7 dias - {task?.numericConfig?.unit ? task.numericConfig.unit : 'Progresso'} {!hasRealData && '(Exemplo)'}
          </Text>
          <LineChart
            data={progressData}
            width={width - 80}
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
            xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
            maxValue={maxValue * 1.1}
            noOfSections={4}
            spacing={Math.max(15, (width - 120) / Math.max(1, progressData.length - 1))}
            showReferenceLine1={minimumTarget > 0}
            referenceLine1Config={{
              color: Colors.warning,
              dashWidth: 2,
              dashGap: 2,
              labelText: `Meta: ${minimumTarget}${task?.numericConfig?.unit || ''}`,
              labelTextStyle: { color: Colors.warning, fontSize: 9 },
            }}
            referenceLine1Position={minimumTarget}
            animateOnDataChange
            animationDuration={800}
          />
          
          {!hasRealData && (
            <Text style={styles.exampleText}>
              Execute esta task para ver dados reais aqui
            </Text>
          )}
        </View>
        
        {task?.numericConfig && (
          <View style={styles.numericInfo}>
            <View style={styles.targetInfo}>
              <View style={styles.targetItem}>
                <View style={[styles.targetIndicator, { backgroundColor: Colors.warning }]} />
                <Text style={styles.numericInfoText}>
                  Meta mínima: {task.numericConfig.minimumTarget} {task.numericConfig.unit}
                </Text>
              </View>
              {task.numericConfig.dailyTarget && (
                <View style={styles.targetItem}>
                  <View style={[styles.targetIndicator, { backgroundColor: Colors.success }]} />
                  <Text style={styles.numericInfoText}>
                    Meta diária: {task.numericConfig.dailyTarget} {task.numericConfig.unit}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderHeatmap = () => {
    const heatmapData = getHeatmapData();
    
    return (
      <View style={styles.heatmapSection}>
        <Text style={styles.sectionTitle}>🗓️ Últimos 90 dias</Text>
        <HeatmapCalendar
          data={heatmapData}
          title={`${task?.title || 'Task'}`}
          onDayPress={handleDayPress}
        />
        <Text style={styles.heatmapInfoText}>
          Toque em um quadrado para ver detalhes do dia
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Task não encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {renderHeader()}
      {renderStats()}
      
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>📈 Evolução</Text>
        {task.taskType === 'binary' ? renderBinaryChart() : renderNumericChart()}
      </View>
      
      {renderHeatmap()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  taskType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  taskTypeText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsContainer: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  chartSection: {
    padding: Spacing.lg,
  },
  heatmapSection: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  heatmapInfoText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartTitle: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  chart: {
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  numericInfo: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  targetInfo: {
    gap: Spacing.sm,
  },
  targetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  targetIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  numericInfoText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  noDataText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  noDataSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  exampleText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.lg,
    color: Colors.text,
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.danger,
  },
});

export default TaskDetailsScreen;