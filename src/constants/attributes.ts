import { AttributeDescription } from '../types';

export const DIFFICULTY_DESCRIPTIONS: AttributeDescription[] = [
  { value: 10, label: 'Trivial', description: 'effortless, undemanding of attention' },
  { value: 20, label: 'Beginner', description: 'welcoming to one who has never done this before' },
  { value: 30, label: 'Breeze', description: 'requiring attention but generally quick and simple' },
  { value: 40, label: 'Easy', description: 'challenging to someone just learning, but not intimidating' },
  { value: 50, label: 'Medium', description: 'requiring moderate effort and attention; somewhat intimidating to beginners' },
  { value: 60, label: 'Hard', description: 'unwelcoming to beginners and challenging even to the well-practiced' },
  { value: 70, label: 'Challenge', description: 'may overwhelm even the very well-practiced' },
  { value: 80, label: 'Expert', description: 'demanding very high familiarity and intense focus' },
  { value: 90, label: 'Extreme', description: 'may overwhelm even experts' },
  { value: 100, label: 'Transformational', description: 'will change a person from the inside out' }
];

export const IMPORTANCE_DESCRIPTIONS: AttributeDescription[] = [
  { value: 10, label: 'Optional', description: 'unnecessary but desired' },
  { value: 20, label: 'Non-urgent', description: 'necessary, but failure unlikely to cause significant impact' },
  { value: 30, label: 'Free', description: 'necessary, but can be completed at any time' },
  { value: 40, label: 'Low', description: 'lowest tier of tasks to be accomplished in specific time-frames' },
  { value: 50, label: 'Middle', description: 'middle tier of time-sensitive tasks' },
  { value: 60, label: 'High', description: 'uppermost tier of time-sensitive tasks' },
  { value: 70, label: 'Major', description: 'demanding longer-term attention than High Urgency items' },
  { value: 80, label: 'Superlative', description: 'may completely displace even High Urgency items' },
  { value: 90, label: 'Immediate', description: 'to be accomplished ASAP even at expense of extremely high priority tasks' },
  { value: 100, label: 'Critical', description: 'genuine life-or-death stakes' }
];

export const FEAR_DESCRIPTIONS: AttributeDescription[] = [
  { value: 10, label: 'Negligible', description: 'aversion may be completely unnoticed' },
  { value: 20, label: 'Eustress', description: 'just enough "pull" to feel good or productive' },
  { value: 30, label: 'Excitement', description: 'non-threatening but interesting' },
  { value: 40, label: 'Jitters', description: 'manageable nervousness about undertaking the task' },
  { value: 50, label: 'Moderate', description: 'pervasive or chronic, but low-key anxiety about the task' },
  { value: 60, label: 'Worry', description: 'middle-tier chronic anxiety, sleep may be affected' },
  { value: 70, label: 'Gloom', description: 'upper-tier chronic anxiety, almost all aspects of life impacted' },
  { value: 80, label: 'Obsession', description: 'intense chronic anxiety, all/most thinking centered on task' },
  { value: 90, label: 'Dread', description: 'aversion and anxiety approaching fight-or-flight response' },
  { value: 100, label: 'Mortal', description: 'fear such that one may struggle with deciding whether to undertake the task' }
];

// Helper function to get description for a value
export const getAttributeDescription = (
  value: number, 
  descriptions: AttributeDescription[]
): AttributeDescription => {
  // Find the closest match
  const closest = descriptions.reduce((prev, curr) => 
    Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
  );
  return closest;
};

// Validation constants
export const MIN_ATTRIBUTE_VALUE = 10;
export const MAX_ATTRIBUTE_VALUE = 100;
export const ATTRIBUTE_STEP = 10;