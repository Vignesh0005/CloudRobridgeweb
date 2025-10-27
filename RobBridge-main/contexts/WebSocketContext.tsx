import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { SERVER_CONFIG } from '../config/server';

interface ESP32Device {
  deviceId: string;
  deviceName: string;
  status: string;
  ipAddress: string;
  totalScans: number;
  lastSeen: string;
}

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

interface WebSocketContextType {
  isConnected: boolean;
  esp32Devices: ESP32Device[];
  latestScan: ScanResult | null;
  isProcessingScan: boolean;
  setLatestScan: (scan: ScanResult | null) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [esp32Devices, setEsp32Devices] = useState<ESP32Device[]>([]);
  const [latestScan, setLatestScan] = useState<ScanResult | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scanBuffer, setScanBuffer] = useState<{ [key: string]: any }>({});
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check if we have complete scan data
  const isCompleteScanData = (scanData: any) => {
    return scanData && 
           scanData.barcodeData && 
           scanData.barcodeData.trim().length > 0 &&
           scanData.deviceName &&
           scanData.scanType;
  };

  // Function to buffer and process scan data
  const processScanData = (scanData: any, eventType: string) => {
    console.log(`🔄 Processing ${eventType}:`, scanData);
    console.log('📊 AI Analysis in scan data:', scanData.aiAnalysis);
    console.log('🔍 Scan completeness check:', {
      hasBarcodeData: !!(scanData.barcodeData && scanData.barcodeData.trim().length > 0),
      hasDeviceName: !!scanData.deviceName,
      hasScanType: !!scanData.scanType,
      source: scanData.source,
      scanType: scanData.scanType
    });
    
    // Only process ESP32 scans - check by deviceName and source
    const isEsp32Device = scanData.deviceName?.includes('Scanner') || 
                         scanData.deviceName?.includes('RobridgeAI') ||
                         scanData.deviceName?.includes('Robridge') ||
                         scanData.deviceName?.includes('ESP32-') ||
                         scanData.source === 'esp32' || 
                         scanData.source === 'esp32_basic' ||
                         scanData.source === 'ESP32_LIVE_SCANNER';
    
    if (!isEsp32Device) {
      console.log('❌ Skipping non-ESP32 scan:', { source: scanData.source, deviceName: scanData.deviceName });
      return;
    }

    console.log('✅ Processing ESP32 scan:', { source: scanData.source, deviceName: scanData.deviceName });

    // Set processing state
    setIsProcessingScan(true);

    // Create scan result
    const scanResult: ScanResult = {
      id: scanData.id || `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      barcodeData: scanData.barcodeData,
      scanType: scanData.scanType || 'unknown',
      timestamp: scanData.timestamp || new Date().toISOString(),
      deviceId: scanData.deviceId || 'unknown',
      deviceName: scanData.deviceName || 'ESP32 Scanner',
      source: scanData.source || 'esp32',
      aiAnalysis: scanData.aiAnalysis
    };

    // Set the latest scan
    setLatestScan(scanResult);
    setIsProcessingScan(false);

    console.log('✅ Scan processed and set as latest scan:', scanResult);
  };

  // Function to connect to WebSocket
  const connectWebSocket = () => {
    try {
      console.log('🔌 Connecting to Socket.IO:', SERVER_CONFIG.BASE_URL);
      
      const socket = io(SERVER_CONFIG.BASE_URL, {
        transports: ['websocket'],
        timeout: 20000,
        forceNew: true,
      });
      
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Socket.IO connected');
        setIsConnected(true);
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      });

      socket.on('esp32_barcode_scan', (data) => {
        console.log('📨 ESP32 barcode scan received:', data);
        processScanData(data, 'esp32_barcode_scan');
      });

      socket.on('esp32_scan_processed', (data) => {
        console.log('📨 ESP32 scan processed:', data);
        processScanData(data, 'esp32_scan_processed');
      });

      socket.on('esp32_devices_update', (data) => {
        console.log('📨 ESP32 devices update:', data);
        setEsp32Devices(data.devices || []);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO disconnected:', reason);
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect Socket.IO...');
            connectWebSocket();
          }, 5000);
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error);
        setIsConnected(false);
      });

    } catch (error) {
      console.error('❌ Error creating Socket.IO connection:', error);
      setIsConnected(false);
    }
  };

  // Function to load ESP32 devices
  const loadESP32Devices = async () => {
    try {
      const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/esp32/devices`);
      if (response.ok) {
        const data = await response.json();
        setEsp32Devices(data.devices || []);
        console.log('📱 ESP32 devices loaded:', data.devices);
      }
    } catch (error) {
      console.error('❌ Error loading ESP32 devices:', error);
    }
  };

  // Initialize WebSocket connection and load devices
  useEffect(() => {
    console.log('🚀 Initializing WebSocket context');
    
    // Load ESP32 devices first
    loadESP32Devices();
    
    // Connect to WebSocket
    connectWebSocket();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Periodically refresh ESP32 devices
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        loadESP32Devices();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected]);

  const value: WebSocketContextType = {
    isConnected,
    esp32Devices,
    latestScan,
    isProcessingScan,
    setLatestScan,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
