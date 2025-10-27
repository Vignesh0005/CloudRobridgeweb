import React, { createContext, useContext, useState, ReactNode } from 'react';
import { API_URLS, SERVER_CONFIG } from '../config/server';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  authToken: string | null;
  showSplashAfterLogin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hideSplashAfterLogin: () => void;
}

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showSplashAfterLogin, setShowSplashAfterLogin] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Development mode - bypass backend for demo credentials
      const isDevelopmentMode = true; // Set to false when backend is available
      
      if (isDevelopmentMode) {
        console.log('Development mode: Bypassing backend authentication');
        
        // Check for demo credentials
        if (email === 'admin' && password === 'admin123') {
          console.log('Demo credentials accepted');
          setUser({
            id: 1,
            email: 'admin@robbridge.com',
            username: 'admin',
            role: 'admin'
          });
          setAuthToken('demo-token-123');
          setIsAuthenticated(true);
          setShowSplashAfterLogin(true);
          console.log('Login successful (development mode)');
          return true;
        } else if (email === 'atman@expo.com' && password === 'expo123') {
          console.log('Expo credentials accepted');
          setUser({
            id: 2,
            email: 'atman@expo.com',
            username: 'atman@expo.com',
            role: 'expo'
          });
          setAuthToken('expo-token-456');
          setIsAuthenticated(true);
          setShowSplashAfterLogin(true);
          console.log('Login successful (development mode)');
          return true;
        } else {
          console.log('Invalid demo credentials');
          return false;
        }
      }
      
      console.log('Attempting to connect to cloud server:', API_URLS.HEALTH);
      console.log('Login data:', { username: email, password: password });
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SERVER_CONFIG.CONNECTION.TIMEOUT);
      
      // Check server health first
      const healthResponse = await fetch(API_URLS.HEALTH, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('Health check response status:', healthResponse.status);
      console.log('Health check response ok:', healthResponse.ok);

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('Server health data:', healthData);
        
        // Since there's no authentication endpoint, we'll use demo credentials
        // but verify the server is reachable
        if (email === 'admin' && password === 'admin123') {
          console.log('Demo credentials accepted with cloud server connection');
          setUser({
            id: 1,
            email: 'admin@robbridge.com',
            username: 'admin',
            role: 'admin'
          });
          setAuthToken('cloud-demo-token-123');
          setIsAuthenticated(true);
          setShowSplashAfterLogin(true);
          console.log('Login successful with cloud server connection');
          return true;
        } else if (email === 'atman@expo.com' && password === 'expo123') {
          console.log('Expo credentials accepted with cloud server connection');
          setUser({
            id: 2,
            email: 'atman@expo.com',
            username: 'atman@expo.com',
            role: 'expo'
          });
          setAuthToken('cloud-expo-token-456');
          setIsAuthenticated(true);
          setShowSplashAfterLogin(true);
          console.log('Login successful with cloud server connection');
          return true;
        } else {
          console.log('Invalid credentials');
          return false;
        }
      } else {
        const errorData = await healthResponse.text();
        console.log('Server health check failed with status:', healthResponse.status, 'Error:', errorData);
        return false;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('AuthContext: Logout function called');
    console.log('AuthContext: Current user before logout:', user);
    setUser(null);
    setAuthToken(null);
    setIsAuthenticated(false);
    setShowSplashAfterLogin(false);
    console.log('AuthContext: Logout completed, user should be redirected to login screen');
  };

  const hideSplashAfterLogin = () => {
    setShowSplashAfterLogin(false);
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    authToken,
    showSplashAfterLogin,
    login,
    logout,
    hideSplashAfterLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
