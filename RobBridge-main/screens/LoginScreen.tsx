import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/colors';
import { SIZES } from '../constants/sizes';
import RoBridgeLogo from '../components/RoBridgeLogo';
import LoadingScreen from '../components/LoadingScreen';

// Import the logo image
const logoImage = require('../assets/logo.png');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // For backend authentication, we use username instead of email
    // if (!email.includes('@')) {
    //   Alert.alert('Error', 'Please enter a valid email address');
    //   return;
    // }

    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        // Login successful - App.tsx will handle splash screen
        setIsLoading(false);
      } else {
        Alert.alert('Error', 'Invalid credentials');
        setIsLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality coming soon');
  };

  const testNetworkConnection = async () => {
    try {
      console.log('Testing network connection to local backend...');
      const response = await fetch('http://192.168.0.117:5001/health', {
        method: 'GET',
        timeout: 10000,
      });
      
      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          'Network Test Success', 
          `Backend is reachable!\n\nStatus: ${data.status}\nDatabase: ${data.database}\nVersion: ${data.version}`
        );
      } else {
        Alert.alert(
          'Network Test Failed', 
          `Backend responded with status: ${response.status}\n\nThis might be a temporary issue. Please try again later.`
        );
      }
    } catch (error) {
      console.error('Network test error:', error);
      Alert.alert(
        'Network Test Failed', 
        `Cannot connect to backend.\n\nError: ${error.message}\n\nPossible causes:\n• Backend is sleeping (Railway free tier)\n• Network connectivity issues\n• Backend is down\n\nPlease check your internet connection and try again.`
      );
    }
  };

  // Show loading screen during login
  if (isLoading) {
    return <LoadingScreen message="Signing you in..." />;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <RoBridgeLogo 
            size="large" 
            style={[styles.logo, { width: 200, height: 200 }]} 
            logoSource={logoImage}
            showText={false}
          />
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to your account</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#6c757d" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username or Email"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#6c757d" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color="#6c757d" 
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <Text style={styles.loginButtonText}>Signing In...</Text>
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Test Connection Button */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={testNetworkConnection}
            activeOpacity={0.8}
          >
            <Ionicons name="wifi" size={20} color={COLORS.primary} />
            <Text style={styles.testButtonText}>Test Backend Connection</Text>
          </TouchableOpacity>

          {/* Demo Credentials */}
          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Demo Credentials:</Text>
            <Text style={styles.demoText}>Admin - Username: admin | Password: admin123</Text>
            <Text style={styles.demoText}>Expo - Username: atman@expo.com | Password: expo123</Text>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.marginLarge,
    backgroundColor: 'transparent',
  },
  logo: {
    marginBottom: SIZES.margin,
    backgroundColor: 'transparent',
  },
  appSubtitle: {
    fontSize: SIZES.h3,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.marginSmall,
  },
  formSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.marginLarge,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.margin,
    paddingHorizontal: SIZES.padding,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  inputIcon: {
    marginRight: SIZES.marginSmall,
  },
  input: {
    flex: 1,
    fontSize: SIZES.body,
    color: COLORS.text,
    backgroundColor: 'transparent',
  },
  passwordInput: {
    marginRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: SIZES.padding,
    padding: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SIZES.marginLarge,
  },
  forgotPasswordText: {
    fontSize: SIZES.caption,
    color: COLORS.primary,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.marginLarge,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    height: 45,
    marginBottom: SIZES.margin,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  loginButtonText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  testButtonText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: SIZES.marginSmall,
  },
  demoContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayDark,
  },
  demoTitle: {
    fontSize: SIZES.caption,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.marginSmall,
  },
  demoText: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
});

export default LoginScreen;
