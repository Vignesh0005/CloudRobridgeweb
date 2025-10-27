import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Animated } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import AppNavigator from './navigation/AppNavigator';
import SplashScreen from './components/SplashScreen';
import { COLORS } from './constants/colors';

// Component to handle post-login splash screen
const AppContent = () => {
  const { showSplashAfterLogin, hideSplashAfterLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial app loading - reduced to 2 seconds for faster startup
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 seconds initial splash

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Post-login splash screen
    if (showSplashAfterLogin) {
      const timer = setTimeout(() => {
        hideSplashAfterLogin();
      }, 2000); // 2 seconds post-login splash

      return () => clearTimeout(timer);
    }
  }, [showSplashAfterLogin, hideSplashAfterLogin]);

  if (isLoading) {
    return (
      <SplashScreen 
        onAnimationComplete={() => setIsLoading(false)}
        duration={2000}
      />
    );
  }

  if (showSplashAfterLogin) {
    return (
      <SplashScreen 
        onAnimationComplete={() => hideSplashAfterLogin()}
        duration={2000}
        message="Welcome back!"
      />
    );
  }

  return <AppNavigator />;
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <WebSocketProvider>
            <StatusBar style="light" backgroundColor={COLORS.primary} />
            <AppContent />
          </WebSocketProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
