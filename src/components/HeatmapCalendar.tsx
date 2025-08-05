import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Colors, FontSizes, Spacing } from '../constants/theme';

const { width } = Dimensions.get('window');

interface HeatmapData {
  date: string;
  value: number;
  status?: 'completed' | 'failed' | 'partial' | 'none';
  count?: number;
}

interface HeatmapCalendarProps {
  data: HeatmapData[];
  title?: string;
  onDayPress?: (day: HeatmapData) => void;
}

const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  data,
  title = 'Histórico de Atividade',
  onDayPress,
}) => {
  
  // Get last 90 days (more manageable than 365)
  const getLast90Days = (): string[] => {
    const days: string[] = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  };

  // Get color for a day based on its value/status
  const getDayColor = (dayData: HeatmapData | undefined): string => {
    if (!dayData || dayData.value === 0) {
      return Colors.border + '40'; // Very light gray
    }

    if (dayData.status === 'completed') {
      return Colors.success;
    }
    
    if (dayData.status === 'failed') {
      return Colors.danger;
    }

    if (dayData.status === 'partial') {
      return Colors.warning;
    }

    // For numeric values, use intensity scale
    if (dayData.value <= 1) return Colors.primary + '60';
    if (dayData.value <= 3) return Colors.primary + '80';
    return Colors.primary;
  };

  // Create data map for quick lookup
  const dataMap = new Map<string, HeatmapData>();
  data.forEach(item => {
    dataMap.set(item.date, item);
  });

  const allDays = getLast90Days();
  
  // Calculate grid dimensions
  const cellSize = 12;
  const cellSpacing = 3;
  const daysPerRow = 10; // 10 weeks worth of data for better fit
  const totalRows = Math.ceil(allDays.length / daysPerRow);

  // Group days into rows
  const rows: string[][] = [];
  for (let i = 0; i < allDays.length; i += daysPerRow) {
    rows.push(allDays.slice(i, i + daysPerRow));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.heatmapContainer}>
        <View style={styles.heatmapGrid}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.heatmapRow}>
              {row.map((day, dayIndex) => {
                const dayData = dataMap.get(day);
                const dayColor = getDayColor(dayData);
                
                return (
                  <TouchableOpacity
                    key={`${rowIndex}-${dayIndex}`}
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: dayColor,
                        width: cellSize,
                        height: cellSize,
                      }
                    ]}
                    onPress={() => {
                      if (dayData && onDayPress) {
                        onDayPress(dayData);
                      }
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendText}>Menos</Text>
        <View style={styles.legendScale}>
          <View style={[styles.legendItem, { backgroundColor: Colors.border + '40' }]} />
          <View style={[styles.legendItem, { backgroundColor: Colors.primary + '60' }]} />
          <View style={[styles.legendItem, { backgroundColor: Colors.primary + '80' }]} />
          <View style={[styles.legendItem, { backgroundColor: Colors.primary }]} />
        </View>
        <Text style={styles.legendText}>Mais</Text>
      </View>
      
      {/* Status Legend */}
      <View style={styles.statusLegend}>
        <View style={styles.statusItem}>
          <View style={[styles.statusColor, { backgroundColor: Colors.success }]} />
          <Text style={styles.statusText}>Sucesso</Text>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.statusColor, { backgroundColor: Colors.warning }]} />
          <Text style={styles.statusText}>Parcial</Text>
        </View>
        <View style={styles.statusItem}>
          <View style={[styles.statusColor, { backgroundColor: Colors.danger }]} />
          <Text style={styles.statusText}>Falha</Text>
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  heatmapContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  heatmapGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dayCell: {
    borderRadius: 1,
    marginRight: 2,
    borderWidth: 0.5,
    borderColor: Colors.border + '20',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.xs,
  },
  legendScale: {
    flexDirection: 'row',
    gap: 2,
  },
  legendItem: {
    width: 8,
    height: 8,
    borderRadius: 1,
  },
  statusLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusColor: {
    width: 8,
    height: 8,
    borderRadius: 1,
    marginRight: 4,
  },
  statusText: {
    fontSize: 9,
    color: Colors.textSecondary,
  },
});

export default HeatmapCalendar;