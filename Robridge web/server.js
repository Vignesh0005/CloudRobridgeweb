const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

// Create a separate app for port 3002 redirect
const redirectApp = express();
const REDIRECT_PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('build')); // Serve React build files

// Store the Python process
let pythonProcess = null;

// Store ESP32 device data
let esp32Devices = new Map();
let lastBarcodeScan = null;

// Database connection
const dbPath = path.join(__dirname, '..', 'Barcode generator&Scanner', 'barcodes.db');
let db = null;

// Initialize database connection
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Connected to barcodes database');
        resolve();
      }
    });
  });
};

// Function to save barcode scan to database
const saveBarcodeScan = (scanData) => {
  return new Promise((resolve, reject) => {
    const {
      barcodeData,
      deviceName,
      deviceId,
      scanType = 'qr',
      source = 'esp32',
      productName = 'Unknown Product',
      productId = 'UNKNOWN',
      price = 0,
      locationX = 0,
      locationY = 0,
      locationZ = 0,
      category = 'Unknown',
      metadata = '{}'
    } = scanData;

    const barcodeId = `SCAN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const sql = `
      INSERT INTO barcodes (
        barcode_id, barcode_data, barcode_type, source, product_name, 
        product_id, price, location_x, location_y, location_z, 
        category, file_path, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      barcodeId, barcodeData, scanType, source, productName,
      productId, price, locationX, locationY, locationZ,
      category, '', JSON.stringify(metadata), timestamp
    ];

    db.run(sql, values, function(err) {
      if (err) {
        console.error('Error saving barcode scan:', err);
        reject(err);
      } else {
        console.log(`Barcode scan saved with ID: ${this.lastID}`);
        resolve({ id: this.lastID, barcodeId });
      }
    });
  });
};

// Function to get all scanned barcodes
const getAllScannedBarcodes = (limit = 100, offset = 0) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        id, barcode_id, barcode_data, barcode_type, source, 
        product_name, product_id, price, location_x, location_y, location_z,
        category, file_path, metadata, created_at
      FROM barcodes 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    db.all(sql, [limit, offset], (err, rows) => {
      if (err) {
        console.error('Error fetching barcodes:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ESP32 Device Registration
app.post('/api/esp32/register', (req, res) => {
  try {
    const { deviceId, deviceName, ipAddress, firmwareVersion } = req.body;
    
    const deviceInfo = {
      deviceId,
      deviceName: deviceName || `ESP32-${deviceId}`,
      ipAddress,
      firmwareVersion: firmwareVersion || '1.0.0',
      lastSeen: new Date().toISOString(),
      status: 'connected',
      totalScans: 0
    };
    
    esp32Devices.set(deviceId, deviceInfo);
    
    console.log(`ESP32 device registered: ${deviceName} (${deviceId})`);
    
    // Notify all connected clients about new device
    io.emit('esp32_device_connected', deviceInfo);
    
    res.json({ 
      success: true, 
      message: 'Device registered successfully',
      deviceId 
    });
  } catch (error) {
    console.error('Error registering ESP32 device:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to register device' 
    });
  }
});

// ESP32 Heartbeat/Ping
app.post('/api/esp32/ping/:deviceId', (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = esp32Devices.get(deviceId);
    
    if (device) {
      device.lastSeen = new Date().toISOString();
      device.status = 'connected';
      esp32Devices.set(deviceId, device);
      
      res.json({ success: true, timestamp: device.lastSeen });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Device not found' 
      });
    }
  } catch (error) {
    console.error('Error processing ESP32 ping:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process ping' 
    });
  }
});

