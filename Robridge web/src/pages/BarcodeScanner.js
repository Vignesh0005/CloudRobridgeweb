import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaDownload, FaBarcode, FaMicrochip, FaSignal } from 'react-icons/fa';
import { useWebSocket } from '../contexts/WebSocketContext';
import './BarcodeScanner.css';

const BarcodeScanner = () => {
  const [scannedCode, setScannedCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' or 'history'
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { isConnected, esp32Devices, latestScan, analyzerResults, setAnalyzerResults } = useWebSocket();

  // Handle latest scan updates
  useEffect(() => {
    if (latestScan) {
      setScannedCode(latestScan.barcodeData);
      setScanResult(latestScan.dbRecord || null);
      // Analysis is now handled automatically by WebSocket context
    }
  }, [latestScan]);

  // Manual analyze function for manual input
  const handleAnalyze = async () => {
    if (!scannedCode.trim()) return;
    
    setAnalyzing(true);
    try {
      const response = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scanned_value: scannedCode })
      });
      
      const result = await response.json();
      setAnalyzerResults(result);
    } catch (error) {
      console.error('Error analyzing code:', error);
      setAnalyzerResults({
        scanned_code: scannedCode,
        title: 'Analysis Failed',
        category: 'Error',
        description: 'Unable to analyze the scanned code.',
        type: 'error',
        confidence: 'low'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Fetch scanned barcodes from database
  const fetchScannedBarcodes = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/barcodes/scanned?limit=50');
      const data = await response.json();
      if (data.success) {
        setScannedBarcodes(data.barcodes);
      }
    } catch (error) {
      console.error('Error fetching scanned barcodes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load scanned barcodes when switching to history tab
  useEffect(() => {
    if (activeTab === 'history') {
      fetchScannedBarcodes();
    }
  }, [activeTab]);

  const resetScanner = () => {
    setScannedCode('');
    setScanResult(null);
    setAnalyzerResults(null);
  };

  return (
    <div className="barcode-scanner">
      <div className="scanner-header">
        <h1>Barcode Scanner</h1>
        <p>Scan barcodes using Device Connected for real-time processing</p>
      </div>

      {/* Tab Navigation */}
      <div className="scanner-tabs">
        <button 
          className={`tab-button ${activeTab === 'scanner' ? 'active' : ''}`}
          onClick={() => setActiveTab('scanner')}
        >
          <FaBarcode />
          Live Scanner
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FaDownload />
          Scanned Barcodes
        </button>
      </div>


      {/* Device Connected Status */}
      <div className="esp32-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <FaSignal />
          WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        <div className="device-count">
          <FaMicrochip />
          Device Connected: {esp32Devices.length}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'scanner' && (
        <div className="scanner-content">

      <div className="scanner-container">
        {/* Left Section - ESP32 Status */}
        <div className="scan-section card">
          <h2>Device Connected Scanner Status</h2>
          
          <div className="esp32-devices">
              {esp32Devices.length > 0 ? (
                <div className="devices-list">
                  <h3>Connected Device Connected Devices</h3>
                  {esp32Devices.map((device) => (
                    <div key={device.deviceId} className="device-card">
                      <div className="device-header">
                        <FaMicrochip />
                        <span className="device-name">{device.deviceName}</span>
                        <span className={`device-status ${device.status}`}>
                          {device.status}
                        </span>
                      </div>
                      <div className="device-details">
                        <p><strong>ID:</strong> {device.deviceId}</p>
                        <p><strong>IP:</strong> {device.ipAddress}</p>
                        <p><strong>Total Scans:</strong> {device.totalScans}</p>
                        <p><strong>Last Seen:</strong> {new Date(device.lastSeen).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-devices">
                  <FaMicrochip size={48} />
                  <h3>No Device Connected Devices Connected</h3>
                  <p>Waiting for Device Connected devices to connect...</p>
                  <p>Make sure your Device Connected is powered on and connected to WiFi.</p>
                </div>
              )}
              
                  {latestScan && (
                    <div className="latest-scan">
                      <h3>Latest Device Connected Scan</h3>
                      <div className="scan-info">
                        <p><strong>Device:</strong> {latestScan.deviceName}</p>
                        <p><strong>Barcode:</strong> {latestScan.barcodeData}</p>
                        <p><strong>Time:</strong> {new Date(latestScan.timestamp).toLocaleString()}</p>
                        <p><strong>Type:</strong> {latestScan.scanType}</p>
                      </div>
                    </div>
                  )}

                  {/* Manual Input Section */}
                  <div className="manual-input-section">
                    <h3>Manual Code Analysis</h3>
                    <div className="input-group">
                      <input
                        type="text"
                        value={scannedCode}
                        onChange={(e) => setScannedCode(e.target.value)}
                        placeholder="Enter barcode, QR code, or URL to analyze..."
                        className="code-input"
                      />
                      <button 
                        className="btn btn-primary"
                        onClick={handleAnalyze}
                        disabled={!scannedCode.trim() || analyzing}
                      >
                        {analyzing ? 'Analyzing...' : 'Analyze Code'}
                      </button>
                    </div>
                  </div>
            </div>
        </div>

        {/* Right Section - Results */}
        <div className="result-section">
          {scannedCode ? (
            <div className="result-panel card fade-in">
              <h2>Scan Result</h2>
              
              <div className="barcode-info">
                <div className="barcode-code">
                  <strong>Barcode:</strong> {scannedCode}
                </div>
                <div className="barcode-image">
                  <FaBarcode size={100} />
                  <p>Barcode Image</p>
                </div>
              </div>

              <div className="db-record">
                <h3>Database Record</h3>
                {scanResult ? (
                  <div className="record-table">
                    <table>
                      <tbody>
                        <tr>
                          <td>Product ID</td>
                          <td>{scanResult.id}</td>
                        </tr>
                        <tr>
                          <td>Name</td>
                          <td>{scanResult.name}</td>
                        </tr>
                        <tr>
                          <td>Category</td>
                          <td>{scanResult.category}</td>
                        </tr>
                        <tr>
                          <td>Price</td>
                          <td>{scanResult.price}</td>
                        </tr>
                        <tr>
                          <td>Location</td>
                          <td>{scanResult.location}</td>
                        </tr>
                        <tr>
                          <td>Last Updated</td>
                          <td>{scanResult.lastUpdated}</td>
                        </tr>
                        <tr>
                          <td>Status</td>
                          <td>
                            <span className={`status-badge ${scanResult.status.toLowerCase().replace(' ', '-')}`}>
                              {scanResult.status}
                            </span>
                            {scanResult.created && (
                              <span className="auto-created-badge">
                                🆕 Auto-Created
                              </span>
                            )}
                            {scanResult.structured && (
                              <span className="structured-data-badge">
                                📊 Structured Data
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-db-record">
                    <div className="warning-message">
                      <FaTimes className="warning-icon" />
                      <h4>No Database Record Found</h4>
                      <p>This barcode is not in the product database.</p>
                      <p>Possible reasons:</p>
                      <ul>
                        <li>Python backend is not running</li>
                        <li>Barcode not found in database</li>
                        <li>Database connection issue</li>
                      </ul>
                      <div className="action-suggestion">
                        <p><strong>💡 Tip:</strong> The system will automatically create a new product entry for unknown barcodes.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="analysis-result">
                <h3>Code Analysis</h3>
                {analyzing ? (
                  <div className="analyzing">
                    <div className="loading-spinner">
                      <div className="spinner"></div>
                    </div>
                    <p>Analyzing scanned code...</p>
                  </div>
                ) : analyzerResults ? (
                  <div className="analysis-content">
                    <div className="analysis-header">
                      <h4>{analyzerResults.title}</h4>
                      <span className={`type-badge ${analyzerResults.type}`}>
                        {analyzerResults.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="analysis-details">
                      <div className="detail-row">
                        <strong>Category:</strong> {analyzerResults.category}
                      </div>
                      <div className="detail-row">
                        <strong>Description:</strong> {analyzerResults.description}
                      </div>
                      <div className="detail-row">
                        <strong>Confidence:</strong> 
                        <span className={`confidence ${analyzerResults.confidence}`}>
                          {analyzerResults.confidence.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-analysis">
                    <p>Click "Analyze Code" to get detailed information</p>
                    <button className="btn btn-primary" onClick={handleAnalyze}>
                      Analyze Code
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="result-actions">
                <button className="btn btn-success">
                  <FaCheck />
                  Validate Record
                </button>
                
                <button className="btn btn-secondary">
                  <FaDownload />
                  Export Result
                </button>
                
                <button className="btn btn-secondary" onClick={resetScanner}>
                  <FaTimes />
                  Reset Scanner
                </button>
              </div>
            </div>
          ) : (
            <div className="no-result card">
              <FaBarcode size={64} />
              <h3>No Barcode Scanned</h3>
              <p>Open the camera and scan a barcode to see results here</p>
            </div>
          )}
        </div>
      </div>
      </div>
      )}

      {/* Scanned Barcodes Tab */}
      {activeTab === 'history' && (
        <div className="scanned-barcodes-content">
          <div className="barcodes-header">
            <h2>Scanned Barcodes History</h2>
            <button 
              className="btn btn-primary"
              onClick={fetchScannedBarcodes}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner">Loading scanned barcodes...</div>
            </div>
          ) : scannedBarcodes.length > 0 ? (
            <div className="barcodes-table-container">
              <table className="barcodes-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Barcode Data</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Scanned At</th>
                  </tr>
                </thead>
                <tbody>
                  {scannedBarcodes.map((barcode) => (
                    <tr key={barcode.id}>
                      <td>{barcode.id}</td>
                      <td className="barcode-data">{barcode.barcode_data}</td>
                      <td>
                        <span className={`type-badge ${barcode.barcode_type}`}>
                          {barcode.barcode_type.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`source-badge ${barcode.source}`}>
                          {barcode.source.toUpperCase()}
                        </span>
                      </td>
                      <td>{barcode.product_name}</td>
                      <td>{barcode.category}</td>
                      <td>${barcode.price}</td>
                      <td>{new Date(barcode.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-barcodes">
              <FaBarcode size={64} />
              <h3>No Scanned Barcodes Found</h3>
              <p>Start scanning with your Device Connected device to see barcode history here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
