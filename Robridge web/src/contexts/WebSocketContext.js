import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [esp32Devices, setEsp32Devices] = useState([]);
  const [latestScan, setLatestScan] = useState(null);
  const [analyzerResults, setAnalyzerResults] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Function to analyze scanned codes
    const analyzeScannedCode = async (code) => {
      if (!code || code.trim() === '') return;
      
      try {
        console.log('Analyzing scanned code:', code);
        const response = await fetch('http://localhost:5001/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scanned_value: code })
        });
        
        const result = await response.json();
        console.log('Analysis result:', result);
        setAnalyzerResults(result);
      } catch (error) {
        console.error('Error analyzing code:', error);
        setAnalyzerResults({
          scanned_code: code,
          title: 'Analysis Failed',
          category: 'Error',
          description: 'Unable to analyze the scanned code.',
          type: 'error',
          confidence: 'low'
        });
      }
    };

    // Create WebSocket connection
    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    // Connection event handlers
    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Device Connected specific event handlers
    socketRef.current.on('esp32_devices_update', (devices) => {
      console.log('ESP32 devices updated:', devices);
      setEsp32Devices(devices);
    });

    socketRef.current.on('esp32_barcode_scan', (scanData) => {
      console.log('ESP32 barcode scan received:', scanData);
      setLatestScan(scanData);
      
      // Auto-analyze the scanned code
      analyzeScannedCode(scanData.barcodeData);
    });

    socketRef.current.on('esp32_scan_processed', (scanData) => {
      console.log('ESP32 scan processed:', scanData);
      // Transform the scan data to match what the frontend expects
      const transformedScan = {
        ...scanData,
        dbRecord: scanData.productInfo ? {
          id: scanData.barcodeData,
          name: scanData.productInfo.productName,
          category: scanData.productInfo.productType,
          price: '$0.00', // ESP32 doesn't send price
          location: 'ESP32 Scanner',
          lastUpdated: scanData.timestamp,
          status: scanData.productInfo.foundInLocalDB ? 'ACTIVE' : 'UNKNOWN'
        } : null
      };
      setLatestScan(transformedScan);
      
      // Auto-analyze the processed scan
      analyzeScannedCode(scanData.barcodeData);
    });

    socketRef.current.on('esp32_device_connected', (device) => {
      console.log('New ESP32 device connected:', device);
      setEsp32Devices(prev => [...prev.filter(d => d.deviceId !== device.deviceId), device]);
    });

    // Fetch initial Device Connected devices
    const fetchEsp32Devices = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/esp32/devices');
        const data = await response.json();
        if (data.success) {
          setEsp32Devices(data.devices);
        }
      } catch (error) {
        console.error('Error fetching ESP32 devices:', error);
      }
    };

    fetchEsp32Devices();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const value = {
    isConnected,
    esp32Devices,
    latestScan,
    analyzerResults,
    setAnalyzerResults,
    socket: socketRef.current
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