// ESP32 Barcode Scan Data
app.post('/api/esp32/scan/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { barcodeData, scanType, imageData, timestamp } = req.body;
    
    const device = esp32Devices.get(deviceId);
    if (!device) {
      return res.status(404).json({ 
        success: false, 
        error: 'Device not registered' 
      });
    }
    
    // Update device stats
    device.totalScans++;
    device.lastSeen = new Date().toISOString();
    esp32Devices.set(deviceId, device);
    
    // Create scan record
    const scanRecord = {
      id: `scan_${Date.now()}_${deviceId}`,
      deviceId,
      deviceName: device.deviceName,
      barcodeData,
      scanType: scanType || 'unknown',
      imageData: imageData || null,
      timestamp: timestamp || new Date().toISOString(),
      processed: false
    };
    
    // Extract product information from ESP32 payload (if available)
    const { productName, productType, productDetails, foundInLocalDB } = req.body;
    
    // Only save to database if ESP32 found the product in its local array
    if (foundInLocalDB && productName) {
      try {
        const dbScanData = {
          barcodeData,
          deviceName: device.deviceName,
          deviceId,
          scanType: scanType || 'unknown',
          source: 'esp32',
          productName: productName,
          productId: barcodeData,
          price: 0,
          locationX: 0,
          locationY: 0,
          locationZ: 0,
          category: productType || 'Unknown',
          metadata: {
            deviceName: device.deviceName,
            deviceId: deviceId,
            scanType: scanType || 'unknown',
            timestamp: timestamp || new Date().toISOString(),
            productDetails: productDetails || '',
            foundInLocalDB: true
          }
        };
        
        const dbResult = await saveBarcodeScan(dbScanData);
        console.log('Product found and saved to database:', dbResult);
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
      }
    } else {
      console.log('Product not found in ESP32 local database - not saving to server database');
    }
    
    // Store the latest scan
    lastBarcodeScan = scanRecord;
    
    console.log(`ESP32 barcode scan received from ${device.deviceName}: ${barcodeData}`);
    
    // Notify all connected clients about new scan
    io.emit('esp32_barcode_scan', scanRecord);
    
    // Mark as processed since ESP32 handles product lookup locally
    scanRecord.processed = true;
    scanRecord.productInfo = {
      productName: productName || 'Unknown Product',
      productType: productType || 'Unknown',
      productDetails: productDetails || 'No details available',
      foundInLocalDB: foundInLocalDB || false
    };
    
    // Notify clients with ESP32 product information
    io.emit('esp32_scan_processed', scanRecord);
    
    res.json({ 
      success: true, 
      message: 'Barcode scan received',
      scanId: scanRecord.id 
    });
  } catch (error) {
    console.error('Error processing ESP32 scan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process scan' 
    });
  }
});

// Get ESP32 devices list
app.get('/api/esp32/devices', (req, res) => {
  try {
    const devices = Array.from(esp32Devices.values());
    
    // Update device status based on last seen
    const now = new Date();
    devices.forEach(device => {
      const lastSeen = new Date(device.lastSeen);
      const timeDiff = (now - lastSeen) / 1000; // seconds
      
      if (timeDiff > 60) { // 1 minute timeout
        device.status = 'disconnected';
      }
    });
    
    res.json({ 
      success: true, 
      devices,
      totalDevices: devices.length 
    });
  } catch (error) {
    console.error('Error getting ESP32 devices:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get devices' 
    });
  }
});

// Get latest barcode scan
app.get('/api/esp32/latest-scan', (req, res) => {
  try {
    res.json({ 
      success: true, 
      scan: lastBarcodeScan 
    });
  } catch (error) {
    console.error('Error getting latest scan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get latest scan' 
    });
  }
});

// Get all scanned barcodes from database
app.get('/api/barcodes/scanned', async (req, res) => {
  try {
    const { limit = 100, offset = 0, source } = req.query;
    
    let sql = `
      SELECT 
        id, barcode_id, barcode_data, barcode_type, source, 
        product_name, product_id, price, location_x, location_y, location_z,
        category, file_path, metadata, created_at
      FROM barcodes 
    `;
    
    const params = [];
    
    if (source) {
      sql += ' WHERE source = ?';
      params.push(source);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error fetching scanned barcodes:', err);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch scanned barcodes' 
        });
      } else {
        res.json({ 
          success: true, 
          barcodes: rows,
          total: rows.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        });
      }
    });
  } catch (error) {
    console.error('Error getting scanned barcodes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get scanned barcodes' 
    });
  }
});

