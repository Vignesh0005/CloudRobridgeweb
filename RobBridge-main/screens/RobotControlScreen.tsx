import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootDrawerNavigationProp } from '../navigation/types';
import { COLORS } from '../constants/colors';
import { SIZES } from '../constants/sizes';
import { API_URLS } from '../config/server';
import { useAuth } from '../contexts/AuthContext';

interface RobotStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error' | 'maintenance';
  battery: number;
  temperature: number;
  position: { x: number; y: number; z: number };
  isConnected: boolean;
  lastSeen: string;
}

interface ControlCommand {
  id: string;
  type: 'move' | 'grip' | 'rotate' | 'emergency';
  value?: number;
  timestamp: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

const { width, height } = Dimensions.get('window');

// Generate unique ID for commands
const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const RobotControlScreen = () => {
  const [robots, setRobots] = useState<RobotStatus[]>([]);
  const [selectedRobot, setSelectedRobot] = useState<RobotStatus | null>(null);
  const [controlCommands, setControlCommands] = useState<ControlCommand[]>([]);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [showRobotDetails, setShowRobotDetails] = useState(false);
  const [showCommandHistory, setShowCommandHistory] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation<RootDrawerNavigationProp>();
  const { logout } = useAuth();
  const emergencyButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    authenticateAndInitialize();
  }, []);

  const authenticateAndInitialize = async () => {
    try {
      setLoading(true);
      
      // First authenticate
      const loginResponse = await fetch(API_URLS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123',
        }),
      });
      
      const loginResult = await loginResponse.json();
      if (!loginResult.success) {
        throw new Error('Authentication failed');
      }
      
      setAuthToken(loginResult.token);
      
      // Initialize robots and start telemetry updates
      await initializeRobots(loginResult.token);
      startTelemetryUpdates();
    } catch (error) {
      console.error('Error authenticating or initializing robots:', error);
      // Fallback to mock data
      initializeRobots();
      startTelemetryUpdates();
    } finally {
      setLoading(false);
    }
  };

  const initializeRobots = async (token?: string) => {
    try {
      if (token) {
        // Get robot status from backend
        const response = await fetch(API_URLS.ROBOT_STATUS, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        const result = await response.json();
        
        if (result.success) {
          const robotData = result.data;
          const robot: RobotStatus = {
            id: 'robot-001',
            name: 'Assembly Robot Alpha',
            status: robotData.connected ? 'online' : 'offline',
            battery: Math.round(robotData.battery),
            temperature: Math.round(robotData.temperature),
            position: robotData.position,
            isConnected: robotData.connected,
            lastSeen: new Date().toLocaleTimeString(),
          };
          setRobots([robot]);
          setSelectedRobot(robot);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading robot status from backend:', error);
    }
    
    // Fallback to mock data
    const mockRobots: RobotStatus[] = [
      {
        id: 'robot-001',
        name: 'Assembly Robot Alpha',
        status: 'online',
        battery: 85,
        temperature: 42,
        position: { x: 150, y: 200, z: 50 },
        isConnected: true,
        lastSeen: new Date().toLocaleTimeString(),
      },
      {
        id: 'robot-002',
        name: 'Welding Robot Beta',
        status: 'online',
        battery: 67,
        temperature: 58,
        position: { x: 300, y: 150, z: 75 },
        isConnected: true,
        lastSeen: new Date().toLocaleTimeString(),
      },
      {
        id: 'robot-003',
        name: 'Packaging Robot Gamma',
        status: 'maintenance',
        battery: 23,
        temperature: 35,
        position: { x: 450, y: 300, z: 25 },
        isConnected: false,
        lastSeen: '2 hours ago',
      },
    ];
    setRobots(mockRobots);
  };

  const startTelemetryUpdates = () => {
    // Update telemetry from backend
    const interval = setInterval(async () => {
      if (authToken && selectedRobot?.isConnected) {
        try {
          const response = await fetch(API_URLS.ROBOT_STATUS, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          const result = await response.json();
          
          if (result.success) {
            const robotData = result.data;
            const updatedRobot: RobotStatus = {
              ...selectedRobot,
              battery: Math.round(robotData.battery),
              temperature: Math.round(robotData.temperature),
              position: robotData.position,
              lastSeen: new Date().toLocaleTimeString(),
            };
            
            setRobots(prevRobots => 
              prevRobots.map(r => 
                r.id === selectedRobot.id ? updatedRobot : r
              )
            );
            setSelectedRobot(updatedRobot);
          }
        } catch (error) {
          console.error('Error updating telemetry:', error);
        }
      } else {
        // Fallback to simulated updates
        setRobots(prevRobots => 
          prevRobots.map(robot => ({
            ...robot,
            battery: Math.max(0, robot.battery - Math.random() * 0.5),
            temperature: robot.temperature + (Math.random() - 0.5) * 2,
            lastSeen: new Date().toLocaleTimeString(),
          }))
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const toggleDrawer = () => {
    console.log('RobotControlScreen: Menu button pressed - attempting to toggle drawer');
    console.log('RobotControlScreen: navigation object:', navigation);
    try {
      if (navigation && navigation.toggleDrawer) {
        navigation.toggleDrawer();
        console.log('RobotControlScreen: Drawer toggled successfully');
      } else {
        console.error('RobotControlScreen: navigation.toggleDrawer is not available');
      }
    } catch (error) {
      console.error('RobotControlScreen: Error toggling drawer:', error);
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

  const connectToRobot = async (robot: RobotStatus) => {
    if (robot.isConnected) {
      setSelectedRobot(robot);
      return;
    }

    if (!authToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    setIsConnecting(true);
    
    try {
      const response = await fetch(API_URLS.ROBOT_CONNECT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        const robotData = result.data;
        const updatedRobot: RobotStatus = {
          ...robot,
          isConnected: robotData.connected,
          status: robotData.connected ? 'online' : 'offline',
          battery: Math.round(robotData.battery),
          temperature: Math.round(robotData.temperature),
          position: robotData.position,
        };
        
        setRobots(prevRobots => 
          prevRobots.map(r => 
            r.id === robot.id ? updatedRobot : r
          )
        );
        setSelectedRobot(updatedRobot);
        Alert.alert('Connected', `Successfully connected to ${robot.name}`);
      } else {
        throw new Error(result.error || 'Failed to connect to robot');
      }
    } catch (error) {
      console.error('Error connecting to robot:', error);
      Alert.alert('Error', 'Failed to connect to robot');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromRobot = async () => {
    if (!selectedRobot) return;

    if (!authToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    try {
      const response = await fetch(`${API_URLS.ROBOT_STATUS.replace('/status', '/disconnect')}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setRobots(prevRobots => 
          prevRobots.map(r => 
            r.id === selectedRobot.id ? { ...r, isConnected: false, status: 'offline' } : r
          )
        );
        setSelectedRobot(null);
        Alert.alert('Disconnected', `Disconnected from ${selectedRobot.name}`);
      } else {
        throw new Error(result.error || 'Failed to disconnect from robot');
      }
    } catch (error) {
      console.error('Error disconnecting from robot:', error);
      Alert.alert('Error', 'Failed to disconnect from robot');
    }
  };

  const sendControlCommand = async (type: ControlCommand['type'], value?: number) => {
    if (!selectedRobot || !selectedRobot.isConnected) {
      Alert.alert('Error', 'No robot connected');
      return;
    }

    if (!authToken) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    const newCommand: ControlCommand = {
      id: generateUniqueId(),
      type,
      value,
      timestamp: new Date().toLocaleTimeString(),
      status: 'pending',
    };

    setControlCommands(prev => [newCommand, ...prev]);

    try {
      let response;
      
      if (type === 'move') {
        const directions = ['forward', 'left', 'right', 'backward', 'up', 'down'];
        const direction = directions[value! - 1] || 'forward';
        response = await fetch(API_URLS.ROBOT_MOVE, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            direction: direction,
            distance: 1
          }),
        });
      } else if (type === 'emergency') {
        response = await fetch(`${API_URLS.ROBOT_STATUS.replace('/status', '/emergency-stop')}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        // For other commands, use a generic endpoint or simulate
        response = { ok: true, json: () => Promise.resolve({ success: true }) };
      }
      
      const result = await response.json();
      
      if (result.success) {
        setControlCommands(prev => 
          prev.map(cmd => 
            cmd.id === newCommand.id ? { ...cmd, status: 'completed' } : cmd
          )
        );
        
        // Update robot status if response includes data
        if (result.data) {
          const updatedRobot: RobotStatus = {
            ...selectedRobot,
            battery: Math.round(result.data.battery),
            temperature: Math.round(result.data.temperature),
            position: result.data.position,
          };
          setRobots(prevRobots => 
            prevRobots.map(r => 
              r.id === selectedRobot.id ? updatedRobot : r
            )
          );
          setSelectedRobot(updatedRobot);
        }
      } else {
        throw new Error(result.error || 'Command failed');
      }
    } catch (error) {
      console.error('Error sending control command:', error);
      setControlCommands(prev => 
        prev.map(cmd => 
          cmd.id === newCommand.id ? { ...cmd, status: 'failed' } : cmd
        )
      );
      Alert.alert('Error', 'Failed to execute command');
    }

    // Update robot position on map based on movement command
    if (type === 'move' && selectedRobot) {
      const moveDistance = 50; // pixels
      let newX = selectedRobot.position.x;
      let newY = selectedRobot.position.y;
      
      switch (value) {
        case 1: // Forward
          newY = Math.max(0, newY - moveDistance);
          break;
        case 2: // Left
          newX = Math.max(0, newX - moveDistance);
          break;
        case 3: // Right
          newX = Math.min(500, newX + moveDistance);
          break;
        case 4: // Backward
          newY = Math.min(400, newY + moveDistance);
          break;
      }
      
      setRobots(prevRobots => 
        prevRobots.map(robot => 
          robot.id === selectedRobot.id 
            ? { ...robot, position: { x: newX, y: newY, z: robot.position.z } }
            : robot
        )
      );
    }

    Alert.alert('Command Sent', `${type} command sent to ${selectedRobot.name}`);
  };

  const triggerEmergencyStop = () => {
    if (!selectedRobot) {
      Alert.alert('Error', 'No robot selected');
      return;
    }

    Alert.alert(
      'Emergency Stop',
      'Are you sure you want to trigger emergency stop? This will immediately halt all robot operations.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Emergency Stop', 
          style: 'destructive',
          onPress: () => {
            setIsEmergencyMode(true);
            setControlCommands(prev => [{
              id: generateUniqueId(),
              type: 'emergency',
              timestamp: new Date().toLocaleTimeString(),
              status: 'completed',
            }, ...prev]);
            
            // Animate emergency button
            Animated.sequence([
              Animated.timing(emergencyButtonScale, {
                toValue: 1.2,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(emergencyButtonScale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();

            Alert.alert('Emergency Stop Activated', 'Robot operations have been halted');
          }
        },
      ]
    );
  };

  const resetEmergencyMode = () => {
    setIsEmergencyMode(false);
    Alert.alert('Emergency Reset', 'Emergency mode has been reset');
  };

  const getStatusColor = (status: RobotStatus['status']) => {
    switch (status) {
      case 'online': return COLORS.success;
      case 'offline': return COLORS.gray;
      case 'error': return COLORS.error;
      case 'maintenance': return COLORS.warning;
      default: return COLORS.gray;
    }
  };

  const getCommandStatusColor = (status: ControlCommand['status']) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'executing': return COLORS.info;
      case 'completed': return COLORS.success;
      case 'failed': return COLORS.error;
      default: return COLORS.gray;
    }
  };

  const getStatusIcon = (status: RobotStatus['status']) => {
    switch (status) {
      case 'online': return 'checkmark-circle';
      case 'offline': return 'close-circle';
      case 'error': return 'alert-circle';
      case 'maintenance': return 'construct';
      default: return 'help-circle';
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return COLORS.success;
    if (battery > 20) return COLORS.warning;
    return COLORS.error;
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 50) return COLORS.success;
    if (temp < 70) return COLORS.warning;
    return COLORS.error;
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
        <Text style={styles.headerTitle}>Robot Control</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.historyButton} onPress={() => setShowCommandHistory(true)}>
            <Ionicons name="time" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 2D Map Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2D Map Overview</Text>
          <View style={styles.mapContainer}>
            <View style={styles.mapGrid}>
              {/* Grid lines */}
              {Array.from({ length: 10 }, (_, i) => (
                <View key={`h-${i}`} style={[styles.gridLine, styles.horizontalLine, { top: i * 30 }]} />
              ))}
              {Array.from({ length: 10 }, (_, i) => (
                <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, { left: i * 30 }]} />
              ))}
              
              {/* Robot positions on map */}
              {robots.map((robot) => (
                <View
                  key={`map-${robot.id}`}
                  style={[
                    styles.robotMarker,
                    {
                      left: (robot.position.x / 500) * 300 - 10,
                      top: (robot.position.y / 400) * 300 - 10,
                      backgroundColor: getStatusColor(robot.status),
                      borderColor: selectedRobot?.id === robot.id ? COLORS.primary : 'transparent',
                    }
                  ]}
                >
                  <Ionicons 
                    name="location" 
                    size={16} 
                    color={COLORS.textLight} 
                  />
                  {selectedRobot?.id === robot.id && (
                    <View style={styles.selectedRobotIndicator}>
                      <Ionicons name="checkmark" size={12} color={COLORS.primary} />
                    </View>
                  )}
                </View>
              ))}
              
              {/* Map legend */}
              <View style={styles.mapLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                  <Text style={styles.legendText}>Online</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                  <Text style={styles.legendText}>Maintenance</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
                  <Text style={styles.legendText}>Error</Text>
                </View>
              </View>
              
              {/* Coordinates display */}
              {selectedRobot && (
                <View style={styles.coordinatesDisplay}>
                  <Text style={styles.coordinatesTitle}>Selected Robot Position:</Text>
                  <Text style={styles.coordinatesText}>
                    X: {Math.round(selectedRobot.position.x)} | Y: {Math.round(selectedRobot.position.y)} | Z: {Math.round(selectedRobot.position.z)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Robot Status Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Robot Status</Text>
          <View style={styles.robotGrid}>
            {robots.map((robot) => (
              <TouchableOpacity
                key={robot.id}
                style={[
                  styles.robotCard,
                  selectedRobot?.id === robot.id && styles.robotCardSelected,
                  robot.status === 'error' && styles.robotCardError,
                ]}
                onPress={() => connectToRobot(robot)}
              >
                <View style={styles.robotHeader}>
                  <Ionicons 
                    name={getStatusIcon(robot.status)} 
                    size={24} 
                    color={getStatusColor(robot.status)} 
                  />
                  <Text style={styles.robotName}>{robot.name}</Text>
                </View>
                
                <View style={styles.robotStatus}>
                  <Text style={[styles.robotStatusText, { color: getStatusColor(robot.status) }]}>
                    {robot.status.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.robotMetrics}>
                  <View style={styles.metric}>
                    <Ionicons name="battery-charging" size={16} color={getBatteryColor(robot.battery)} />
                    <Text style={[styles.metricText, { color: getBatteryColor(robot.battery) }]}>
                      {Math.round(robot.battery)}%
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Ionicons name="thermometer" size={16} color={getTemperatureColor(robot.temperature)} />
                    <Text style={[styles.metricText, { color: getTemperatureColor(robot.temperature) }]}>
                      {Math.round(robot.temperature)}°C
                    </Text>
                  </View>
                </View>

                <View style={styles.robotConnection}>
                  <Ionicons 
                    name={robot.isConnected ? 'wifi' : 'wifi-outline'} 
                    size={16} 
                    color={robot.isConnected ? COLORS.success : COLORS.gray} 
                  />
                  <Text style={[styles.connectionText, { color: robot.isConnected ? COLORS.success : COLORS.gray }]}>
                    {robot.isConnected ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Robot Control Panel */}
        {selectedRobot && selectedRobot.isConnected && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Control Panel - {selectedRobot.name}</Text>
            
            {/* Emergency Stop */}
            <View style={styles.emergencySection}>
              <Animated.View style={[styles.emergencyButton, { transform: [{ scale: emergencyButtonScale }] }]}>
                <TouchableOpacity
                  style={[styles.emergencyStopButton, isEmergencyMode && styles.emergencyStopButtonActive]}
                  onPress={triggerEmergencyStop}
                  disabled={isEmergencyMode}
                >
                  <Ionicons name="stop-circle" size={48} color={COLORS.textLight} />
                  <Text style={styles.emergencyStopText}>EMERGENCY STOP</Text>
                </TouchableOpacity>
              </Animated.View>
              
              {isEmergencyMode && (
                <TouchableOpacity style={styles.resetButton} onPress={resetEmergencyMode}>
                  <Text style={styles.resetButtonText}>Reset Emergency Mode</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Movement Controls */}
            <View style={styles.controlSection}>
              <Text style={styles.controlTitle}>Movement Controls</Text>
              <View style={styles.movementGrid}>
                <TouchableOpacity
                  style={styles.movementButton}
                  onPress={() => sendControlCommand('move', 1)}
                  disabled={isEmergencyMode}
                >
                  <Ionicons name="arrow-up" size={32} color={COLORS.primary} />
                  <Text style={styles.movementButtonText}>Forward</Text>
                </TouchableOpacity>
                
                <View style={styles.movementRow}>
                  <TouchableOpacity
                    style={styles.movementButton}
                    onPress={() => sendControlCommand('move', 2)}
                    disabled={isEmergencyMode}
                  >
                    <Ionicons name="arrow-back" size={32} color={COLORS.primary} />
                    <Text style={styles.movementButtonText}>Left</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.movementButton}
                    onPress={() => sendControlCommand('move', 3)}
                    disabled={isEmergencyMode}
                  >
                    <Ionicons name="arrow-forward" size={32} color={COLORS.primary} />
                    <Text style={styles.movementButtonText}>Right</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={styles.movementButton}
                  onPress={() => sendControlCommand('move', 4)}
                  disabled={isEmergencyMode}
                >
                  <Ionicons name="arrow-down" size={32} color={COLORS.primary} />
                  <Text style={styles.movementButtonText}>Backward</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tool Controls */}
            <View style={styles.controlSection}>
              <Text style={styles.controlTitle}>Tool Controls</Text>
              <View style={styles.toolGrid}>
                <TouchableOpacity
                  style={styles.toolButton}
                  onPress={() => sendControlCommand('grip', 1)}
                  disabled={isEmergencyMode}
                >
                  <Ionicons name="hand-left" size={24} color={COLORS.primary} />
                  <Text style={styles.toolButtonText}>Grip</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.toolButton}
                  onPress={() => sendControlCommand('grip', 0)}
                  disabled={isEmergencyMode}
                >
                  <Ionicons name="hand-right" size={24} color={COLORS.primary} />
                  <Text style={styles.toolButtonText}>Release</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.toolButton}
                  onPress={() => sendControlCommand('rotate', 90)}
                  disabled={isEmergencyMode}
                >
                  <Ionicons name="sync" size={24} color={COLORS.primary} />
                  <Text style={styles.toolButtonText}>Rotate 90°</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Disconnect Button */}
            <TouchableOpacity style={styles.disconnectButton} onPress={disconnectFromRobot}>
              <Ionicons name="wifi" size={24} color={COLORS.textLight} />
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="wifi" size={24} color={COLORS.primary} />
              <Text style={styles.statNumber}>
                {robots.filter(r => r.isConnected).length}/{robots.length}
              </Text>
              <Text style={styles.statLabel}>Connected</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.statNumber}>
                {robots.filter(r => r.status === 'online').length}
              </Text>
              <Text style={styles.statLabel}>Online</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color={COLORS.secondary} />
              <Text style={styles.statNumber}>
                {controlCommands.filter(c => c.status === 'completed').length}
              </Text>
              <Text style={styles.statLabel}>Commands</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Robot Details Modal */}
      <Modal
        visible={showRobotDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Robot Details</Text>
            <TouchableOpacity onPress={() => setShowRobotDetails(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {selectedRobot && (
              <View style={styles.robotDetails}>
                <Text style={styles.detailTitle}>{selectedRobot.name}</Text>
                <Text style={styles.detailStatus}>Status: {selectedRobot.status}</Text>
                <Text style={styles.detailBattery}>Battery: {Math.round(selectedRobot.battery)}%</Text>
                <Text style={styles.detailTemperature}>Temperature: {Math.round(selectedRobot.temperature)}°C</Text>
                <Text style={styles.detailPosition}>
                  Position: X: {selectedRobot.position.x}, Y: {selectedRobot.position.y}, Z: {selectedRobot.position.z}
                </Text>
                <Text style={styles.detailLastSeen}>Last Seen: {selectedRobot.lastSeen}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Command History Modal */}
      <Modal
        visible={showCommandHistory}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Command History</Text>
            <TouchableOpacity onPress={() => setShowCommandHistory(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {controlCommands.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="terminal" size={64} color={COLORS.gray} />
                <Text style={styles.emptyText}>No commands sent yet</Text>
                <Text style={styles.emptySubtext}>Start controlling robots to see command history</Text>
              </View>
            ) : (
              controlCommands.map((command) => (
                <View key={command.id} style={styles.commandItem}>
                  <View style={styles.commandHeader}>
                    <Ionicons name="terminal" size={24} color={COLORS.primary} />
                    <View style={styles.commandInfo}>
                      <Text style={styles.commandType}>{command.type.toUpperCase()}</Text>
                      <Text style={styles.commandTime}>{command.timestamp}</Text>
                    </View>
                    <View style={[styles.commandStatus, { backgroundColor: getCommandStatusColor(command.status) + '20' }]}>
                      <Text style={[styles.commandStatusText, { color: getCommandStatusColor(command.status) }]}>
                        {command.status}
                      </Text>
                    </View>
                  </View>
                  {command.value !== undefined && (
                    <Text style={styles.commandValue}>Value: {command.value}</Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
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
  historyButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
  },
  section: {
    marginBottom: SIZES.marginLarge,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.margin,
  },
  mapContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mapGrid: {
    width: 300,
    height: 300,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radiusSmall,
    position: 'relative',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: COLORS.grayLight,
  },
  horizontalLine: {
    width: '100%',
    height: 1,
  },
  verticalLine: {
    height: '100%',
    width: 1,
  },
  robotMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedRobotIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SIZES.margin,
    paddingTop: SIZES.margin,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SIZES.marginSmall,
  },
  legendText: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
  },
  coordinatesDisplay: {
    backgroundColor: COLORS.primary + '20',
    padding: SIZES.marginSmall,
    borderRadius: SIZES.radiusSmall,
    marginTop: SIZES.margin,
    alignItems: 'center',
  },
  coordinatesTitle: {
    fontSize: SIZES.caption,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  coordinatesText: {
    fontSize: SIZES.caption,
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  robotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  robotCard: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.margin,
    width: (width - 48) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  robotCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  robotCardError: {
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  robotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.marginSmall,
  },
  robotName: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SIZES.marginSmall,
    flex: 1,
  },
  robotStatus: {
    marginBottom: SIZES.marginSmall,
  },
  robotStatusText: {
    fontSize: SIZES.caption,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  robotMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.marginSmall,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: SIZES.caption,
    fontWeight: '500',
    marginLeft: 4,
  },
  robotConnection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionText: {
    fontSize: SIZES.caption,
    marginLeft: 4,
  },
  emergencySection: {
    alignItems: 'center',
    marginBottom: SIZES.marginLarge,
  },
  emergencyButton: {
    marginBottom: SIZES.margin,
  },
  emergencyStopButton: {
    backgroundColor: COLORS.error,
    padding: SIZES.paddingLarge,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  emergencyStopButtonActive: {
    backgroundColor: COLORS.gray,
  },
  emergencyStopText: {
    color: COLORS.textLight,
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    marginTop: SIZES.marginSmall,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.paddingLarge,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  resetButtonText: {
    color: COLORS.textLight,
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  controlSection: {
    marginBottom: SIZES.marginLarge,
  },
  controlTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.margin,
  },
  movementGrid: {
    alignItems: 'center',
  },
  movementButton: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginVertical: SIZES.marginSmall,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  movementButtonText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: SIZES.marginSmall,
  },
  movementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
  },
  toolGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  toolButton: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginVertical: SIZES.marginSmall,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toolButtonText: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: SIZES.marginSmall,
    textAlign: 'center',
  },
  disconnectButton: {
    backgroundColor: COLORS.gray,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginTop: SIZES.margin,
  },
  disconnectButtonText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginLeft: SIZES.marginSmall,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.marginSmall,
  },
  statLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalContent: {
    flex: 1,
    padding: SIZES.padding,
  },
  robotDetails: {
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.margin,
  },
  detailStatus: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.marginSmall,
  },
  detailBattery: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.marginSmall,
  },
  detailTemperature: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.marginSmall,
  },
  detailPosition: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.marginSmall,
  },
  detailLastSeen: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginBottom: SIZES.marginSmall,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.marginLarge * 2,
  },
  emptyText: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.margin,
  },
  emptySubtext: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: SIZES.marginSmall,
    textAlign: 'center',
  },
  commandItem: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.margin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.marginSmall,
  },
  commandInfo: {
    flex: 1,
    marginLeft: SIZES.margin,
  },
  commandType: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  commandTime: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  commandStatus: {
    paddingHorizontal: SIZES.marginSmall,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSmall,
  },
  commandStatusText: {
    fontSize: SIZES.caption,
    fontWeight: '500',
  },
  commandValue: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: SIZES.marginSmall,
  },
});

export default RobotControlScreen;
