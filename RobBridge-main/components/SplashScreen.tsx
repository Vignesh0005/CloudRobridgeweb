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

interface SplashScreenProps {
  onAnimationComplete?: () => void;
  duration?: number;
  message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onAnimationComplete,
  duration = 2500,
  message
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Individual dot animations
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const startAnimations = () => {
      // Parallel animations with smooth entrance
      Animated.parallel([
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        // Scale up with smooth spring
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        // Slide up
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start();

      // Sequential dot bouncing animation
      const createDotBounce = (dotAnim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(dotAnim, {
              toValue: 1,
              duration: 400,
              delay: delay,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.delay(800), // Pause before next cycle
          ])
        );
      };

      // Start dot animations with delays
      createDotBounce(dot1Anim, 0).start();
      createDotBounce(dot2Anim, 200).start();
      createDotBounce(dot3Anim, 400).start();

      // Auto complete after duration with smooth exit
      if (onAnimationComplete) {
        setTimeout(() => {
          // Smooth exit animation
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: 800,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onAnimationComplete();
          });
        }, duration);
      }
    };

    startAnimations();
  }, [fadeAnim, scaleAnim, slideAnim, dot1Anim, dot2Anim, dot3Anim, onAnimationComplete, duration]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Background with gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Main content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Animated.Image
            source={logoImage}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Message */}
        {message && (
          <Animated.Text
            style={[
              styles.messageText,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {message}
          </Animated.Text>
        )}

        {/* Loading indicator */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.loadingDots}>
            <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
          </View>
        </Animated.View>
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
    width: 200,
    height: 200,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 3,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: SIZES.padding / 2,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '300',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginHorizontal: 3,
  },
});

export default SplashScreen;
