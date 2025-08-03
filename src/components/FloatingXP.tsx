import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes } from '../constants/theme';

interface FloatingXPProps {
  xp: number;
  startX: number;
  startY: number;
  visible: boolean;
  onComplete?: () => void;
}

const FloatingXP: React.FC<FloatingXPProps> = ({
  xp,
  startX,
  startY,
  visible,
  onComplete
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      // Reset values
      translateY.setValue(0);
      opacity.setValue(0);
      scale.setValue(0.5);

      // Start animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(800),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onComplete?.();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: startY - 20,
          transform: [
            { translateX: startX - 30 }, // Center the text
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      <Text style={styles.xpText}>+{xp} XP</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  xpText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.xp,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    minWidth: 60,
  },
});

export default FloatingXP;