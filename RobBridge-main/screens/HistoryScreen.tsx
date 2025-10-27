import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootDrawerNavigationProp } from '../navigation/types';
import { COLORS } from '../constants/colors';
import { SIZES } from '../constants/sizes';
import { useAuth } from '../contexts/AuthContext';

// Import the logo image
const logoImage = require('../assets/logo.png');

interface HistoryEvent {
  id: string;
  type: 'scan' | 'robot' | 'warning' | 'image' | 'success' | 'error';
  message: string;
  timestamp: string;
  icon: string;
  details?: string;
}

const HistoryScreen = () => {
  const navigation = useNavigation<RootDrawerNavigationProp>();
  const { logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryEvent[]>([]);

  // Generate comprehensive history data
  const generateHistoryData = (): HistoryEvent[] => {
    const events: HistoryEvent[] = [
      // Recent events (last hour)
      { id: '1', type: 'scan', message: 'Barcode scanned: 123456789', timestamp: '2 min ago', icon: 'scan', details: 'Product: Widget A, Location: Rack A1' },
      { id: '2', type: 'robot', message: 'Robot moved to position (10, 20, 5)', timestamp: '5 min ago', icon: 'game-controller', details: 'Movement completed successfully' },
      { id: '3', type: 'warning', message: 'Battery level low: 15%', timestamp: '10 min ago', icon: 'warning', details: 'Robot needs charging' },
      { id: '4', type: 'image', message: 'Image processed successfully', timestamp: '15 min ago', icon: 'image', details: 'Product image analyzed' },
      { id: '5', type: 'scan', message: 'Barcode scanned: 987654321', timestamp: '18 min ago', icon: 'scan', details: 'Product: Widget B, Location: Rack B2' },
      { id: '6', type: 'robot', message: 'Robot returned to home position', timestamp: '22 min ago', icon: 'game-controller', details: 'Task completed' },
      { id: '7', type: 'success', message: 'Rack A1 inventory updated', timestamp: '25 min ago', icon: 'checkmark-circle', details: 'Stock count: 45 items' },
      { id: '8', type: 'scan', message: 'Barcode scanned: 456789123', timestamp: '28 min ago', icon: 'scan', details: 'Product: Widget C, Location: Rack C3' },
      { id: '9', type: 'robot', message: 'Robot started charging', timestamp: '30 min ago', icon: 'battery-charging', details: 'Charging at 85%' },
      { id: '10', type: 'image', message: 'Product image captured', timestamp: '35 min ago', icon: 'camera', details: 'High resolution image saved' },
      
      // Earlier events (last few hours)
      { id: '11', type: 'scan', message: 'Barcode scanned: 789123456', timestamp: '1 hour ago', icon: 'scan', details: 'Product: Widget D, Location: Rack D4' },
      { id: '12', type: 'robot', message: 'Robot maintenance completed', timestamp: '1.5 hours ago', icon: 'construct', details: 'Scheduled maintenance' },
      { id: '13', type: 'success', message: 'Daily inventory report generated', timestamp: '2 hours ago', icon: 'document-text', details: 'Report saved to system' },
      { id: '14', type: 'scan', message: 'Barcode scanned: 321654987', timestamp: '2.5 hours ago', icon: 'scan', details: 'Product: Widget E, Location: Rack E5' },
      { id: '15', type: 'robot', message: 'Robot calibration completed', timestamp: '3 hours ago', icon: 'settings', details: 'Precision calibration' },
      { id: '16', type: 'image', message: 'Batch image processing completed', timestamp: '3.5 hours ago', icon: 'images', details: '50 images processed' },
      { id: '17', type: 'warning', message: 'Network connection unstable', timestamp: '4 hours ago', icon: 'wifi', details: 'Connection restored' },
      { id: '18', type: 'scan', message: 'Barcode scanned: 654987321', timestamp: '4.5 hours ago', icon: 'scan', details: 'Product: Widget F, Location: Rack F6' },
      { id: '19', type: 'success', message: 'System backup completed', timestamp: '5 hours ago', icon: 'cloud-upload', details: 'Backup size: 2.3 GB' },
      { id: '20', type: 'robot', message: 'Robot path optimization completed', timestamp: '6 hours ago', icon: 'trending-up', details: 'Route efficiency improved' },
      
      // Older events (yesterday)
      { id: '21', type: 'scan', message: 'Barcode scanned: 147258369', timestamp: 'Yesterday', icon: 'scan', details: 'Product: Widget G, Location: Rack G7' },
      { id: '22', type: 'image', message: 'Quality check images processed', timestamp: 'Yesterday', icon: 'checkmark-circle', details: 'All products passed QC' },
      { id: '23', type: 'robot', message: 'Robot firmware updated', timestamp: 'Yesterday', icon: 'download', details: 'Version 2.1.3 installed' },
      { id: '24', type: 'success', message: 'Weekly report generated', timestamp: 'Yesterday', icon: 'bar-chart', details: 'Performance metrics updated' },
      { id: '25', type: 'scan', message: 'Barcode scanned: 369258147', timestamp: 'Yesterday', icon: 'scan', details: 'Product: Widget H, Location: Rack H8' },
    ];
    return events;
  };

  useEffect(() => {
    setHistoryData(generateHistoryData());
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setHistoryData(generateHistoryData());
      setRefreshing(false);
    }, 1000);
  }, []);

  const toggleDrawer = () => {
    console.log('HistoryScreen: Menu button pressed - attempting to toggle drawer');
    console.log('HistoryScreen: navigation object:', navigation);
    try {
      if (navigation && navigation.toggleDrawer) {
        navigation.toggleDrawer();
        console.log('HistoryScreen: Drawer toggled successfully');
      } else {
        console.error('HistoryScreen: navigation.toggleDrawer is not available');
      }
    } catch (error) {
      console.error('HistoryScreen: Error toggling drawer:', error);
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

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'scan': return 'scan';
      case 'robot': return 'game-controller';
      case 'warning': return 'warning';
      case 'image': return 'image';
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      default: return 'information-circle';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'scan': return COLORS.primary;
      case 'robot': return COLORS.primary;
      case 'warning': return COLORS.warning;
      case 'image': return COLORS.primary;
      case 'success': return COLORS.success;
      case 'error': return COLORS.error;
      default: return COLORS.primary;
    }
  };

  const filteredHistory = historyData.filter(event => event.type === 'scan');


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleDrawer}>
          <Ionicons name="menu" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Saved Barcodes</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>


      {/* History List */}
      <ScrollView
        style={styles.historyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredHistory.map((event) => (
          <View key={event.id} style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <Ionicons 
                name={getEventIcon(event.type) as any} 
                size={24} 
                color={getEventColor(event.type)} 
              />
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyMessage}>{event.message}</Text>
              {event.details && (
                <Text style={styles.historyDetails}>{event.details}</Text>
              )}
              <Text style={styles.historyTimestamp}>{event.timestamp}</Text>
            </View>
          </View>
        ))}
        
        {filteredHistory.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="scan-outline" size={64} color={COLORS.gray} />
            <Text style={styles.emptyStateText}>No scan events found</Text>
            <Text style={styles.emptyStateSubtext}>Scan some barcodes to see them here</Text>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    paddingTop: SIZES.padding + 20, // Account for status bar
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  logoutButton: {
    padding: 8,
  },
  historyList: {
    flex: 1,
    padding: SIZES.padding,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    marginBottom: SIZES.marginSmall,
    borderRadius: SIZES.radius,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  historyIcon: {
    marginRight: SIZES.margin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyMessage: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  historyDetails: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  historyTimestamp: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.paddingLarge * 2,
  },
  emptyStateText: {
    fontSize: SIZES.h4,
    color: COLORS.gray,
    marginTop: SIZES.margin,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: SIZES.body,
    color: COLORS.grayLight,
    marginTop: SIZES.marginSmall,
    textAlign: 'center',
  },
});

export default HistoryScreen;