// ESP32 Database Lookup Endpoint
app.get('/api/barcodes/lookup/:barcode', (req, res) => {
  try {
    const { barcode } = req.params;
    
    const sql = `
      SELECT 
        barcode_data, product_name, category, price, location_x, location_y, location_z,
        metadata, created_at
      FROM barcodes 
      WHERE barcode_data = ?
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    db.get(sql, [barcode], (err, row) => {
      if (err) {
        console.error('Error looking up barcode:', err);
        res.status(500).json({ 
          success: false, 
          error: 'Database lookup failed' 
        });
      } else if (row) {
        // Parse metadata for additional product info
        let metadata = {};
        try {
          metadata = JSON.parse(row.metadata || '{}');
        } catch (e) {
          metadata = {};
        }
        
        res.json({ 
          success: true, 
          product: {
            barcode: row.barcode_data,
            name: row.product_name || 'Unknown Product',
            type: row.category || 'Unknown',
            details: metadata.productDetails || 'No details available',
            price: row.price ? `$${row.price}` : 'Price not available',
            category: row.category || 'Unknown',
            location: `X:${row.location_x}, Y:${row.location_y}, Z:${row.location_z}`,
            foundInDatabase: true,
            lastScanned: row.created_at
          }
        });
      } else {
        res.json({ 
          success: false, 
          message: 'Barcode not found in database',
          product: null
        });
      }
    });
  } catch (error) {
    console.error('Error in barcode lookup:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ESP32 AI Analysis Endpoint
app.post('/api/ai/analyze-product', async (req, res) => {
  try {
    const { barcode, productName, analysisType, source } = req.body;
    
    console.log(`AI Analysis request: ${analysisType} for barcode ${barcode}`);
    
    if (analysisType === 'benefits') {
      // Call your AI model for benefits analysis
      const aiResponse = await callAIForBenefits(productName, barcode);
      
      res.json({
        success: true,
        benefits: aiResponse,
        productName: productName,
        barcode: barcode,
        analysisType: analysisType
      });
    } else {
      // General product analysis
      const aiResponse = await callAIForProductAnalysis(barcode);
      
      res.json({
        success: true,
        product: aiResponse,
        barcode: barcode,
        source: source
      });
    }
  } catch (error) {
    console.error('Error in AI analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI analysis failed',
      message: error.message
    });
  }
});

// Helper function to call trained AI model for benefits analysis
async function callAIForBenefits(productName, barcode) {
  try {
    // Call your trained AI model directly
    const aiEndpoint = 'http://172.21.66.150:8000/generate';
    
    const response = await fetch(aiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode: barcode,
        max_length: 150,
        temperature: 0.8,
        top_p: 0.9
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.product_description || 'Benefits analysis completed by trained AI';
    } else {
      return 'Trained AI benefits analysis temporarily unavailable';
    }
  } catch (error) {
    console.error('Trained AI benefits call failed:', error);
    return 'Trained AI analysis service unavailable';
  }
}

// Helper function to call trained AI model for general product analysis
async function callAIForProductAnalysis(barcode) {
  try {
    // Call your trained AI model directly
    const aiEndpoint = 'http://172.21.66.150:8000/generate';
    
    const response = await fetch(aiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode: barcode,
        max_length: 200,
        temperature: 0.7,
        top_p: 0.9
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        name: 'AI-Generated Product',
        type: 'Analyzed',
        details: data.product_description || 'AI analysis completed',
        price: 'Price not available',
        category: 'AI Analyzed'
      };
    } else {
      return {
        name: 'Unknown Product',
        type: 'Unknown',
        details: 'Trained AI analysis temporarily unavailable',
        price: 'Price not available',
        category: 'Unknown'
      };
    }
  } catch (error) {
    console.error('Trained AI product analysis call failed:', error);
    return {
      name: 'Unknown Product',
      type: 'Unknown',
      details: 'Trained AI analysis service unavailable',
      price: 'Price not available',
      category: 'Unknown'
    };
  }
}

// Get barcode statistics
app.get('/api/barcodes/stats', (req, res) => {
  try {
    const sql = `
      SELECT 
        source,
        barcode_type,
        COUNT(*) as count
      FROM barcodes 
      GROUP BY source, barcode_type
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('Error fetching barcode stats:', err);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch statistics' 
        });
      } else {
        const stats = {
          bySource: {},
          byType: {},
          total: 0
        };
        
        rows.forEach(row => {
          stats.total += row.count;
          
          if (!stats.bySource[row.source]) {
            stats.bySource[row.source] = 0;
          }
          stats.bySource[row.source] += row.count;
          
          if (!stats.byType[row.barcode_type]) {
            stats.byType[row.barcode_type] = 0;
          }
          stats.byType[row.barcode_type] += row.count;
        });
        
        res.json({ 
          success: true, 
          stats 
        });
      }
    });
  } catch (error) {
    console.error('Error getting barcode statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get statistics' 
    });
  }
});

