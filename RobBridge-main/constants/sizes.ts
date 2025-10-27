import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SIZES = {
  // Screen dimensions
  width,
  height,
  
  // Base sizes
  base: 8,
  small: 12,
  medium: 16,
  large: 20,
  xlarge: 24,
  xxlarge: 32,
  
  // Font sizes
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  body: 16,
  body2: 14,
  body3: 12,
  body4: 10,
  caption: 14,
  fontSmall: 12,
  
  // Spacing
  padding: 16,
  paddingSmall: 8,
  paddingLarge: 24,
  margin: 16,
  marginSmall: 8,
  marginLarge: 24,
  
  // Border radius
  radius: 8,
  radiusSmall: 4,
  radiusLarge: 12,
  radiusXLarge: 20,
  
  // Button sizes
  buttonHeight: 48,
  buttonSmall: 36,
  buttonLarge: 56,
  
  // Input sizes
  inputHeight: 48,
  inputPadding: 12,
  
  // Card sizes
  cardPadding: 16,
  cardMargin: 8,
  
  // Icon sizes
  iconSmall: 16,
  iconMedium: 24,
  iconLarge: 32,
  iconXLarge: 48,
  
  // Navigation
  tabBarHeight: 60,
  headerHeight: 56,
  statusBarHeight: 44,
  
  // Robot control
  joystickSize: 120,
  controlButtonSize: 60,
  
  // Camera
  cameraAspectRatio: 4/3,
  cameraQuality: 0.8,
};
