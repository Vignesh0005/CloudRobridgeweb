import React, { useState, useEffect } from 'react';
import { 
  FaCog, 
  FaSave, 
  FaUndo, 
  FaBell, 
  FaQrcode, 
  FaWeight, 
  FaTag, 
  FaSync, 
  FaMapMarkerAlt,
  FaCheck
} from 'react-icons/fa';
import './RackSettings.css';

const RackSettings = () => {
  const [settings, setSettings] = useState({
    // General Settings
    autoUpdate: true,
    notifications: true,
    barcodeIntegration: true,
    
    // Capacity Settings
    defaultCapacity: 100,
    lowCapacityThreshold: 20,
    maxRacksPerSection: 10,
    
    // Naming Settings
    autoGenerateNames: true,
    namePrefix: 'Rack',
    locationFormat: 'XYZ Coordinates',
    
    // Sync Settings
    syncInterval: '5 minutes'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    // In a real app, this would load from localStorage or API
    const savedSettings = localStorage.getItem('rackSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleInputChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to API
      localStorage.setItem('rackSettings', JSON.stringify(settings));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        autoUpdate: true,
        notifications: true,
        barcodeIntegration: true,
        defaultCapacity: 100,
        lowCapacityThreshold: 20,
        maxRacksPerSection: 10,
        autoGenerateNames: true,
        namePrefix: 'Rack',
        locationFormat: 'XYZ Coordinates',
        syncInterval: '5 minutes'
      });
    }
  };

  const syncIntervals = [
    '1 minute',
    '5 minutes',
    '10 minutes',
    '30 minutes',
    '1 hour'
  ];

  const locationFormats = [
    'XYZ Coordinates',
    'Section-Row-Column',
    'Alphanumeric Grid',
    'Custom Format'
  ];

  return (
    <div className="rack-settings">
      <div className="settings-header">
        <div className="header-content">
          <FaCog className="header-icon" />
          <h1>Rack Settings</h1>
          <p>Configure rack management preferences and system behavior</p>
        </div>
        {showSuccess && (
          <div className="success-message">
            <FaCheck />
            Settings saved successfully!
          </div>
        )}
      </div>

      <div className="settings-content">
        {/* General Settings */}
        <div className="settings-section">
          <h2>General Settings</h2>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Auto Update</h3>
                <p>Automatically update rack status from sensors</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoUpdate}
                    onChange={() => handleToggle('autoUpdate')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Notifications</h3>
                <p>Receive notifications for rack status changes</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={() => handleToggle('notifications')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Barcode Integration</h3>
                <p>Enable barcode scanning for rack management</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.barcodeIntegration}
                    onChange={() => handleToggle('barcodeIntegration')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Capacity Settings */}
        <div className="settings-section">
          <h2>Capacity Settings</h2>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Default Capacity</h3>
                <p>Default weight capacity for new racks (kg)</p>
              </div>
              <div className="setting-control">
                <input
                  type="number"
                  value={settings.defaultCapacity}
                  onChange={(e) => handleInputChange('defaultCapacity', parseInt(e.target.value) || 0)}
                  className="number-input"
                  min="1"
                  max="10000"
                />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Low Capacity Threshold</h3>
                <p>Alert when capacity drops below this percentage</p>
              </div>
              <div className="setting-control">
                <input
                  type="number"
                  value={settings.lowCapacityThreshold}
                  onChange={(e) => handleInputChange('lowCapacityThreshold', parseInt(e.target.value) || 0)}
                  className="number-input"
                  min="1"
                  max="100"
                />
                <span className="unit">%</span>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Max Racks Per Section</h3>
                <p>Maximum number of racks allowed per section</p>
              </div>
              <div className="setting-control">
                <input
                  type="number"
                  value={settings.maxRacksPerSection}
                  onChange={(e) => handleInputChange('maxRacksPerSection', parseInt(e.target.value) || 0)}
                  className="number-input"
                  min="1"
                  max="100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Naming Settings */}
        <div className="settings-section">
          <h2>Naming Settings</h2>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Auto Generate Names</h3>
                <p>Automatically generate rack names when adding new racks</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoGenerateNames}
                    onChange={() => handleToggle('autoGenerateNames')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Name Prefix</h3>
                <p>Prefix for automatically generated rack names</p>
              </div>
              <div className="setting-control">
                <input
                  type="text"
                  value={settings.namePrefix}
                  onChange={(e) => handleInputChange('namePrefix', e.target.value)}
                  className="text-input"
                  placeholder="Rack"
                />
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h3>Location Format</h3>
                <p>Format for rack location coordinates</p>
              </div>
              <div className="setting-control">
                <select
                  value={settings.locationFormat}
                  onChange={(e) => handleInputChange('locationFormat', e.target.value)}
                  className="select-input"
                >
                  {locationFormats.map(format => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </select>
                <FaMapMarkerAlt className="select-icon" />
              </div>
            </div>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="settings-section">
          <h2>Sync Settings</h2>
          <div className="settings-group">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Sync Interval</h3>
                <p>How often to sync with the server</p>
              </div>
              <div className="setting-control">
                <select
                  value={settings.syncInterval}
                  onChange={(e) => handleInputChange('syncInterval', e.target.value)}
                  className="select-input"
                >
                  {syncIntervals.map(interval => (
                    <option key={interval} value={interval}>{interval}</option>
                  ))}
                </select>
                <FaSync className="select-icon" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="settings-actions">
          <button 
            className="btn btn-primary save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            <FaSave />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button 
            className="btn btn-secondary reset-btn"
            onClick={handleReset}
          >
            <FaUndo />
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default RackSettings;