// Start Python backend endpoint
app.post('/api/start-backend', async (req, res) => {
  try {
    // Kill existing process if running
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
    }

    // Path to your Python backend
    const pythonPath = path.join(__dirname, '..', 'Barcode generator&Scanner', 'start_server.py');
    const pythonDir = path.join(__dirname, '..', 'Barcode generator&Scanner');

    console.log('Starting Python backend...');
    console.log('Python file:', pythonPath);
    console.log('Working directory:', pythonDir);

    // Start Python process
    pythonProcess = spawn('py', [pythonPath], {
      cwd: pythonDir,
      stdio: 'pipe'
    });

    // Handle process events
    pythonProcess.stdout.on('data', (data) => {
      console.log('Python stdout:', data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      console.log('Python stderr:', data.toString());
    });

    pythonProcess.on('close', (code) => {
      console.log('Python process closed with code:', code);
      pythonProcess = null;
    });

    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      pythonProcess = null;
    });

    // Wait a bit for the process to start
    setTimeout(() => {
      if (pythonProcess && !pythonProcess.killed) {
        res.json({ 
          success: true, 
          message: 'Python backend started successfully',
          pid: pythonProcess.pid
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to start Python backend' 
        });
      }
    }, 2000);

  } catch (error) {
    console.error('Error starting backend:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error starting backend',
      error: error.message 
    });
  }
});

// Stop Python backend endpoint
app.post('/api/stop-backend', (req, res) => {
  try {
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
      res.json({ success: true, message: 'Python backend stopped' });
    } else {
      res.json({ success: false, message: 'No Python backend running' });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error stopping backend',
      error: error.message 
    });
  }
});

// Get backend status
app.get('/api/backend-status', (req, res) => {
  const isRunning = pythonProcess && !pythonProcess.killed;
  res.json({ 
    running: isRunning,
    pid: isRunning ? pythonProcess.pid : null
  });
});

