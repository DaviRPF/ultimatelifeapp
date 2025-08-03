import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, FontSizes, Spacing } from '../constants/theme';

interface SimpleBarChartProps {
  data: {
    labels: string[];
    datasets: { data: number[] }[];
  };
  title?: string;
  height?: number;
}

const { width } = Dimensions.get('window');

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ 
  data, 
  title,
  height = 200 
}) => {
  const maxValue = Math.max(...data.datasets[0].data, 1);
  const minValue = Math.min(...data.datasets[0].data, -1);
  const range = maxValue - minValue || 1;
  
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={[styles.chartContainer, { height }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{maxValue}</Text>
          <Text style={styles.yAxisLabel}>0</Text>
          <Text style={styles.yAxisLabel}>{minValue}</Text>
        </View>
        
        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          <View style={styles.gridLines}>
            <View style={[styles.gridLine, styles.topLine]} />
            <View style={[styles.gridLine, styles.middleLine]} />
            <View style={[styles.gridLine, styles.bottomLine]} />
          </View>
          
          {/* Bars */}
          <View style={styles.barsContainer}>
            {data.datasets[0].data.map((value, index) => {
              const normalizedValue = (value - minValue) / range;
              const barHeight = Math.abs(normalizedValue) * (height * 0.8);
              const isPositive = value >= 0;
              const zeroLine = ((0 - minValue) / range) * (height * 0.8);
              
              return (
                <View key={index} style={styles.barColumn}>
                  <View 
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: value > 0 ? Colors.success : value < 0 ? Colors.danger : Colors.border,
                        bottom: isPositive ? zeroLine : zeroLine - barHeight,
                      }
                    ]} 
                  />
                  <Text style={styles.barLabel}>{data.labels[index]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Sucesso (+1)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.danger }]} />
          <Text style={styles.legendText}>Falha (-1)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.border }]} />
          <Text style={styles.legendText}>Sem ação (0)</Text>
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
    marginVertical: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: Spacing.xs,
  },
  yAxisLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.3,
  },
  topLine: {},
  middleLine: {},
  bottomLine: {},
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    position: 'relative',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    height: '100%',
  },
  bar: {
    width: '60%',
    position: 'absolute',
    borderRadius: 2,
  },
  barLabel: {
    position: 'absolute',
    bottom: -20,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.lg,
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
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FontSizes.xs,
    color: Colors.text,
  },
});

export default SimpleBarChart;