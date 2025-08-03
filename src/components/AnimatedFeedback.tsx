import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Animated, 
  StyleSheet, 
  Dimensions,
  Text 
} from 'react-native';
import { Colors, FontSizes } from '../constants/theme';

interface AnimatedFeedbackProps {
  visible: boolean;
  type: 'taskComplete' | 'levelUp' | 'xpGain';
  onComplete?: () => void;
  xpAmount?: number;
  message?: string;
}

const { width, height } = Dimensions.get('window');

const AnimatedFeedback: React.FC<AnimatedFeedbackProps> = ({
  visible,
  type,
  onComplete,
  xpAmount = 0,
  message = ''
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      slideAnim.setValue(50);
      rotateAnim.setValue(0);

      // Start animation sequence
      Animated.sequence([
        // Flash in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Hold
        Animated.delay(type === 'levelUp' ? 1500 : 800),
        // Fade out
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onComplete?.();
      });

      // Rotation for celebration
      if (type === 'levelUp') {
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [visible, type]);

  if (!visible) return null;

  const renderContent = () => {
    switch (type) {
      case 'taskComplete':
        return (
          <View style={styles.taskCompleteContainer}>
            <Text style={styles.checkmark}>✅</Text>
            <Text style={styles.taskCompleteText}>Task Complete!</Text>
            {xpAmount > 0 && (
              <Text style={styles.xpText}>+{xpAmount} XP</Text>
            )}
          </View>
        );

      case 'levelUp':
        return (
          <View style={styles.levelUpContainer}>
            <Animated.View
              style={[
                styles.levelUpContent,
                {
                  transform: [{
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  }],
                },
              ]}
            >
              <Text style={styles.levelUpIcon}>🌟</Text>
            </Animated.View>
            <Text style={styles.levelUpText}>LEVEL UP!</Text>
            {message && (
              <Text style={styles.levelUpSubtext}>{message}</Text>
            )}
          </View>
        );

      case 'xpGain':
        return (
          <View style={styles.xpGainContainer}>
            <Text style={styles.xpGainText}>+{xpAmount} XP</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
      ]}
      pointerEvents="none"
    >
      {type === 'taskComplete' && <FlashOverlay opacity={fadeAnim} />}
      {renderContent()}
      {type === 'levelUp' && <Confetti />}
    </Animated.View>
  );
};

// Flash overlay for task completion
const FlashOverlay: React.FC<{ opacity: Animated.Value }> = ({ opacity }) => (
  <Animated.View
    style={[
      styles.flashOverlay,
      {
        opacity: opacity.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.3],
        }),
      },
    ]}
  />
);

// Confetti animation for level up
const Confetti: React.FC = () => {
  const confettiAnimations = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const animations = confettiAnimations.map((confetti) =>
      Animated.parallel([
        Animated.timing(confetti.y, {
          toValue: height + 50,
          duration: 3000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(confetti.rotation, {
          toValue: Math.random() > 0.5 ? 360 : -360,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.stagger(100, animations).start();
  }, []);

  return (
    <View style={styles.confettiContainer}>
      {confettiAnimations.map((confetti, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confettiPiece,
            {
              transform: [
                { translateX: confetti.x },
                { translateY: confetti.y },
                {
                  rotate: confetti.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.confettiEmoji}>
            {['🎉', '✨', '🌟', '💫', '⭐'][index % 5]}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.success,
  },
  taskCompleteContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  checkmark: {
    fontSize: 60,
    marginBottom: 10,
  },
  taskCompleteText: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.success,
    marginBottom: 8,
  },
  xpText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.xp,
  },
  levelUpContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    borderRadius: 25,
    padding: 30,
    borderWidth: 3,
    borderColor: Colors.gold,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  levelUpContent: {
    marginBottom: 15,
  },
  levelUpIcon: {
    fontSize: 80,
    textAlign: 'center',
  },
  levelUpText: {
    fontSize: FontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  levelUpSubtext: {
    fontSize: FontSizes.md,
    color: Colors.textDark,
    textAlign: 'center',
    fontWeight: '600',
  },
  xpGainContainer: {
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: Colors.xp,
  },
  xpGainText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.textLight,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiPiece: {
    position: 'absolute',
  },
  confettiEmoji: {
    fontSize: 20,
  },
});

export default AnimatedFeedback;