import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  EXPO_USER: 'expo_user',
  FULL_ACCESS: 'full_access'
};

// Page access control
export const PAGE_ACCESS = {
  [ROLES.ADMIN]: [
    '/', '/scanner', '/scanned-barcodes', '/generator', '/saved-scans', '/image-processing', '/robot-control',
    '/rack-status', '/rack-management', '/product-management', '/device-connected', '/settings'
  ],
  [ROLES.EXPO_USER]: [
    '/', '/scanner', '/scanned-barcodes', '/saved-scans', '/device-connected', '/profile'
  ],
  [ROLES.FULL_ACCESS]: [
    '/', '/scanner', '/scanned-barcodes', '/generator', '/saved-scans', '/image-processing', '/robot-control',
    '/rack-status', '/rack-management', '/product-management', '/device-connected', '/settings'
  ]
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('robridge_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem('robridge_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Validate email domain and assign role
  const validateEmailAndAssignRole = (email) => {
    if (!email || typeof email !== 'string') {
      return { isValid: false, role: null, message: 'Invalid email format' };
    }

    const emailLower = email.toLowerCase().trim();
    
    if (emailLower.endsWith('@expo.dev') || emailLower.endsWith('@expo.io') || emailLower.endsWith('@expo.com')) {
      return { 
        isValid: true, 
        role: ROLES.EXPO_USER, 
        message: 'Expo user access granted' 
      };
    } else if (emailLower.endsWith('@admin.robridge.com')) {
      return { 
        isValid: true, 
        role: ROLES.ADMIN, 
        message: 'Admin access granted' 
      };
    } else if (emailLower.endsWith('@robridge.com')) {
      return { 
        isValid: true, 
        role: ROLES.FULL_ACCESS, 
        message: 'Full access granted' 
      };
    } else {
      return { 
        isValid: false, 
        role: null, 
        message: 'Email domain not authorized. Please use @expo.com, @expo.dev, @expo.io, @admin.robridge.com, or @robridge.com' 
      };
    }
  };

  const login = (email, password = '') => {
    try {
      // Validate email and get role
      const validation = validateEmailAndAssignRole(email);
      
      if (!validation.isValid) {
        return { 
          success: false, 
          message: validation.message 
        };
      }

      // For demo purposes, we'll accept any password for valid email domains
      // In production, you would validate against a real authentication system
      const userInfo = {
        email: email.toLowerCase().trim(),
        role: validation.role,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        loginTime: new Date().toISOString(),
        isAuthenticated: true,
        allowedPages: PAGE_ACCESS[validation.role] || []
      };
      
      setUser(userInfo);
      localStorage.setItem('robridge_user', JSON.stringify(userInfo));
      
      return { 
        success: true, 
        message: validation.message,
        user: userInfo
      };
    } catch (error) {
      console.error('Error during login:', error);
      return { 
        success: false, 
        message: 'Login failed. Please try again.' 
      };
    }
  };

  const logout = () => {
    try {
      setUser(null);
      localStorage.removeItem('robridge_user');
      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return false;
    }
  };

  const isAuthenticated = () => {
    return user && user.isAuthenticated;
  };

  const getUserInfo = () => {
    return user;
  };

  const hasPageAccess = (path) => {
    if (!user || !user.allowedPages) {
      return false;
    }
    return user.allowedPages.includes(path);
  };

  const getUserRole = () => {
    return user ? user.role : null;
  };

  const isExpoUser = () => {
    return user && user.role === ROLES.EXPO_USER;
  };

  const isAdmin = () => {
    return user && user.role === ROLES.ADMIN;
  };

  const isFullAccess = () => {
    return user && user.role === ROLES.FULL_ACCESS;
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
    getUserInfo,
    hasPageAccess,
    getUserRole,
    isExpoUser,
    isAdmin,
    isFullAccess,
    ROLES,
    PAGE_ACCESS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
