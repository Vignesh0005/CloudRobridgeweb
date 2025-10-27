import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { COLORS } from '../constants/colors';
import { SIZES } from '../constants/sizes';
import { useAuth } from '../contexts/AuthContext';

// Define which screens are accessible for each role
const getAccessibleScreens = (userRole: string): string[] => {
  if (userRole === 'expo') {
    // Expo user can only access: Dashboard, BarcodeScanner, ScannedBarcodes, DeviceConnected, History (Saved Barcodes), Settings, ProfileAccount
    return ['Dashboard', 'BarcodeScanner', 'ScannedBarcodes', 'DeviceConnected', 'History', 'Settings', 'ProfileAccount'];
  }
  // Admin and other roles have access to all screens except ESP32Control
  return [
    'Dashboard',
    'BarcodeScanner',
    'ScannedBarcodes',
    'DeviceConnected',
    'History',
    'BarcodeGenerator',
    'ImageProcessor',
    'RobotControl',
    'RackStatus',
    'RackManagement',
    'ProductManagement',
    'RackSettings',
    'ProductMovement',
    'Settings',
    'ProfileAccount'
  ];
};

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';
import ScannedBarcodesScreen from '../screens/ScannedBarcodesScreen';
import DeviceConnectedScreen from '../screens/DeviceConnectedScreen';
import BarcodeGeneratorScreen from '../screens/BarcodeGeneratorScreen';
import ImageProcessorScreen from '../screens/ImageProcessorScreen';
import RobotControlScreen from '../screens/RobotControlScreen';
import RackStatusScreen from '../screens/RackStatusScreen';
import RackManagementScreen from '../screens/RackManagementScreen';
import ProductManagementScreen from '../screens/ProductManagementScreen';
import RackManagementScreenNew from '../screens/RackManagementScreenNew';
import RackSettingsScreen from '../screens/RackSettingsScreen';
import ProductMovementScreen from '../screens/ProductMovementScreen';
import ESP32ControlScreen from '../screens/ESP32ControlScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileAccountScreen from '../screens/ProfileAccountScreen';

// Import the logo image
const logoImage = require('../assets/logo.png');

const Drawer = createDrawerNavigator();

