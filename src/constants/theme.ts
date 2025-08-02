export const Colors = {
  // RPG Theme Colors
  primary: '#8B4513', // Saddle Brown
  secondary: '#DAA520', // Goldenrod
  accent: '#FF6347', // Tomato
  background: '#2F1B14', // Dark Brown
  surface: '#3D2B1F', // Medium Brown
  
  // Game Elements
  gold: '#FFD700', // Gold
  xp: '#00CED1', // Dark Turquoise
  health: '#DC143C', // Crimson
  mana: '#4169E1', // Royal Blue
  
  // Text Colors
  text: '#F5DEB3', // Wheat
  textSecondary: '#DEB887', // Burlywood
  textLight: '#FFFFFF',
  textDark: '#8B4513',
  
  // Status Colors
  success: '#32CD32', // Lime Green
  warning: '#FF8C00', // Dark Orange
  error: '#DC143C', // Crimson
  danger: '#DC143C', // Crimson (alias for error)
  info: '#1E90FF', // Dodge Blue
  
  // Attribute Colors
  difficulty: '#FF6B6B', // Light Red
  importance: '#4ECDC4', // Teal
  fear: '#45B7D1', // Sky Blue
  
  // Skill Types
  increasing: '#6BCF7F', // Green
  decreasing: '#FFB347', // Orange
  
  // Group Colors
  groupColors: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8E8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ],
  
  // UI Elements
  border: '#8B4513',
  borderLight: '#DEB887',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Surface variations
  surfaceDark: '#2F1B14',
  backgroundDark: '#1A0F0A',
  
  // Gradients
  gradient: {
    primary: ['#8B4513', '#A0522D'],
    secondary: ['#DAA520', '#B8860B'],
    xp: ['#00CED1', '#48D1CC'],
    gold: ['#FFD700', '#FFA500']
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  title: 32
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50
};

export const Shadows = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  }
};

export const Layout = {
  screenPadding: Spacing.md,
  cardPadding: Spacing.md,
  buttonHeight: 48,
  inputHeight: 40,
  tabBarHeight: 60,
  headerHeight: 56
};