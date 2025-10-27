import { PermissionsAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEVELOPMENT_CONFIG } from '../config/development';

export interface ESP32Device {
  id: string;
  name: string;
  rssi: number;
  advertising: any;
  ip?: string;
  port?: number;
  status?: string;
}

export interface RobotCommand {
  action: string;
  direction?: 'forward' | 'backward' | 'left' | 'right' | 'stop';
  speed?: number;
  angle?: number;
  duration?: number;
}

class ESP32Service {
  private connectedDevice: string | null = null;
  private isConnected: boolean = false;
  private isScanning: boolean = false;

  // ESP32 Network Configuration
  private readonly ESP32_SCAN_URL = 'http://192.168.104.1:5000/scan';
  private readonly ESP32_BASE_URL = 'http://192.168.104.1:5000';

  constructor() {
    this.initializeNetwork();
  }

  private async initializeNetwork() {
    try {
      // Initialize network connection to ESP32
      console.log('Network ESP32 service initialized successfully');
      console.log('Scanning endpoint:', this.ESP32_SCAN_URL);
    } catch (error) {
      console.error('Failed to initialize network ESP32 service:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    // Network requests don't require special permissions
    // Just check if we have network access
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        timeout: 5000 
      });
      return response.ok;
    } catch (error) {
      console.log('Network check failed, but local network should still work');
      return true; // Allow local network access even if internet is down
    }
  }

  async startScan(): Promise<void> {
    if (this.isScanning) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    try {
      this.isScanning = true;
      console.log('Starting network scan for ESP32 devices...');
      console.log('Scanning endpoint:', this.ESP32_SCAN_URL);
      
      // Simulate scanning process
      setTimeout(() => {
        console.log('Network scan completed');
        this.isScanning = false;
      }, 3000);
      
    } catch (error) {
      console.error('Failed to start network scan:', error);
      this.isScanning = false;
    }
  }

  async stopScan(): Promise<void> {
    try {
      this.isScanning = false;
      console.log('Stopped network scanning');
    } catch (error) {
      console.error('Failed to stop network scan:', error);
    }
  }

  async getDiscoveredDevices(): Promise<ESP32Device[]> {
    // Development mode - return mock data immediately
    if (DEVELOPMENT_CONFIG.IS_DEVELOPMENT_MODE && DEVELOPMENT_CONFIG.USE_MOCK_DATA) {
      console.log('Development mode: Using mock ESP32 devices');
      const mockDevices: ESP32Device[] = [
        {
          id: 'mock-esp32-001',
          name: 'RobridgeESP32 (Mock)',
          rssi: -45,
          advertising: { manufacturerData: 'Mock ESP32 Device' },
          ip: '192.168.104.1',
          port: 5000,
          status: 'Available'
        },
        {
          id: 'mock-esp32-002',
          name: 'ControllerESP32 (Mock)',
          rssi: -50,
          advertising: { manufacturerData: 'Mock Controller Device' },
          ip: '192.168.104.2',
          port: 5000,
          status: 'Available'
        }
      ];
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockDevices;
    }

    try {
      console.log('Fetching devices from:', this.ESP32_SCAN_URL);
      
      // Fetch data from your ESP32 scan endpoint
      const response = await fetch(this.ESP32_SCAN_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received scan data:', data);
        
        // Transform the data to match our ESP32Device interface
        const devices: ESP32Device[] = [];
        
        // Handle different response formats
        if (Array.isArray(data)) {
          // If data is already an array
          devices.push(...data.map((item: any, index: number) => ({
            id: item.id || `esp32-${index}`,
            name: item.name || item.device_name || 'ESP32 Device',
            rssi: item.rssi || item.signal || -50,
            advertising: item.advertising || {},
            ip: item.ip || '192.168.104.1',
            port: item.port || 5000,
            status: item.status || 'Available'
          })));
        } else if (data.devices && Array.isArray(data.devices)) {
          // If data has a devices property
          devices.push(...data.devices.map((item: any, index: number) => ({
            id: item.id || `esp32-${index}`,
            name: item.name || item.device_name || 'ESP32 Device',
            rssi: item.rssi || item.signal || -50,
            advertising: item.advertising || {},
            ip: item.ip || '192.168.104.1',
            port: item.port || 5000,
            status: item.status || 'Available'
          })));
        } else {
          // If data is a single object
          devices.push({
            id: data.id || 'esp32-001',
            name: data.name || data.device_name || 'ESP32 Device',
            rssi: data.rssi || data.signal || -50,
            advertising: data.advertising || {},
            ip: data.ip || '192.168.104.1',
            port: data.port || 5000,
            status: data.status || 'Available'
          });
        }
        
        console.log('Processed devices:', devices);
        return devices;
      } else {
        console.error('Failed to fetch scan data:', response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Failed to get discovered devices from network:', error);
      
      // Return mock devices as fallback
      const mockDevices: ESP32Device[] = [
        {
          id: 'mock-esp32-001',
          name: 'RobridgeESP32 (Mock)',
          rssi: -45,
          advertising: { manufacturerData: 'Mock ESP32 Device' },
          ip: '192.168.104.1',
          port: 5000,
          status: 'Available'
        }
      ];
      console.log('Returning mock devices as fallback');
      return mockDevices;
    }
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      console.log('Connecting to ESP32 device:', deviceId);
      
      // Test connection to the ESP32 endpoint
      const testUrl = `${this.ESP32_BASE_URL}/status`; // You can change this endpoint as needed
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });
      
      if (response.ok) {
        this.connectedDevice = deviceId;
        this.isConnected = true;
        
        // Save connected device
        await AsyncStorage.setItem('connectedESP32', deviceId);
        
        console.log('Connected to ESP32 via network:', deviceId);
        return true;
      } else {
        console.error('Failed to connect to ESP32:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Failed to connect to ESP32 device:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try {
        this.connectedDevice = null;
        this.isConnected = false;
        
        // Clear saved device
        await AsyncStorage.removeItem('connectedESP32');
        
        console.log('Mock disconnected from ESP32');
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    }
  }

  async sendCommand(command: RobotCommand): Promise<boolean> {
    if (!this.isConnected || !this.connectedDevice) {
      console.error('No ESP32 connected');
      return false;
    }

    try {
      // Mock command sending - simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Mock command sent to ESP32:', command);
      return true;
    } catch (error) {
      console.error('Failed to send command:', error);
      return false;
    }
  }

  // Predefined robot commands
  async moveForward(speed: number = 100): Promise<boolean> {
    return this.sendCommand({
      action: 'move',
      direction: 'forward',
      speed: speed,
    });
  }

  async moveBackward(speed: number = 100): Promise<boolean> {
    return this.sendCommand({
      action: 'move',
      direction: 'backward',
      speed: speed,
    });
  }

  async turnLeft(angle: number = 90): Promise<boolean> {
    return this.sendCommand({
      action: 'turn',
      direction: 'left',
      angle: angle,
    });
  }

  async turnRight(angle: number = 90): Promise<boolean> {
    return this.sendCommand({
      action: 'turn',
      direction: 'right',
      angle: angle,
    });
  }

  async stop(): Promise<boolean> {
    return this.sendCommand({
      action: 'stop',
      direction: 'stop',
    });
  }

  async setLED(color: string, brightness: number = 255): Promise<boolean> {
    return this.sendCommand({
      action: 'led',
      color: color,
      brightness: brightness,
    });
  }

  async getStatus(): Promise<any> {
    if (!this.isConnected || !this.connectedDevice) {
      return null;
    }

    try {
      // Mock status data
      const mockStatus = {
        connected: true,
        battery: Math.floor(Math.random() * 40) + 60, // 60-100%
        distance: Math.floor(Math.random() * 200) + 10, // 10-210 cm
        temperature: Math.floor(Math.random() * 20) + 25, // 25-45°C
        motors_enabled: Math.random() > 0.5,
        motor1_speed: Math.floor(Math.random() * 100),
        motor2_speed: Math.floor(Math.random() * 100),
        led_enabled: Math.random() > 0.5,
        led_color: '#E3821E',
        last_command: 'move',
        uptime: Math.floor(Math.random() * 3600) + 100 // 100-3700 seconds
      };
      
      console.log('Mock status received from ESP32:', mockStatus);
      return mockStatus;
    } catch (error) {
      console.error('Failed to get status:', error);
      return null;
    }
  }

  // Getters
  getConnectedDevice(): string | null {
    return this.connectedDevice;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getScanningStatus(): boolean {
    return this.isScanning;
  }

  async getLastConnectedDevice(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('connectedESP32');
    } catch (error) {
      console.error('Failed to get last connected device:', error);
      return null;
    }
  }
}

export default new ESP32Service();

