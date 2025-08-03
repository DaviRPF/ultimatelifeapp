import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import TaskCard from './TaskCard';
import { Task } from '../types';

interface AnimatedTaskCardProps {
  task: Task;
  onComplete?: (taskId: string) => void;
  onFail?: (taskId: string) => void;
  onPress?: (task: Task) => void;
  onAnimationComplete?: () => void;
}

const AnimatedTaskCard: React.FC<AnimatedTaskCardProps> = ({
  task,
  onComplete,
  onFail,
  onPress,
  onAnimationComplete
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = (taskId: string) => {
    if (!onComplete) return;
    
    setIsCompleting(true);
    
    // Animação de conclusão
    Animated.sequence([
      // Bounce effect
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        tension: 300,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 7,
        useNativeDriver: true,
      }),
      // Slight rotation + fade
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete(taskId);
      onAnimationComplete?.();
    });
  };

  const handleFail = (taskId: string) => {
    if (!onFail) return;
    
    // Shake animation for failure
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 0.02,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: -0.02,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0.02,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFail(taskId);
    });
  };

  // Reset animation when task changes
  useEffect(() => {
    if (!task.completed && !task.failed) {
      setIsCompleting(false);
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [task.completed, task.failed]);

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          {
            rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '5deg'],
            }),
          },
        ],
        opacity: opacityAnim,
      }}
    >
      <TaskCard
        task={task}
        onComplete={handleComplete}
        onFail={handleFail}
        onPress={onPress}
      />
    </Animated.View>
  );
};

export default AnimatedTaskCard;