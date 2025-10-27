import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootDrawerNavigationProp } from '../navigation/types';
import { COLORS } from '../constants/colors';
import { SIZES } from '../constants/sizes';
import { API_URLS } from '../config/server';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';

interface ScanResult {
  id: string;
  barcodeData: string;
  scanType: string;
  timestamp: string;
  deviceId: string;
  deviceName: string;
  source: string;
  aiAnalysis?: {
    title?: string;
    category?: string;
    description?: string;
    description_short?: string;
    country?: string;
    success?: boolean;
  };
}

interface ESP32Device {
  deviceId: string;
  deviceName: string;
  status: string;
  ipAddress: string;
  totalScans: number;
  lastSeen: string;
}

const { width, height } = Dimensions.get('window');

const BarcodeScannerScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<RootDrawerNavigationProp>();
  const { logout } = useAuth();
  const { isConnected, esp32Devices, latestScan, isProcessingScan, setLatestScan } = useWebSocket();

  useEffect(() => {
    // WebSocket context handles connection and device loading
    console.log('📱 BarcodeScannerScreen mounted');
  }, []);

  const resetScanner = () => {
    setLatestScan(null);
  };

  const saveCurrentScan = async () => {
    if (!latestScan) {
      Alert.alert('No Scan', 'No scan to save');
      return;
    }

    console.log('🔍 Latest scan data for saving:', {
      source: latestScan.source,
      deviceName: latestScan.deviceName,
      barcodeData: latestScan.barcodeData
    });

    // Only allow ESP32 source scans to be saved
    const source = (latestScan.source || '').toUpperCase();
    if (source !== 'ESP32') {
      Alert.alert('Error', `Only ESP32 source scans can be saved. Current source: "${latestScan.source}"`);
      return;
    }

    try {
      const response = await fetch(API_URLS.SAVE_SCAN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode_data: latestScan.barcodeData,
          barcode_type: latestScan.scanType || 'unknown',
          source: latestScan.source || 'ESP32',
          product_name: latestScan.aiAnalysis?.title || 'Unknown Product',
          category: latestScan.aiAnalysis?.category || 'Unknown',
          price: 0,
          description: latestScan.aiAnalysis?.description || '',
          metadata: {
            deviceId: latestScan.deviceId,
            deviceName: latestScan.deviceName,
            aiAnalysis: latestScan.aiAnalysis,
            timestamp: latestScan.timestamp
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Success', '✅ Scan saved successfully! View in "Saved Scans" page.');
      } else {
        if (result.duplicate) {
          Alert.alert('Warning', `⚠️ ${result.error}\n\nLast saved: ${new Date(result.lastSaved).toLocaleString()}`);
        } else {
          Alert.alert('Error', `❌ Failed to save scan: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error saving scan:', error);
      Alert.alert('Error', '❌ Error saving scan. Please ensure the server is running.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // WebSocket context handles refreshing automatically
      console.log('🔄 Refreshing scanner data...');
    } finally {
      setRefreshing(false);
    }
  };

  const toggleDrawer = () => {
    console.log('BarcodeScannerScreen: Menu button pressed - attempting to toggle drawer');
    console.log('BarcodeScannerScreen: navigation object:', navigation);
    try {
      if (navigation && navigation.toggleDrawer) {
        navigation.toggleDrawer();
        console.log('BarcodeScannerScreen: Drawer toggled successfully');
      } else {
        console.error('BarcodeScannerScreen: navigation.toggleDrawer is not available');
      }
    } catch (error) {
      console.error('BarcodeScannerScreen: Error toggling drawer:', error);
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleDrawer}>
          <Ionicons name="menu" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Barcode Scanner</Text>
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

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Scanner Header */}
        <View style={styles.scannerHeader}>
          <Text style={styles.scannerTitle}>Barcode Scanner</Text>
          <Text style={styles.scannerSubtitle}>Scan barcodes using Device Connected for real-time processing</Text>
        </View>

        {/* Device Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, isConnected ? styles.connected : styles.disconnected]}>
            <Ionicons name="wifi" size={16} color={isConnected ? COLORS.success : COLORS.error} />
            <Text style={styles.statusText}>
              WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          <View style={styles.deviceCount}>
            <Ionicons name="hardware-chip" size={16} color={COLORS.primary} />
            <Text style={styles.deviceCountText}>
              Device Connected: {esp32Devices.length}
            </Text>
          </View>
        </View>

        {/* Main Content - Mobile Optimized Single Column */}
        <View style={styles.mobileContainer}>
          {/* ESP32 Devices Section */}
          <View style={styles.mobileSection}>
            <Text style={styles.sectionTitle}>Device Connected Scanner Status</Text>
            
            {esp32Devices.length > 0 ? (
              <View style={styles.devicesList}>
                <Text style={styles.devicesListTitle}>Connected Device Connected Devices</Text>
                {esp32Devices.map((device) => (
                  <View key={device.deviceId} style={styles.deviceCard}>
                    <View style={styles.deviceHeader}>
                      <Ionicons name="hardware-chip" size={20} color={COLORS.primary} />
                      <Text style={styles.deviceName}>{device.deviceName}</Text>
                      <View style={[styles.deviceStatus, device.status === 'connected' ? styles.connected : styles.disconnected]}>
                        <Text style={styles.deviceStatusText}>{device.status}</Text>
                      </View>
                    </View>
                    <View style={styles.deviceDetails}>
                      <Text style={styles.deviceDetail}><Text style={styles.deviceDetailLabel}>ID:</Text> {device.deviceId}</Text>
                      <Text style={styles.deviceDetail}><Text style={styles.deviceDetailLabel}>IP:</Text> {device.ipAddress}</Text>
                      <Text style={styles.deviceDetail}><Text style={styles.deviceDetailLabel}>Total Scans:</Text> {device.totalScans}</Text>
                      <Text style={styles.deviceDetail}><Text style={styles.deviceDetailLabel}>Last Seen:</Text> {new Date(device.lastSeen).toLocaleString()}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDevices}>
                <Ionicons name="hardware-chip" size={48} color={COLORS.gray} />
                <Text style={styles.noDevicesTitle}>No Device Connected Devices Connected</Text>
                <Text style={styles.noDevicesText}>Waiting for Device Connected devices to connect...</Text>
                <Text style={styles.noDevicesText}>Make sure your Device Connected is powered on and connected to WiFi.</Text>
              </View>
            )}
          </View>

          {/* Scan Results Section */}
          <View style={styles.mobileSection}>
            {isProcessingScan && !latestScan ? (
              <View style={styles.processingCard}>
                <Text style={styles.processingTitle}>Processing Scan...</Text>
                <View style={styles.processingInfo}>
                  <Text style={styles.processingText}>Status: Collecting data from ESP32...</Text>
                  <Text style={styles.processingText}>Please wait: Ensuring complete data before display</Text>
                </View>
              </View>
            ) : latestScan ? (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>Live Scan Result</Text>
                
                {/* Basic Information - Mobile Optimized */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>Basic Information</Text>
                  <View style={styles.mobileInfoGrid}>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Device</Text>
                      <Text style={styles.infoValue}>{latestScan.deviceName || 'Unknown Device'}</Text>
                    </View>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Source</Text>
                      <Text style={styles.infoValue}>{latestScan.source?.toUpperCase() || 'ESP32'}</Text>
                    </View>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Product Name</Text>
                      <Text style={styles.infoValue} numberOfLines={2}>{latestScan.aiAnalysis?.title || 'Unknown Product'}</Text>
                    </View>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Category</Text>
                      <Text style={styles.infoValue}>{latestScan.aiAnalysis?.category || 'Unknown'}</Text>
                    </View>
                    <View style={styles.infoField}>
                      <Text style={styles.infoLabel}>Scan Time</Text>
                      <Text style={styles.infoValue}>{new Date().toLocaleString()}</Text>
                    </View>
                  </View>
                </View>

                {/* Barcode Data */}
                <View style={styles.barcodeDataSection}>
                  <Text style={styles.barcodeDataTitle}>Barcode Data</Text>
                  <View style={styles.barcodeDataContainer}>
                    <Text style={styles.barcodeDataText} numberOfLines={3}>{latestScan.barcodeData}</Text>
                  </View>
                </View>

                {/* AI Analysis Results */}
                {(() => {
                  const deviceName = latestScan.deviceName || '';
                  const hasAI = deviceName && typeof deviceName === 'string' && deviceName.toUpperCase().includes('AI');
                  
                  if (hasAI) {
                    return (
                      <View style={styles.aiAnalysisSection}>
                        <Text style={styles.aiAnalysisTitle}>🤖 AI Analysis Results</Text>
                        <View style={styles.aiAnalysisContainer}>
                          <View style={styles.aiAnalysisField}>
                            <Text style={styles.aiAnalysisLabel}>Product:</Text>
                            <Text style={styles.aiAnalysisValue} numberOfLines={2}>
                              {latestScan.aiAnalysis?.title || 'Unknown Product'}
                            </Text>
                          </View>
                          
                          <View style={styles.aiAnalysisField}>
                            <Text style={styles.aiAnalysisLabel}>Category:</Text>
                            <Text style={styles.aiAnalysisValue}>
                              {latestScan.aiAnalysis?.category || 'Unknown'}
                            </Text>
                          </View>
                          
                          <View style={styles.aiAnalysisField}>
                            <Text style={styles.aiAnalysisLabel}>Success:</Text>
                            <View style={styles.aiAnalysisStatus}>
                              <Text style={styles.statusIcon}>✓</Text>
                              <Text style={styles.statusText}>
                                {latestScan.aiAnalysis?.title ? 'IDENTIFIED' : 'UNKNOWN'}
                              </Text>
                            </View>
                          </View>
                          
                          <View style={styles.aiAnalysisField}>
                            <Text style={styles.aiAnalysisLabel}>Description:</Text>
                            <View style={styles.aiAnalysisDescription}>
                              <Text style={styles.aiAnalysisDescriptionText} numberOfLines={4}>
                                {(() => {
                                  if (latestScan.aiAnalysis?.description) {
                                    return latestScan.aiAnalysis.description;
                                  }
                                  if (latestScan.aiAnalysis?.description_short) {
                                    return latestScan.aiAnalysis.description_short;
                                  }
                                  if (latestScan.aiAnalysis?.title) {
                                    return `Product identified: ${latestScan.aiAnalysis.title}`;
                                  }
                                  return 'No AI analysis available for this scan.';
                                })()}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  } else {
                    return null;
                  }
                })()}

                {/* Action Buttons - Mobile Optimized */}
                <View style={styles.mobileActionButtons}>
                  <TouchableOpacity style={styles.mobileActionButton} onPress={saveCurrentScan}>
                    <Ionicons name="checkmark" size={20} color={COLORS.white} />
                    <Text style={styles.mobileActionButtonText}>Validate Record</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.mobileActionButton, styles.secondaryButton]}>
                    <Ionicons name="download" size={20} color={COLORS.primary} />
                    <Text style={[styles.mobileActionButtonText, styles.secondaryButtonText]}>Export Result</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.mobileActionButton, styles.secondaryButton]} onPress={resetScanner}>
                    <Ionicons name="close" size={20} color={COLORS.primary} />
                    <Text style={[styles.mobileActionButtonText, styles.secondaryButtonText]}>Reset Scanner</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.noResultCard}>
                <Text style={styles.noResultTitle}>No Device Connected Scan</Text>
                <Text style={styles.noResultText}>Scan a barcode using your Device Connected scanner to see results here</Text>
              </View>
            )}
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
  content: {
    flex: 1,
  },
  scannerHeader: {
    padding: SIZES.padding,
    alignItems: 'center',
  },
  scannerTitle: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  scannerSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.padding,
    gap: SIZES.padding,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: 20,
    gap: SIZES.paddingSmall,
  },
  connected: {
    backgroundColor: COLORS.success + '20',
  },
  disconnected: {
    backgroundColor: COLORS.error + '20',
  },
  statusText: {
    fontSize: SIZES.body2,
    fontWeight: '500',
    color: COLORS.text,
  },
  deviceCount: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 20,
    gap: SIZES.paddingSmall,
  },
  deviceCountText: {
    fontSize: SIZES.body2,
    fontWeight: '500',
    color: COLORS.primary,
  },
  mobileContainer: {
    paddingHorizontal: SIZES.padding,
    gap: SIZES.padding,
  },
  mobileSection: {
    marginBottom: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  devicesList: {
    gap: SIZES.padding,
  },
  devicesListTitle: {
    fontSize: SIZES.h5,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  deviceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.grayDark,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.paddingSmall,
    gap: SIZES.paddingSmall,
  },
  deviceName: {
    flex: 1,
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  deviceStatus: {
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deviceStatusText: {
    fontSize: SIZES.caption,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  deviceDetails: {
    gap: SIZES.paddingSmall,
  },
  deviceDetail: {
    fontSize: SIZES.body2,
    color: COLORS.gray,
  },
  deviceDetailLabel: {
    fontWeight: '500',
    color: COLORS.text,
  },
  noDevices: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.paddingLarge,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    borderColor: COLORS.grayDark,
    borderStyle: 'dashed',
  },
  noDevicesTitle: {
    fontSize: SIZES.h5,
    fontWeight: '600',
    color: COLORS.gray,
    marginTop: SIZES.padding,
    marginBottom: SIZES.paddingSmall,
  },
  noDevicesText: {
    fontSize: SIZES.body2,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.paddingSmall,
  },
  resultsSection: {
    flex: 2,
  },
  processingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.grayDark,
  },
  processingTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  processingInfo: {
    gap: SIZES.paddingSmall,
  },
  processingText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.grayDark,
  },
  resultTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: SIZES.padding,
  },
  infoSectionTitle: {
    fontSize: SIZES.h5,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: SIZES.padding,
  },
  infoColumn: {
    flex: 1,
    gap: SIZES.padding,
  },
  mobileInfoGrid: {
    gap: SIZES.padding,
  },
  infoField: {
    gap: SIZES.paddingSmall,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.grayDark,
  },
  infoLabel: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: SIZES.body2,
    color: COLORS.text,
    fontWeight: '500',
  },
  barcodeDataSection: {
    marginBottom: SIZES.padding,
  },
  barcodeDataTitle: {
    fontSize: SIZES.h5,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  barcodeDataContainer: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.grayDark,
  },
  barcodeDataText: {
    fontFamily: 'monospace',
    fontSize: SIZES.body2,
    color: COLORS.gray,
  },
  aiAnalysisSection: {
    marginBottom: SIZES.padding,
  },
  aiAnalysisTitle: {
    fontSize: SIZES.h5,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  aiAnalysisContainer: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.grayDark,
  },
  aiAnalysisField: {
    marginBottom: SIZES.padding,
  },
  aiAnalysisLabel: {
    fontSize: SIZES.caption,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'uppercase',
    marginBottom: SIZES.paddingSmall,
  },
  aiAnalysisValue: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    backgroundColor: COLORS.surface,
    padding: SIZES.paddingSmall,
    borderRadius: SIZES.radiusSmall,
    borderWidth: 1,
    borderColor: COLORS.grayDark,
  },
  aiAnalysisStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.paddingSmall,
    color: COLORS.success,
    fontWeight: '600',
    fontSize: SIZES.body,
    backgroundColor: COLORS.success + '20',
    padding: SIZES.paddingSmall,
    borderRadius: SIZES.radiusSmall,
    borderWidth: 1,
    borderColor: COLORS.success + '40',
  },
  statusIcon: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: SIZES.body,
  },
  aiAnalysisDescription: {
    marginTop: SIZES.paddingSmall,
  },
  aiAnalysisDescriptionText: {
    fontSize: SIZES.body2,
    color: COLORS.gray,
    lineHeight: 20,
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radiusSmall,
    borderWidth: 1,
    borderColor: COLORS.grayDark,
    minHeight: 80,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SIZES.padding,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  mobileActionButtons: {
    gap: SIZES.padding,
  },
  mobileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    gap: SIZES.paddingSmall,
    justifyContent: 'center',
  },
  mobileActionButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    gap: SIZES.paddingSmall,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SIZES.paddingSmall,
  },
  exportButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SIZES.paddingSmall,
  },
  resetButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  noResultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.paddingLarge,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayDark,
    minHeight: 200,
  },
  noResultTitle: {
    fontSize: SIZES.h5,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: SIZES.paddingSmall,
  },
  noResultText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    textAlign: 'center',
  },
});

export default BarcodeScannerScreen;