// Custom drawer content component
const CustomDrawerContent = (props: any) => {
  const { user, logout } = useAuth();
  
  // Filter drawer items based on user role
  const accessibleScreens = getAccessibleScreens(user?.role || 'admin');
  const filteredProps = {
    ...props,
    state: {
      ...props.state,
      routes: props.state.routes.filter((route: any) => 
        accessibleScreens.includes(route.name)
      ),
    },
  };

  // Handle logout with confirmation
  const handleLogout = () => {
    console.log('CustomDrawerContent: Logout button pressed for user:', user?.role);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            console.log('CustomDrawerContent: Logout confirmed, calling logout function');
            try {
              logout();
              console.log('CustomDrawerContent: Logout successful');
            } catch (error) {
              console.error('CustomDrawerContent: Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        },
      ]
    );
  };
  
  return (
    <DrawerContentScrollView {...props} style={styles.drawerContent}>
      {/* Logo Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.logoContainer}>
          <Image
            source={logoImage}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>
      
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Filtered drawer items */}
      <DrawerItemList {...filteredProps} />
      
      {/* Logout button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const DrawerNavigator = () => {
  const { user } = useAuth();
  const accessibleScreens = getAccessibleScreens(user?.role || 'admin');

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ route }) => ({
        drawerIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'BarcodeScanner':
              iconName = focused ? 'scan' : 'scan-outline';
              break;
            case 'ScannedBarcodes':
              iconName = focused ? 'barcode' : 'barcode-outline';
              break;
            case 'BarcodeGenerator':
              iconName = focused ? 'qr-code' : 'qr-code-outline';
              break;
            case 'ImageProcessor':
              iconName = focused ? 'image' : 'image-outline';
              break;
            case 'RobotControl':
              iconName = focused ? 'game-controller' : 'game-controller-outline';
              break;
            case 'RackStatus':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'RackManagement':
              iconName = focused ? 'construct' : 'construct-outline';
              break;
            case 'ProductManagement':
              iconName = focused ? 'cube' : 'cube-outline';
              break;
            case 'RackSettings':
              iconName = focused ? 'cog' : 'cog-outline';
              break;
            case 'ProductMovement':
              iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
              break;
            case 'ESP32Control':
              iconName = focused ? 'bluetooth' : 'bluetooth-outline';
              break;
            case 'History':
              iconName = focused ? 'bookmark' : 'bookmark-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            case 'ProfileAccount':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.textSecondary,
        drawerStyle: {
          backgroundColor: COLORS.surface,
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: SIZES.body,
          fontWeight: '500',
          marginLeft: -10,
        },
        // Remove default headers to use custom ones
        headerShown: false,
        // Enable swipe to open/close drawer
        swipeEnabled: true,
        // Enable edge swipe to open drawer
        drawerType: 'front',
        // Overlay when drawer is open
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        // Enable touch events
        gestureEnabled: true,
        // Enable touch response
        touchResponseDistance: 50,
        // Enable keyboard handling
        keyboardDismissMode: 'on-drag',
      })}
    >
      {accessibleScreens.includes('Dashboard') && (
        <Drawer.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ 
            drawerLabel: 'Dashboard'
          }}
        />
      )}
      {accessibleScreens.includes('BarcodeScanner') && (
        <Drawer.Screen 
          name="BarcodeScanner" 
          component={BarcodeScannerScreen}
          options={{ 
            drawerLabel: 'Barcode Scanner'
          }}
        />
      )}
      {accessibleScreens.includes('ScannedBarcodes') && (
        <Drawer.Screen 
          name="ScannedBarcodes" 
          component={ScannedBarcodesScreen}
          options={{ 
            drawerLabel: 'Scanned Barcodes'
          }}
        />
      )}
      {accessibleScreens.includes('History') && (
        <Drawer.Screen 
          name="History" 
          component={HistoryScreen}
          options={{ 
            drawerLabel: 'Saved Scans'
          }}
        />
      )}
      {accessibleScreens.includes('BarcodeGenerator') && (
        <Drawer.Screen 
          name="BarcodeGenerator" 
          component={BarcodeGeneratorScreen}
          options={{ 
            drawerLabel: 'Barcode Generator'
          }}
        />
      )}
      {accessibleScreens.includes('ImageProcessor') && (
        <Drawer.Screen 
          name="ImageProcessor" 
          component={ImageProcessorScreen}
          options={{ 
            drawerLabel: 'Image Processor'
          }}
        />
      )}
      {accessibleScreens.includes('RobotControl') && (
        <Drawer.Screen 
          name="RobotControl" 
          component={RobotControlScreen}
          options={{ 
            drawerLabel: 'Robot Control'
          }}
        />
      )}
      {accessibleScreens.includes('RackStatus') && (
        <Drawer.Screen 
          name="RackStatus" 
          component={RackStatusScreen}
          options={{ 
            drawerLabel: 'Rack Status'
          }}
        />
      )}
      {accessibleScreens.includes('RackManagement') && (
        <Drawer.Screen 
          name="RackManagement" 
          component={RackManagementScreen}
          options={{ 
            drawerLabel: 'Rack Management'
          }}
        />
      )}
      {accessibleScreens.includes('ProductManagement') && (
        <Drawer.Screen 
          name="ProductManagement" 
          component={ProductManagementScreen}
          options={{ 
            drawerLabel: 'Product Management'
          }}
        />
      )}
      {accessibleScreens.includes('RackSettings') && (
        <Drawer.Screen 
          name="RackSettings" 
          component={RackSettingsScreen}
          options={{ 
            drawerLabel: 'Rack Settings'
          }}
        />
      )}
      {accessibleScreens.includes('ProductMovement') && (
        <Drawer.Screen 
          name="ProductMovement" 
          component={ProductMovementScreen}
          options={{ 
            drawerLabel: 'Product Movement'
          }}
        />
      )}
      {accessibleScreens.includes('Settings') && (
        <Drawer.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ 
            drawerLabel: 'Settings'
          }}
        />
      )}
      {accessibleScreens.includes('ProfileAccount') && (
        <Drawer.Screen 
          name="ProfileAccount" 
          component={ProfileAccountScreen}
          options={{ 
            drawerLabel: 'Profile & Account'
          }}
        />
      )}
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    backgroundColor: 'transparent',
    padding: SIZES.padding,
    paddingTop: SIZES.padding * 2,
    paddingBottom: SIZES.padding * 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 0,
  },
  brandName: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: SIZES.margin / 4,
  },
  brandTagline: {
    fontSize: SIZES.fontSmall,
    color: COLORS.secondaryLight,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.margin,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 2,
  },
  userRole: {
    fontSize: SIZES.fontSmall,
    color: COLORS.secondaryLight,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.grayLight,
    marginVertical: SIZES.margin,
  },
  logoutSection: {
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding / 2,
  },
  logoutText: {
    fontSize: SIZES.body,
    color: COLORS.error,
    marginLeft: SIZES.margin / 2,
    fontWeight: '500',
  },
});

export default DrawerNavigator;
