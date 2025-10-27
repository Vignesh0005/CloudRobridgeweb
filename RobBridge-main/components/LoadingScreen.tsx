import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { SIZES } from '../constants/sizes';

// Import the logo image
const logoImage = require('../assets/logo.png');

interface LoadingScreenProps {
  message?: string;
  onAnimationComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading...", 
  onAnimationComplete 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations
    const startAnimations = () => {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // Scale animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }).start();

      // Continuous rotation for loading indicator
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );

      // Pulse animation for logo
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      rotateAnimation.start();
      pulseAnimation.start();

      // Call completion callback after 3 seconds
      if (onAnimationComplete) {
        setTimeout(() => {
          onAnimationComplete();
        }, 3000);
      }
    };

    startAnimations();
  }, [fadeAnim, scaleAnim, rotateAnim, pulseAnim, onAnimationComplete]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Main content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo with pulse animation */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Animated.Image
            source={logoImage}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>


        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingCircle,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <View style={styles.loadingCircleInner} />
          </Animated.View>
          
          {/* Loading dots */}
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
          </View>
        </View>

        {/* Loading message */}
        <Text style={styles.loadingMessage}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    opacity: 1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.padding * 2,
  },
  logoContainer: {
    marginBottom: SIZES.padding * 2,
  },
  logo: {
    width: 150,
    height: 150,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#00d4ff',
    textAlign: 'center',
    marginBottom: SIZES.padding / 2,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
    fontWeight: '300',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
  },
  loadingCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    borderTopColor: COLORS.primary,
    marginBottom: SIZES.padding,
  },
  loadingCircleInner: {
    flex: 1,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginHorizontal: 4,
  },
  loadingMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '300',
  },
});

export default LoadingScreen;
