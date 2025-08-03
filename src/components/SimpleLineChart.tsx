import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, FontSizes, Spacing } from '../constants/theme';

interface SimpleLineChartProps {
  data: {
    labels: string[];
    datasets: { data: number[] }[];
  };
  title?: string;
  height?: number;
  unit?: string;
}

const { width } = Dimensions.get('window');

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ 
  data, 
  title,
  height = 200,
  unit = ''
}) => {
  const maxValue = Math.max(...data.datasets[0].data, 1);
  const minValue = 0; // Always start from 0 for numeric data
  const range = maxValue - minValue || 1;
  
  // Calculate points for the line
  const points = data.datasets[0].data.map((value, index) => ({
    x: (index / (data.datasets[0].data.length - 1)) * 100,
    y: ((value - minValue) / range) * 100
  }));
  
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={[styles.chartContainer, { height }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{maxValue.toFixed(1)}{unit}</Text>
          <Text style={styles.yAxisLabel}>{(maxValue/2).toFixed(1)}{unit}</Text>
          <Text style={styles.yAxisLabel}>{minValue}{unit}</Text>
        </View>
        
        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          <View style={styles.gridLines}>
            <View style={[styles.gridLine, styles.topLine]} />
            <View style={[styles.gridLine, styles.middleLine]} />
            <View style={[styles.gridLine, styles.bottomLine]} />
          </View>
          
          {/* Line and points */}
          <View style={styles.lineContainer}>
            {/* Data points */}
            {points.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.dataPoint,
                  {
                    left: `${point.x}%`,
                    bottom: `${point.y}%`,
                  }
                ]}
              />
            ))}
            
            {/* Connecting lines */}
            {points.slice(0, -1).map((point, index) => {
              const nextPoint = points[index + 1];
              const length = Math.sqrt(
                Math.pow((nextPoint.x - point.x) * (width * 0.8) / 100, 2) +
                Math.pow((nextPoint.y - point.y) * height / 100, 2)
              );
              const angle = Math.atan2(
                (nextPoint.y - point.y) * height / 100,
                (nextPoint.x - point.x) * (width * 0.8) / 100
              ) * 180 / Math.PI;
              
              return (
                <View
                  key={`line-${index}`}
                  style={[
                    styles.lineSegment,
                    {
                      left: `${point.x}%`,
                      bottom: `${point.y}%`,
                      width: length,
                      transform: [{ rotate: `${angle}deg` }],
                    }
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>
      
      {/* X-axis labels */}
      <View style={styles.xAxisContainer}>
        <View style={styles.xAxisSpacer} />
        <View style={styles.xAxisLabels}>
          {data.labels.map((label, index) => (
            <Text key={index} style={styles.xAxisLabel}>{label}</Text>
          ))}
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
    width: 40,
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
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dataPoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginLeft: -3,
    marginBottom: -3,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: Colors.primary,
    transformOrigin: '0 50%',
  },
  xAxisContainer: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  xAxisSpacer: {
    width: 40,
  },
  xAxisLabels: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
  },
  xAxisLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default SimpleLineChart;