// Check if Python backend is running on port 5000
const checkPythonBackend = async () => {
  try {
    const response = await fetch('http://localhost:5000/health', {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Proxy endpoints to Python backend
app.post('/api/generate_barcode', async (req, res) => {
  try {
    const isBackendRunning = await checkPythonBackend();
    if (!isBackendRunning) {
      return res.status(503).json({ 
        success: false, 
        error: 'Python backend is not running on port 5000' 
      });
    }

    // Forward request to Python backend
    const response = await fetch('http://localhost:5000/generate_barcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error proxying to Python backend:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Python backend' 
    });
  }
});

app.get('/api/get_barcode/:filename', async (req, res) => {
  try {
    const isBackendRunning = await checkPythonBackend();
    if (!isBackendRunning) {
      return res.status(503).json({ 
        success: false, 
        error: 'Python backend is not running on port 5000' 
      });
    }

    // Forward request to Python backend
    const response = await fetch(`http://localhost:5000/get_barcode/${req.params.filename}`);
    
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', response.headers.get('Content-Type'));
      res.send(Buffer.from(buffer));
    } else {
      res.status(response.status).json({ 
        success: false, 
        error: 'Failed to get barcode image' 
      });
    }
  } catch (error) {
    console.error('Error proxying to Python backend:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Python backend' 
    });
  }
});

app.get('/api/list_barcodes', async (req, res) => {
  try {
    const isBackendRunning = await checkPythonBackend();
    if (!isBackendRunning) {
      return res.status(503).json({ 
        success: false, 
        error: 'Python backend is not running on port 5000' 
      });
    }

    // Forward request to Python backend
    const response = await fetch('http://localhost:5000/list_barcodes');
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error proxying to Python backend:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Python backend' 
    });
  }
});

// Rack Management API endpoints
app.get('/api/racks', async (req, res) => {
  try {
    const isBackendRunning = await checkPythonBackend();
    if (!isBackendRunning) {
      return res.status(503).json({ 
        success: false, 
        error: 'Python backend is not running on port 5000' 
      });
    }

    // Forward request to Python backend
    const url = new URL('http://localhost:5000/api/racks');
    if (req.query.search) url.searchParams.append('search', req.query.search);
    if (req.query.status) url.searchParams.append('status', req.query.status);
    
    const response = await fetch(url.toString());
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error proxying to Python backend:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Python backend' 
    });
  }
});

app.post('/api/racks', async (req, res) => {
  try {
    const isBackendRunning = await checkPythonBackend();
    if (!isBackendRunning) {
      return res.status(503).json({ 
        success: false, 
        error: 'Python backend is not running on port 5000' 
      });
    }

    // Forward request to Python backend
    const response = await fetch('http://localhost:5000/api/racks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error) {
    console.error('Error proxying to Python backend:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Python backend' 
    });
  }
});

app.put('/api/racks/:id', async (req, res) => {
  try {
    const isBackendRunning = await checkPythonBackend();
    if (!isBackendRunning) {
      return res.status(503).json({ 
        success: false, 
        error: 'Python backend is not running on port 5000' 
      });
    }

    // Forward request to Python backend
    const response = await fetch(`http://localhost:5000/api/racks/${req.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error) {
    console.error('Error proxying to Python backend:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Python backend' 
    });
  }
});

app.delete('/api/racks/:id', async (req, res) => {
  try {
    const isBackendRunning = await checkPythonBackend();
    if (!isBackendRunning) {
      return res.status(503).json({ 
        success: false, 
        error: 'Python backend is not running on port 5000' 
      });
    }

    // Forward request to Python backend
    const response = await fetch(`http://localhost:5000/api/racks/${req.params.id}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error) {
    console.error('Error proxying to Python backend:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Python backend' 
    });
  }
});

app.get('/api/racks/stats', async (req, res) => {
  try {
    const isBackendRunning = await checkPythonBackend();
    if (!isBackendRunning) {
      return res.status(503).json({ 
        success: false, 
        error: 'Python backend is not running on port 5000' 
      });
    }

    // Forward request to Python backend
    const response = await fetch('http://localhost:5000/api/racks/stats');
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error proxying to Python backend:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Python backend' 
    });
  }
});

app.get('/api/racks/search', async (req, res) => {
  try {
    const isBackendRunning = await checkPythonBackend();
    if (!isBackendRunning) {
      return res.status(503).json({ 
        success: false, 
        error: 'Python backend is not running on port 5000' 
      });
    }

    // Forward request to Python backend
    const url = new URL('http://localhost:5000/api/racks/search');
    if (req.query.q) url.searchParams.append('q', req.query.q);
    
    const response = await fetch(url.toString());
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error proxying to Python backend:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Python backend' 
    });
  }
});

