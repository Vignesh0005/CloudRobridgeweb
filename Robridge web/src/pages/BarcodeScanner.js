import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaDownload, FaMicrochip, FaSignal } from 'react-icons/fa';
import { useWebSocket } from '../contexts/WebSocketContext';
import './BarcodeScanner.css';

const BarcodeScanner = () => {
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner' or 'history'
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState(null);
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false);
  const { isConnected, esp32Devices, latestScan, setLatestScan, isProcessingScan } = useWebSocket();

  // Fetch scanned barcodes from database (only ESP32 source)
  const fetchScannedBarcodes = async () => {
    setLoading(true);
    try {
      // Only fetch ESP32 source types, exclude GM77_SCAN
      // Note: We'll fetch all and filter client-side since API only supports single source parameter
      const serverURL = 'https://robridge-express.onrender.com';
      const response = await fetch(`${serverURL}/api/barcodes/scanned?limit=100`);
      const data = await response.json();
      if (data.success) {
        console.log('📊 Total barcodes fetched:', data.barcodes.length);
        
        // Filter to only show ESP32 source scans (not ESP32_LIVE_SCANNER, not GM77_SCAN)
        const esp32Barcodes = data.barcodes.filter(barcode => {
          const source = (barcode.source || '').toUpperCase();
          return source === 'ESP32';
        });
        
        console.log('✅ ESP32 source barcodes after filtering:', esp32Barcodes.length);
        console.log('🚫 Filtered out non-ESP32 source entries');
        
        // Debug: Show AI analysis categories
        esp32Barcodes.slice(0, 3).forEach((barcode, index) => {
          try {
            const metadata = typeof barcode.metadata === 'string' ? JSON.parse(barcode.metadata) : barcode.metadata;
            console.log(`🔍 Barcode ${index + 1}: ${barcode.barcode_data}`);
            console.log(`   Database Category: "${barcode.category}"`);
            if (metadata.aiAnalysis) {
              console.log(`   AI Analysis Category: "${metadata.aiAnalysis.category}"`);
              console.log(`   AI Analysis Title: "${metadata.aiAnalysis.title}"`);
            } else {
              console.log(`   No AI Analysis found`);
            }
          } catch (e) {
            console.log(`   Error parsing metadata: ${e.message}`);
          }
        });
        
        setScannedBarcodes(esp32Barcodes);
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

  // Auto-saving disabled - user must click "Save This Scan" button manually
  // useEffect(() => {
  //   if (latestScan && !isProcessingScan) {
  //     setAutoSaving(true);
  //     setTimeout(() => {
  //       setAutoSaving(false);
  //     }, 2000);
  //   }
  // }, [latestScan, isProcessingScan]);

  const resetScanner = () => {
    // Clear the latest scan data
    setLatestScan(null);
  };

  // Save current scan to Saved Scans
  const saveCurrentScan = async () => {
    if (!latestScan) {
      alert('No scan to save');
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
      alert(`❌ Only ESP32 source scans can be saved. Current source: "${latestScan.source}"`);
      return;
    }

    try {
      const response = await fetch('https://robridge-express.onrender.com/api/save-scan', {
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
        alert('✅ Scan saved successfully! View in "Saved Scans" page.');
      } else {
        if (result.duplicate) {
          alert('⚠️ ' + result.error + '\n\nLast saved: ' + new Date(result.lastSaved).toLocaleString());
        } else {
          alert('❌ Failed to save scan: ' + (result.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error saving scan:', error);
      alert('❌ Error saving scan. Please ensure the server is running.');
    }
  };

  // Save barcode from history to Saved Scans
  const saveBarcodeFromHistory = async (barcode) => {
    // Only allow ESP32 source scans to be saved
    const source = (barcode.source || '').toUpperCase();
    if (source !== 'ESP32') {
      alert('❌ Only ESP32 source scans can be saved.');
      return;
    }

    try {
      // Parse metadata if it's a string
      let metadata = {};
      try {
        metadata = typeof barcode.metadata === 'string' ? JSON.parse(barcode.metadata) : barcode.metadata;
      } catch (e) {
        metadata = {};
      }

      const response = await fetch('https://robridge-express.onrender.com/api/save-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode_data: barcode.barcode_data,
          barcode_type: barcode.barcode_type || 'ESP32_SCAN',
          source: 'ESP32',
          product_name: barcode.product_name || 'Unknown Product',
          category: barcode.category || 'Unknown',
          price: barcode.price || 0,
          description: metadata.description || metadata.productDetails || '',
          metadata: {
            originalId: barcode.id,
            originalTimestamp: barcode.created_at,
            deviceId: metadata.deviceId || 'ESP32_GM77_SCANNER_001',
            deviceName: metadata.deviceName || 'ESP32-GM77-Barcode-Scanner',
            aiAnalysis: metadata.aiAnalysis || null,
            savedFromHistory: true
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Scan saved successfully! View in "Saved Scans" page.');
      } else {
        if (result.duplicate) {
          alert('⚠️ ' + result.error + '\n\nLast saved: ' + new Date(result.lastSaved).toLocaleString());
        } else {
          alert('❌ Failed to save scan: ' + (result.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error saving scan from history:', error);
      alert('❌ Error saving scan. Please ensure the server is running.');
    }
  };

  // Delete barcode from history
  const deleteBarcodeFromHistory = async (barcode) => {
    if (!window.confirm(`Are you sure you want to delete this scan?\n\nBarcode: ${barcode.barcode_data}`)) {
      return;
    }

    try {
      const response = await fetch(`https://robridge-express.onrender.com/api/barcodes/${barcode.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Scan deleted successfully!');
        // Refresh the list
        fetchScannedBarcodes();
      } else {
        alert('❌ Failed to delete scan: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting scan from history:', error);
      alert('❌ Error deleting scan. Please ensure the server is running.');
    }
  };

  // Handle barcode row click to show details
  const handleBarcodeClick = (barcode) => {
    setSelectedBarcode(barcode);
    setShowBarcodeDialog(true);
  };

  // Close barcode details dialog
  const closeBarcodeDialog = () => {
    setShowBarcodeDialog(false);
    setSelectedBarcode(null);
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
              

            </div>
        </div>

        {/* Right Section - Results */}
        <div className="result-section">
          {isProcessingScan && !latestScan ? (
            <div className="result-panel card fade-in">
              <h2>Processing Scan...</h2>
              <div className="barcode-info">
                <div className="scan-details">
                  <div className="detail-row">
                    <strong>Status:</strong> Collecting data from ESP32...
                  </div>
                  <div className="detail-row">
                    <strong>Please wait:</strong> Ensuring complete data before display
                  </div>
                </div>
              </div>
            </div>
          ) : latestScan ? (
            <div className="result-panel card fade-in">
              <h2>Live Scan Result</h2>
              
              <div className="barcode-info">
                {/* Basic Information Section */}
                <div className="scan-info-section">
                  <h3>Basic Information</h3>
                  <div className="info-grid-two-columns">
                    <div className="info-column">
                      <div className="info-field">
                        <label>Device</label>
                        <span className="info-value">{latestScan.deviceName || 'Unknown Device'}</span>
                      </div>
                      <div className="info-field">
                        <label>Source</label>
                        <span className="info-value source-badge">{latestScan.source?.toUpperCase() || 'ESP32'}</span>
                      </div>
                      <div className="info-field">
                        <label>Category</label>
                        <span className="info-value">{latestScan.aiAnalysis?.category || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="info-column">
                      <div className="info-field">
                        <label>Product Name</label>
                        <span className="info-value">{latestScan.aiAnalysis?.title || 'Unknown Product'}</span>
                      </div>
                      <div className="info-field">
                        <label>Scan Time</label>
                        <span className="info-value">{(() => {
                          // Use the current time when the scan was received, not the ESP32 timestamp
                          // ESP32 timestamps are often unreliable or in different formats
                          return new Date().toLocaleString();
                        })()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barcode Data Section */}
                <div className="barcode-data-section">
                  <h3>Barcode Data</h3>
                  <div className="barcode-data-container">
                    <span className="barcode-data-text">{latestScan.barcodeData}</span>
                  </div>
                </div>

                {/* AI Analysis / Description Section */}
                <div className="description-section">
                  <h3>🤖 AI Analysis</h3>
                  <div className="description-container">
                    <p className="description-text">
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
                    </p>
                  </div>
                </div>
              </div>



              {/* Action Buttons */}
              <div className="result-actions">
                <button className="btn btn-success" onClick={saveCurrentScan}>
                  <FaCheck />
                  Save This Scan
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
              <h3>No Device Connected Scan</h3>
              <p>Scan a barcode using your Device Connected scanner to see results here</p>
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
                    <th>Source</th>
                    <th>Category</th>
                    <th>Scanned At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scannedBarcodes.map((barcode) => (
                    <tr key={barcode.id} onClick={() => handleBarcodeClick(barcode)} className="barcode-row">
                      <td>{barcode.id}</td>
                      <td className="barcode-data">{barcode.barcode_data}</td>
                      <td>
                        <span className={`source-badge ${barcode.source}`}>
                          {barcode.source.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {(() => {
                          // Try to get AI analysis category from metadata
                          try {
                            const metadata = typeof barcode.metadata === 'string' ? JSON.parse(barcode.metadata) : barcode.metadata;
                            if (metadata.aiAnalysis && metadata.aiAnalysis.category) {
                              return metadata.aiAnalysis.category;
                            }
                          } catch (e) {
                            // Fallback to database category
                          }
                          return barcode.category || 'Unknown';
                        })()}
                      </td>
                      <td>{new Date(barcode.created_at).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              saveBarcodeFromHistory(barcode);
                            }}
                            title="Save this scan to Saved Scans"
                          >
                            <FaCheck />
                            Save
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              deleteBarcodeFromHistory(barcode);
                            }}
                            title="Delete this scan"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-barcodes">
              <h3>No Scanned Barcodes Found</h3>
              <p>Start scanning with your Device Connected device to see barcode history here</p>
            </div>
          )}
        </div>
      )}

      {/* Barcode Details Dialog */}
      {showBarcodeDialog && selectedBarcode && (
        <div className="barcode-dialog-overlay" onClick={closeBarcodeDialog}>
          <div className="barcode-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="barcode-dialog-header">
              <h2>Barcode Details</h2>
              <button className="close-btn" onClick={closeBarcodeDialog}>
                <FaTimes />
              </button>
            </div>
            
            <div className="barcode-dialog-body">
              {/* Basic Information Section */}
              <div className="scan-info-section">
                <h3>Basic Information</h3>
                <div className="info-grid-two-columns">
                  <div className="info-column">
                    <div className="info-field">
                      <label>ID</label>
                      <span className="info-value">#{selectedBarcode.id}</span>
                    </div>
                    <div className="info-field">
                      <label>Source</label>
                      <span className="info-value source-badge">{selectedBarcode.source?.toUpperCase()}</span>
                    </div>
                    <div className="info-field">
                      <label>Category</label>
                      <span className="info-value">
                        {(() => {
                          try {
                            const metadata = typeof selectedBarcode.metadata === 'string' 
                              ? JSON.parse(selectedBarcode.metadata) 
                              : selectedBarcode.metadata;
                            if (metadata?.aiAnalysis?.category) {
                              return metadata.aiAnalysis.category;
                            }
                          } catch (e) {}
                          return selectedBarcode.category || 'N/A';
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="info-column">
                    <div className="info-field">
                      <label>Product Name</label>
                      <span className="info-value">
                        {(() => {
                          try {
                            const metadata = typeof selectedBarcode.metadata === 'string' 
                              ? JSON.parse(selectedBarcode.metadata) 
                              : selectedBarcode.metadata;
                            if (metadata?.aiAnalysis?.title) {
                              return metadata.aiAnalysis.title;
                            }
                          } catch (e) {}
                          return selectedBarcode.product_name || 'N/A';
                        })()}
                      </span>
                    </div>
                    <div className="info-field">
                      <label>Type</label>
                      <span className={`type-badge type-${selectedBarcode.barcode_type || 'unknown'}`}>
                        {selectedBarcode.barcode_type?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="info-field">
                      <label>Scanned At</label>
                      <span className="info-value">{new Date(selectedBarcode.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barcode Data Section */}
              <div className="barcode-data-section">
                <h3>Barcode Data</h3>
                <div className="barcode-data-container">
                  <span className="barcode-data-text">{selectedBarcode.barcode_data}</span>
                </div>
              </div>

              {/* AI Analysis / Description Section */}
              <div className="description-section">
                <h3>🤖 AI Analysis</h3>
                <div className="description-container">
                  <p className="description-text">
                    {(() => {
                      try {
                        // Try to get description from metadata
                        if (selectedBarcode.metadata) {
                          const metadata = typeof selectedBarcode.metadata === 'string' 
                            ? JSON.parse(selectedBarcode.metadata) 
                            : selectedBarcode.metadata;
                          
                          // Check for AI analysis description
                          if (metadata.aiAnalysis?.description) {
                            return metadata.aiAnalysis.description;
                          }
                          if (metadata.aiAnalysis?.description_short) {
                            return metadata.aiAnalysis.description_short;
                          }
                          if (metadata.description) {
                            return metadata.description;
                          }
                        }
                        
                        // Fallback to description field
                        if (selectedBarcode.product_description) {
                          return selectedBarcode.product_description;
                        }
                        
                        // Final fallback
                        return selectedBarcode.product_name || 'No description available';
                      } catch (error) {
                        console.error('Error parsing metadata:', error);
                        return selectedBarcode.product_name || 'No description available';
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="barcode-dialog-footer">
              <button className="btn btn-secondary" onClick={closeBarcodeDialog}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
