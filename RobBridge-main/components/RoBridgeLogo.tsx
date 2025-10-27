import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface RoBridgeLogoProps {
  size?: 'small' | 'medium' | 'large';
  style?: any;
  showText?: boolean; // Whether to show the "RoBridge" text below the logo
  logoSource?: any; // PNG image source for the logo
}

/**
 * RoBridgeLogo Component
 * 
 * Usage examples:
 * 
 * // Logo only (no text)
 * <RoBridgeLogo size="large" logoSource={require('../assets/logo.png')} showText={false} />
 * 
 * // Logo with text
 * <RoBridgeLogo size="medium" logoSource={require('../assets/logo.png')} showText={true} />
 * 
 * // Text only (fallback)
 * <RoBridgeLogo size="small" showText={true} />
 */

const RoBridgeLogo: React.FC<RoBridgeLogoProps> = ({ 
  size = 'medium', 
  style, 
  showText = true, 
  logoSource 
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { 
          fontSize: 24, 
          letterSpacing: 2,
          imageSize: { width: 60, height: 60 }
        };
      case 'large':
        return { 
          fontSize: 48, 
          letterSpacing: 4,
          imageSize: { width: 180, height: 180 }
        };
      default:
        return { 
          fontSize: 36, 
          letterSpacing: 3,
          imageSize: { width: 80, height: 80 }
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, style]}>
      {/* PNG Logo Image */}
      {logoSource && (
        <Image 
          source={logoSource} 
          style={[styles.logoImage, sizeStyles.imageSize]}
          resizeMode="contain"
        />
      )}
      
      {/* Main Logo Text - shown if showText is true or no logoSource provided */}
      {showText && (
        <Text style={[styles.logoText, sizeStyles]}>
          <Text style={styles.roText}>Ro</Text>
          <Text style={styles.bridgeText}>Bridge</Text>
        </Text>
      )}
      
      {/* Decorative elements - only shown with text */}
      {showText && (
        <View style={styles.decorativeContainer}>
          <View style={styles.torchElement} />
          <View style={styles.circuitElement} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    marginBottom: 8,
  },
  logoText: {
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
  },
  roText: {
    color: '#2c2c2c',
    fontSize: 48,
  },
  bridgeText: {
    color: '#E3821E',
    fontSize: 48,
  },
  decorativeContainer: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  torchElement: {
    width: 20,
    height: 4,
    backgroundColor: '#2c2c2c',
    borderRadius: 2,
    marginRight: 8,
  },
  circuitElement: {
    width: 24,
    height: 4,
    backgroundColor: '#E3821E',
    borderRadius: 2,
  },
});

export default RoBridgeLogo;
