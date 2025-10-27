import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootDrawerNavigationProp } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/colors';
import { SIZES } from '../constants/sizes';
import { API_URLS, SERVER_CONFIG } from '../config/server';

interface SystemHealth {
  database: { status: string; lastCheck: string };
  robot: { status: string; battery: number; position: string };
  performance: { cpu: number; memory: number; uptime: string };
}

interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  icon: string;
}

const DashboardScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: { status: 'Online', lastCheck: '2 min ago' },
    robot: { status: 'Connected', battery: 85, position: '(10, 20, 5)' },
    performance: { cpu: 45, memory: 62, uptime: '3d 12h 34m' },
  });
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([
    { id: '1', type: 'scan', message: 'Barcode scanned: 123456789', timestamp: '2 min ago', icon: 'scan' },
    { id: '2', type: 'robot', message: 'Robot moved to position (10, 20, 5)', timestamp: '5 min ago', icon: 'game-controller' },
    { id: '3', type: 'warning', message: 'Battery level low: 15%', timestamp: '10 min ago', icon: 'warning' },
    { id: '4', type: 'image', message: 'Image processed successfully', timestamp: '15 min ago', icon: 'image' },
  ]);

  // Development mode - generate dynamic activity history
  const generateMockActivity = () => {
    const activities: ActivityEvent[] = [
      { id: '1', type: 'scan', message: 'Barcode scanned: 123456789', timestamp: '2 min ago', icon: 'scan' },
      { id: '2', type: 'robot', message: 'Robot moved to position (10, 20, 5)', timestamp: '5 min ago', icon: 'game-controller' },
      { id: '3', type: 'warning', message: 'Battery level low: 15%', timestamp: '10 min ago', icon: 'warning' },
      { id: '4', type: 'image', message: 'Image processed successfully', timestamp: '15 min ago', icon: 'image' },
      { id: '5', type: 'scan', message: 'Barcode scanned: 987654321', timestamp: '18 min ago', icon: 'scan' },
      { id: '6', type: 'robot', message: 'Robot returned to home position', timestamp: '22 min ago', icon: 'game-controller' },
      { id: '7', type: 'success', message: 'Rack A1 inventory updated', timestamp: '25 min ago', icon: 'checkmark-circle' },
      { id: '8', type: 'scan', message: 'Barcode scanned: 456789123', timestamp: '28 min ago', icon: 'scan' },
      { id: '9', type: 'robot', message: 'Robot started charging', timestamp: '30 min ago', icon: 'battery-charging' },
      { id: '10', type: 'image', message: 'Product image captured', timestamp: '35 min ago', icon: 'camera' },
    ];
    return activities;
  };

  // Function to add new activity (for development mode)
  const addNewActivity = (type: string, message: string, icon: string) => {
    const newActivity: ActivityEvent = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: 'Just now',
      icon
    };
    setRecentActivity(prevActivity => [newActivity, ...prevActivity.slice(0, 9)]);
  };
  const [dashboardStats, setDashboardStats] = useState({
    users: 0,
    sessions: 0,
    barcodes: 0,
    robot_status: 'offline'
  });

  const navigation = useNavigation<RootDrawerNavigationProp>();
  const { logout, user } = useAuth();

  // Authenticate and load dashboard data
  const authenticateAndLoadData = async () => {
    try {
      setLoading(true);
      
      // First authenticate with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SERVER_CONFIG.CONNECTION.TIMEOUT);
      
      const healthResponse = await fetch(API_URLS.HEALTH, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!healthResponse.ok) {
        throw new Error(`HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
      }

      const healthResult = await healthResponse.json();
      console.log('Cloud server health check successful:', healthResult);
      
      setAuthToken('cloud-demo-token');
      setIsConnected(true);

      // Load dashboard stats
      await loadDashboardStats('cloud-demo-token');
    } catch (error) {
      console.log('Server unavailable, running in offline mode:', error.message || error);
      setIsConnected(false);
      // Set default values for offline mode
      setDashboardStats({
        users: 1,
        sessions: 0,
        barcodes: 0,
        robot_status: 'offline'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard statistics from backend
  const loadDashboardStats = async (token?: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SERVER_CONFIG.CONNECTION.TIMEOUT);
      
      // Use system status endpoint to get dashboard data
      const response = await fetch(API_URLS.SYSTEM_STATUS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setDashboardStats(result.data);
        
        // Update system health based on backend data
        setSystemHealth({
          database: { status: 'Online', lastCheck: 'Just now' },
          robot: { 
            status: result.data.robot_status === 'connected' ? 'Connected' : 'Disconnected', 
            battery: Math.floor(Math.random() * 30) + 70, 
            position: '(10, 20, 5)' 
          },
          performance: { 
            cpu: Math.floor(Math.random() * 30) + 30, 
            memory: Math.floor(Math.random() * 30) + 50, 
            uptime: '3d 12h 34m' 
          },
        });
        
        // Transform recent activity from backend
        if (result.data.recent_activity) {
          const transformedActivity = result.data.recent_activity.map((activity: any, index: number) => ({
            id: activity.id?.toString() || index.toString(),
            type: activity.log_level?.toLowerCase() || 'info',
            message: activity.message,
            timestamp: new Date(activity.timestamp).toLocaleString(),
            icon: getActivityIcon(activity.log_level, activity.module),
          }));
          setRecentActivity(transformedActivity);
        }
      }
    } catch (error) {
      console.log('Dashboard stats unavailable, using default values:', error.message || error);
      // Set default values for offline mode
      setDashboardStats({
        users: 1,
        sessions: 0,
        barcodes: 0,
        robot_status: 'offline'
      });
    }
  };

  // Helper function to get activity icon based on log level and module
  const getActivityIcon = (logLevel: string, module: string) => {
    if (logLevel === 'ERROR') return 'warning';
    if (module === 'barcode') return 'scan';
    if (module === 'robot') return 'game-controller';
    if (module === 'image') return 'image';
    return 'information-circle';
  };

  // Check connection status with Python server
  const checkConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(API_URLS.HEALTH, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      setIsConnected(response.ok);
      
      if (response.ok && authToken) {
        // If connected and authenticated, refresh data
        await loadDashboardStats();
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  // Retry connection function
  const retryConnection = async () => {
    setIsRetrying(true);
    await authenticateAndLoadData();
    setTimeout(() => setIsRetrying(false), 1000);
  };

  // Check connection on component mount and every 10 seconds
  useEffect(() => {
    // Initialize with safe default values
    setDashboardStats({
      users: 1,
      sessions: 0,
      barcodes: 0,
      robot_status: 'offline'
    });
    
    // Try to authenticate and load data, but don't crash if it fails
    authenticateAndLoadData().catch(error => {
      console.log('Initial authentication failed, running in offline mode:', error);
    });
    
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  // Development mode - initialize and update activity history
  useEffect(() => {
    const isDevelopmentMode = true; // Set to false when backend is available
    
    if (isDevelopmentMode) {
      // Initialize with mock activity data
      setRecentActivity(generateMockActivity());
      
      // Update activity every 30 seconds to simulate new events
      const activityInterval = setInterval(() => {
        setRecentActivity(prevActivity => {
          const newActivity = generateMockActivity();
          // Add a new random activity at the top
          const randomActivities = [
            { id: Date.now().toString(), type: 'scan', message: `Barcode scanned: ${Math.floor(Math.random() * 900000000) + 100000000}`, timestamp: 'Just now', icon: 'scan' },
            { id: Date.now().toString(), type: 'robot', message: `Robot moved to position (${Math.floor(Math.random() * 50)}, ${Math.floor(Math.random() * 50)}, ${Math.floor(Math.random() * 10)})`, timestamp: 'Just now', icon: 'game-controller' },
            { id: Date.now().toString(), type: 'success', message: `Rack ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 10) + 1} inventory updated`, timestamp: 'Just now', icon: 'checkmark-circle' },
            { id: Date.now().toString(), type: 'image', message: 'Product image captured and processed', timestamp: 'Just now', icon: 'camera' },
          ];
          const randomActivity = randomActivities[Math.floor(Math.random() * randomActivities.length)];
          return [randomActivity, ...prevActivity.slice(0, 9)]; // Keep only 10 most recent
        });
      }, 30000); // Update every 30 seconds
      
      return () => clearInterval(activityInterval);
    }
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (authToken) {
        await loadDashboardStats();
      } else {
        await authenticateAndLoadData();
      }
    } finally {
      setRefreshing(false);
    }
  }, [authToken]);

  const toggleDrawer = () => {
    console.log('DashboardScreen: Menu button pressed - attempting to toggle drawer');
    console.log('DashboardScreen: navigation object:', navigation);
    try {
      if (navigation && navigation.toggleDrawer) {
        navigation.toggleDrawer();
        console.log('DashboardScreen: Drawer toggled successfully');
      } else {
        console.error('DashboardScreen: navigation.toggleDrawer is not available');
      }
    } catch (error) {
      console.error('DashboardScreen: Error toggling drawer:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan':
        navigation.navigate('BarcodeScanner');
        // Add test activity
        addNewActivity('scan', `Barcode scanned: ${Math.floor(Math.random() * 900000000) + 100000000}`, 'scan');
        break;
      case 'generate':
        navigation.navigate('BarcodeGenerator');
        // Add test activity
        addNewActivity('success', 'New barcode generated successfully', 'qr-code');
        break;
      case 'control':
        navigation.navigate('RobotControl');
        // Add test activity
        addNewActivity('robot', `Robot moved to position (${Math.floor(Math.random() * 50)}, ${Math.floor(Math.random() * 50)}, ${Math.floor(Math.random() * 10)})`, 'game-controller');
        break;
      case 'process':
        navigation.navigate('ImageProcessor');
        // Add test activity
        addNewActivity('image', 'Image processed successfully', 'image');
        break;
      case 'test':
        // Add random test activity
        const testActivities = [
          { type: 'scan', message: `Test barcode scanned: ${Math.floor(Math.random() * 900000000) + 100000000}`, icon: 'scan' },
          { type: 'robot', message: 'Test robot movement completed', icon: 'game-controller' },
          { type: 'success', message: 'Test operation successful', icon: 'checkmark-circle' },
          { type: 'warning', message: 'Test warning generated', icon: 'warning' },
        ];
        const randomTest = testActivities[Math.floor(Math.random() * testActivities.length)];
        addNewActivity(randomTest.type, randomTest.message, randomTest.icon);
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'connected':
        return COLORS.success;
      case 'offline':
      case 'disconnected':
        return COLORS.error;
      case 'warning':
        return COLORS.warning;
      default:
        return COLORS.gray;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleDrawer}
          activeOpacity={0.5}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={28} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Robridge Dashboard</Text>
        <View style={styles.headerRight}>
          {/* Connection Status Indicator */}
          <View style={styles.connectionIndicator}>
            <View style={[styles.connectionDot, { backgroundColor: isConnected ? COLORS.success : COLORS.error }]} />
            <Text style={styles.connectionText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
            {!isConnected && (
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={retryConnection}
                disabled={isRetrying}
              >
                <Ionicons 
                  name={isRetrying ? "refresh" : "refresh-outline"} 
                  size={12} 
                  color={COLORS.textLight} 
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back, {user?.name || 'User'}!</Text>
          <Text style={styles.welcomeSubtext}>Here's what's happening with your robots</Text>
        </View>

        {/* System Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Health</Text>
          <View style={styles.healthGrid}>
            <View style={styles.healthCard}>
              <Ionicons name="server" size={24} color={COLORS.primary} />
              <Text style={styles.healthLabel}>Database</Text>
              <Text style={[styles.healthValue, { color: getStatusColor(systemHealth.database.status) }]}>
                {systemHealth.database.status}
              </Text>
              <Text style={styles.healthDetail}>{systemHealth.database.lastCheck}</Text>
            </View>
            <View style={styles.healthCard}>
              <Ionicons name="hardware-chip" size={24} color={COLORS.primary} />
              <Text style={styles.healthLabel}>Robot</Text>
              <Text style={[styles.healthValue, { color: getStatusColor(systemHealth.robot.status) }]}>
                {systemHealth.robot.status}
              </Text>
              <Text style={styles.healthDetail}>{systemHealth.robot.battery}% battery</Text>
            </View>
            <View style={styles.healthCard}>
              <Ionicons name="speedometer" size={24} color={COLORS.primary} />
              <Text style={styles.healthLabel}>Performance</Text>
              <Text style={styles.healthValue}>{systemHealth.performance.cpu}% CPU</Text>
              <Text style={styles.healthDetail}>{systemHealth.performance.memory}% memory</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.statLabel}>Active Users</Text>
              <Text style={styles.statValue}>{dashboardStats.users}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color={COLORS.primary} />
              <Text style={styles.statLabel}>Sessions</Text>
              <Text style={styles.statValue}>{dashboardStats.sessions}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="barcode" size={24} color={COLORS.primary} />
              <Text style={styles.statLabel}>Barcodes</Text>
              <Text style={styles.statValue}>{dashboardStats.barcodes}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="hardware-chip" size={24} color={COLORS.primary} />
              <Text style={styles.statLabel}>Robot Status</Text>
              <Text style={[styles.statValue, { 
                color: dashboardStats.robot_status === 'connected' ? COLORS.success : COLORS.error 
              }]}>
                {dashboardStats.robot_status === 'connected' ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard} 
              activeOpacity={0.7}
              onPress={() => handleQuickAction('scan')}
            >
              <Ionicons name="scan" size={32} color={COLORS.primary} />
              <Text style={styles.actionText}>Scan Barcode</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard} 
              activeOpacity={0.7}
              onPress={() => handleQuickAction('generate')}
            >
              <Ionicons name="qr-code" size={32} color={COLORS.primary} />
              <Text style={styles.actionText}>Generate Code</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard} 
              activeOpacity={0.7}
              onPress={() => handleQuickAction('control')}
            >
              <Ionicons name="game-controller" size={32} color={COLORS.primary} />
              <Text style={styles.actionText}>Robot Control</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard} 
              activeOpacity={0.7}
              onPress={() => handleQuickAction('process')}
            >
              <Ionicons name="image" size={32} color={COLORS.primary} />
              <Text style={styles.actionText}>Process Image</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard} 
              activeOpacity={0.7}
              onPress={() => handleQuickAction('test')}
            >
              <Ionicons name="add-circle" size={32} color={COLORS.primary} />
              <Text style={styles.actionText}>Add Test Activity</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <Ionicons 
                  name={activity.icon as any} 
                  size={20} 
                  color={activity.type === 'warning' ? COLORS.warning : COLORS.primary} 
                />
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.message}</Text>
                  <Text style={styles.activityTime}>{activity.timestamp}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 44,
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textLight,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
    justifyContent: 'flex-end',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 90,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  connectionText: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  retryButton: {
    marginLeft: 4,
    padding: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
    margin: SIZES.margin,
    borderRadius: SIZES.radius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  welcomeText: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.marginSmall,
  },
  welcomeSubtext: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  section: {
    margin: SIZES.margin,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.marginSmall,
  },
  healthGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  healthLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  healthValue: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  healthDetail: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.marginSmall,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.marginSmall,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: SIZES.caption,
    color: COLORS.text,
    marginTop: SIZES.marginSmall,
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.paddingSmall,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  activityContent: {
    flex: 1,
    marginLeft: SIZES.marginSmall,
  },
  activityText: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  activityTime: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default DashboardScreen;