// Proxy for rack quantity updates
app.post('/api/racks/:rackId/update-quantity', async (req, res) => {
  try {
    const isBackendRunning = await checkPythonBackend();
    if (!isBackendRunning) {
      return res.status(503).json({ 
        success: false, 
        error: 'Python backend is not running on port 5000' 
      });
    }

    // Forward request to Python backend
    const response = await fetch(`http://localhost:5000/api/racks/${req.params.rackId}/update-quantity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error proxying rack quantity update to Python backend:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Python backend' 
    });
  }
});

// Proxy for rack status (operational monitoring)
app.get('/api/rack-status', async (req, res) => {
  try {
    const isBackendRunning = await checkPythonBackend();
    if (!isBackendRunning) {
      return res.status(503).json({ 
        success: false, 
        error: 'Python backend is not running on port 5000' 
      });
    }

    // Forward request to Python backend
    const response = await fetch('http://localhost:5000/api/rack-status');
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error proxying rack status to Python backend:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Python backend' 
    });
  }
});

app.post('/api/init-db', async (req, res) => {
  try {
    const isBackendRunning = await checkPythonBackend();
    if (!isBackendRunning) {
      return res.status(503).json({ 
        success: false, 
        error: 'Python backend is not running on port 5000' 
      });
    }

    // Forward request to Python backend
    const response = await fetch('http://localhost:5000/api/init-db', {
      method: 'POST'
    });
    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error('Error proxying to Python backend:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with Python backend' 
    });
  }
});

// Serve React app for all other routes (only if build exists)
app.get('*', (req, res) => {
  const buildPath = path.join(__dirname, 'build', 'index.html');
  if (require('fs').existsSync(buildPath)) {
    res.sendFile(buildPath);
  } else {
    res.json({ 
      message: 'React build not found. Run "npm run build" first, or use development mode.',
      endpoints: {
        health: '/api/health',
        startBackend: '/api/start-backend',
        stopBackend: '/api/stop-backend',
        backendStatus: '/api/backend-status'
      }
    });
  }
});

// Redirect app setup for port 3000
redirectApp.get('*', (req, res) => {
  const redirectUrl = `http://localhost:${PORT}${req.originalUrl}`;
  console.log(`Redirecting from port ${REDIRECT_PORT} to port ${PORT}: ${redirectUrl}`);
  res.redirect(301, redirectUrl);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected to WebSocket:', socket.id);
  
  // Send current ESP32 devices to newly connected client
  const devices = Array.from(esp32Devices.values());
  socket.emit('esp32_devices_update', devices);
  
  // Send latest scan if available
  if (lastBarcodeScan) {
    socket.emit('esp32_barcode_scan', lastBarcodeScan);
  }
  
  socket.on('disconnect', () => {
    console.log('Client disconnected from WebSocket:', socket.id);
  });
});

// Initialize database and start servers
const startServer = async () => {
  try {
    // Initialize database connection
    await initDatabase();
    console.log('✅ Database connection initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    console.log('⚠️  Server will continue without database functionality');
  }
  
  // Start both servers
  server.listen(PORT, () => {
    console.log(`Main server running on port ${PORT}`);
    console.log(`Python backend control available at http://localhost:${PORT}/api/`);
    console.log(`WebSocket server running on port ${PORT}`);
    console.log(`Access the app at: http://localhost:${PORT}`);
  });
};

startServer();

redirectApp.listen(REDIRECT_PORT, () => {
  console.log(`Redirect server running on port ${REDIRECT_PORT}`);
  console.log(`Redirecting all traffic to port ${PORT}`);
  console.log(`You can access the app at either:`);
  console.log(`  - http://localhost:${PORT} (recommended)`);
  console.log(`  - http://localhost:${REDIRECT_PORT} (redirects to ${PORT})`);
});
