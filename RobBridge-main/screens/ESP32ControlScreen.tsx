import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootDrawerNavigationProp } from '../navigation/types';
import { COLORS } from '../constants/colors';
import { SIZES } from '../constants/sizes';
import ESP32Service, { ESP32Device, RobotCommand } from '../services/ESP32Service';

const ESP32ControlScreen = () => {
  const [devices, setDevices] = useState<ESP32Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [robotSpeed, setRobotSpeed] = useState(100);
  const [ledColor, setLedColor] = useState('#E3821E');
  const [ledBrightness, setLedBrightness] = useState(255);
  const [autoConnect, setAutoConnect] = useState(false);

  const navigation = useNavigation<RootDrawerNavigationProp>();

  useEffect(() => {
    initializeESP32();
    loadSettings();
  }, []);

  const initializeESP32 = async () => {
    setIsLoading(true);
    try {
      // Check if we have a previously connected device
      const lastDevice = await ESP32Service.getLastConnectedDevice();
      if (lastDevice) {
        setConnectedDevice(lastDevice);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to initialize ESP32 service:', error);
    }
    setIsLoading(false);
  };

  const loadSettings = async () => {
    // Load user settings if needed
  };

  const toggleDrawer = () => {
    console.log('ESP32ControlScreen: Menu button pressed - attempting to toggle drawer');
    console.log('ESP32ControlScreen: navigation object:', navigation);
    try {
      if (navigation && navigation.toggleDrawer) {
        navigation.toggleDrawer();
        console.log('ESP32ControlScreen: Drawer toggled successfully');
      } else {
        console.error('ESP32ControlScreen: navigation.toggleDrawer is not available');
      }
    } catch (error) {
      console.error('ESP32ControlScreen: Error toggling drawer:', error);
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    try {
      await ESP32Service.startScan();
      
      // Fetch devices from your scan endpoint
      const discoveredDevices = await ESP32Service.getDiscoveredDevices();
      setDevices(discoveredDevices);
      
      // Stop scanning after 3 seconds
      setTimeout(() => {
        ESP32Service.stopScan();
        setIsScanning(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to start scan:', error);
      setIsScanning(false);
    }
  };

  const fetchScanData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching scan data from ESP32 endpoint...');
      const discoveredDevices = await ESP32Service.getDiscoveredDevices();
      setDevices(discoveredDevices);
      console.log('Scan data received:', discoveredDevices);
    } catch (error) {
      console.error('Failed to fetch scan data:', error);
      Alert.alert('Error', 'Failed to fetch scan data from ESP32');
    }
    setIsLoading(false);
  };

  const connectToDevice = async (device: ESP32Device) => {
    setIsLoading(true);
    try {
      const success = await ESP32Service.connectToDevice(device.id);
      if (success) {
        setConnectedDevice(device.id);
        setIsConnected(true);
        setShowDeviceModal(false);
        Alert.alert('Success', `Connected to ${device.name}`);
      } else {
        Alert.alert('Error', 'Failed to connect to device');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      Alert.alert('Error', 'Connection failed');
    }
    setIsLoading(false);
  };

  const disconnect = async () => {
    setIsLoading(true);
    try {
      await ESP32Service.disconnect();
      setConnectedDevice(null);
      setIsConnected(false);
      Alert.alert('Success', 'Disconnected from ESP32');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
    setIsLoading(false);
  };

  const sendCommand = async (command: RobotCommand) => {
    if (!isConnected) {
      Alert.alert('Error', 'Not connected to ESP32');
      return;
    }

    try {
      const success = await ESP32Service.sendCommand(command);
      if (!success) {
        Alert.alert('Error', 'Failed to send command');
      }
    } catch (error) {
      console.error('Command failed:', error);
      Alert.alert('Error', 'Command failed');
    }
  };

  const renderDeviceItem = ({ item }: { item: ESP32Device }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
      disabled={isLoading}
    >
      <View style={styles.deviceInfo}>
        <Ionicons name="wifi" size={24} color={COLORS.primary} />
        <View style={styles.deviceDetails}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceId}>ID: {item.id}</Text>
          {item.ip && (
            <Text style={styles.deviceRSSI}>IP: {item.ip}:{item.port || 5000}</Text>
          )}
          <Text style={styles.deviceRSSI}>Signal: {item.rssi} dBm</Text>
          {item.status && (
            <Text style={styles.deviceStatus}>Status: {item.status}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
    </TouchableOpacity>
  );

  const renderControlButton = (
    icon: string,
    label: string,
    onPress: () => void,
    color: string = COLORS.primary
  ) => (
    <TouchableOpacity
      style={[styles.controlButton, { borderColor: color }]}
      onPress={onPress}
      disabled={!isConnected || isLoading}
    >
      <Ionicons name={icon as any} size={32} color={color} />
      <Text style={[styles.controlButtonText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleDrawer}>
          <Ionicons name="menu" size={28} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ESP32 Control</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={startScan}
          disabled={isScanning}
        >
          <Ionicons
            name={isScanning ? "stop" : "bluetooth"}
            size={24}
            color={COLORS.textLight}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={isConnected ? "checkmark-circle" : "close-circle"}
              size={24}
              color={isConnected ? COLORS.success : COLORS.error}
            />
            <Text style={styles.statusText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          {connectedDevice && (
            <Text style={styles.deviceInfo}>
              Device: {connectedDevice}
            </Text>
          )}
        </View>

        {/* Scan Buttons */}
        <View style={styles.scanButtonsContainer}>
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonActive]}
            onPress={startScan}
            disabled={isScanning}
          >
            <Ionicons
              name={isScanning ? "stop" : "search"}
              size={20}
              color={COLORS.textLight}
            />
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning...' : 'Scan for ESP32'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scanButton, styles.fetchButton]}
            onPress={fetchScanData}
            disabled={isLoading}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={COLORS.textLight}
            />
            <Text style={styles.scanButtonText}>
              {isLoading ? 'Fetching...' : 'Fetch Scan Data'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Device List */}
        {devices.length > 0 && (
          <View style={styles.deviceList}>
            <Text style={styles.deviceListTitle}>Available Devices</Text>
            <FlatList
              data={devices}
              renderItem={renderDeviceItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Robot Controls */}
        {isConnected && (
          <View style={styles.controlsSection}>
            <Text style={styles.controlsTitle}>Robot Controls</Text>
            
            {/* Movement Controls */}
            <View style={styles.movementControls}>
              <View style={styles.movementRow}>
                {renderControlButton('arrow-up', 'Forward', () => sendCommand({
                  action: 'move',
                  direction: 'forward',
                  speed: robotSpeed,
                }))}
              </View>
              
              <View style={styles.movementRow}>
                {renderControlButton('arrow-back', 'Left', () => sendCommand({
                  action: 'turn',
                  direction: 'left',
                  angle: 90,
                }))}
                {renderControlButton('stop', 'Stop', () => sendCommand({
                  action: 'stop',
                  direction: 'stop',
                }), COLORS.error)}
                {renderControlButton('arrow-forward', 'Right', () => sendCommand({
                  action: 'turn',
                  direction: 'right',
                  angle: 90,
                }))}
              </View>
              
              <View style={styles.movementRow}>
                {renderControlButton('arrow-down', 'Backward', () => sendCommand({
                  action: 'move',
                  direction: 'backward',
                  speed: robotSpeed,
                }))}
              </View>
            </View>

            {/* Speed Control */}
            <View style={styles.speedControl}>
              <Text style={styles.speedLabel}>Speed: {robotSpeed}%</Text>
              <View style={styles.speedSlider}>
                <TouchableOpacity
                  style={styles.speedButton}
                  onPress={() => setRobotSpeed(Math.max(0, robotSpeed - 10))}
                >
                  <Text style={styles.speedButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.speedValue}>{robotSpeed}</Text>
                <TouchableOpacity
                  style={styles.speedButton}
                  onPress={() => setRobotSpeed(Math.min(100, robotSpeed + 10))}
                >
                  <Text style={styles.speedButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* LED Controls */}
            <View style={styles.ledControl}>
              <Text style={styles.ledLabel}>LED Control</Text>
              <View style={styles.ledButtons}>
                {['#E3821E', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.ledButton, { backgroundColor: color }]}
                    onPress={() => {
                      setLedColor(color);
                      sendCommand({
                        action: 'led',
                        color: color,
                        brightness: ledBrightness,
                      });
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Disconnect Button */}
            <TouchableOpacity
              style={[styles.disconnectButton]}
              onPress={disconnect}
              disabled={isLoading}
            >
              <Ionicons name="bluetooth-off" size={20} color={COLORS.error} />
              <Text style={[styles.disconnectButtonText, { color: COLORS.error }]}>
                Disconnect
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </View>
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
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.textLight,
    textAlign: 'center',
    marginLeft: -40,
  },
  scanButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.marginSmall,
  },
  statusText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SIZES.marginSmall,
  },
  deviceInfo: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
  },
  scanButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.margin,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    flex: 0.48,
  },
  fetchButton: {
    backgroundColor: COLORS.secondary,
  },
  scanButtonActive: {
    backgroundColor: COLORS.error,
  },
  scanButtonText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginLeft: SIZES.marginSmall,
  },
  deviceList: {
    marginBottom: SIZES.marginLarge,
  },
  deviceListTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.margin,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceDetails: {
    flex: 1,
    marginLeft: SIZES.margin,
  },
  deviceName: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  deviceId: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
  },
  deviceRSSI: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
  },
  deviceStatus: {
    fontSize: SIZES.caption,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  controlsSection: {
    marginTop: SIZES.marginLarge,
  },
  controlsTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.margin,
  },
  movementControls: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
  },
  movementRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: SIZES.marginSmall,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    backgroundColor: COLORS.background,
  },
  controlButtonText: {
    fontSize: SIZES.caption,
    fontWeight: 'bold',
    marginTop: 4,
  },
  speedControl: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
  },
  speedLabel: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.margin,
  },
  speedSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedButtonText: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  speedValue: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginHorizontal: SIZES.marginLarge,
  },
  ledControl: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.margin,
  },
  ledLabel: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.margin,
  },
  ledButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ledButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.gray,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  disconnectButtonText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginLeft: SIZES.marginSmall,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: SIZES.body,
    color: COLORS.textLight,
    marginTop: SIZES.margin,
  },
});

export default ESP32ControlScreen;

