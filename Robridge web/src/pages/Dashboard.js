import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBarcode,
  FaQrcode,
  FaImage,
  FaRobot,
  FaDatabase,
  FaChartLine,
  FaWarehouse,
  FaBox,
  FaWifi,
  FaServer
} from 'react-icons/fa';
import { useAuth, ROLES } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { getUserRole } = useAuth();
  const userRole = getUserRole();
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const stats = [
    { label: 'Total Scans', value: '1,247', icon: FaBarcode, color: '#E3821E' },
    { label: 'Generated Codes', value: '892', icon: FaQrcode, color: '#E3821E' },
    { label: 'Processed Images', value: '456', icon: FaImage, color: '#E3821E' },
    { label: 'Robot Sessions', value: '78', icon: FaRobot, color: '#E3821E' }
  ];

  const quickActions = [
    { 
      title: 'Scan Barcode', 
      description: 'Scan or upload barcode images',
      icon: FaBarcode, 
      path: '/scanner',
      color: '#E3821E'
    },
    { 
      title: 'Generate Barcode', 
      description: 'Create new barcodes with custom data',
      icon: FaQrcode, 
      path: '/generator',
      color: '#E3821E'
    },
    { 
      title: 'Process Image', 
      description: 'Enhance and filter images',
      icon: FaImage, 
      path: '/image-processing',
      color: '#E3821E'
    },
    { 
      title: 'Rack Management', 
      description: 'Manage warehouse racks and products',
      icon: FaWarehouse, 
      path: '/rack-management',
      color: '#E3821E'
    },
    { 
      title: 'Product Management', 
      description: 'Track product movements and inventory',
      icon: FaBox, 
      path: '/product-management',
      color: '#E3821E'
    },
    { 
      title: '2D Map', 
      description: 'Real-time LiDAR mapping and robot tracking',
      icon: FaRobot, 
      path: '/robot-control',
      color: '#E3821E'
    }
  ];

  // Fetch system status
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        setLoading(true);
        const serverURL = 'https://robridge-express.onrender.com';
        const response = await fetch(`${serverURL}/api/system/status`);
        const data = await response.json();
        
        if (data.success) {
          setSystemStatus(data.status);
        } else {
          console.error('Failed to fetch system status:', data.error);
        }
      } catch (error) {
        console.error('Error fetching system status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Helper function to get status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'connected':
      case 'optimal':
        return 'status-connected';
      case 'warning':
        return 'status-warning';
      case 'error':
        return 'status-error';
      default:
        return 'status-unknown';
    }
  };

  // Helper function to get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'optimal':
        return 'Optimal';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-brand">
          <div className="dashboard-title">
            <h1>Dashboard</h1>
            <p>Robot Control and Barcode Management System</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
              <div className="stat-icon" style={{ color: stat.color }}>
                <Icon />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-content">
        {/* Quick Actions - Hidden for Expo Users */}
        {userRole !== ROLES.EXPO_USER && (
          <div className="dashboard-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions-grid">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} to={action.path} className="quick-action-card">
                    <div className="action-icon" style={{ backgroundColor: action.color }}>
                      <Icon />
                    </div>
                    <div className="action-content">
                      <h3>{action.title}</h3>
                      <p>{action.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}


        {/* System Status */}
        <div className="dashboard-section">
          <h2>System Status</h2>
          {loading ? (
            <div className="status-loading">
              <p>Loading system status...</p>
            </div>
          ) : systemStatus ? (
            <div className="status-grid">
              <div className="status-card">
                <div className="status-header">
                  <FaDatabase />
                  <span>Database</span>
                </div>
                <div className={`status-indicator ${getStatusClass(systemStatus.database.status)}`}>
                  {getStatusText(systemStatus.database.status)}
                </div>
                <div className="status-detail">
                  {systemStatus.database.message}
                </div>
              </div>
              
              <div className="status-card">
                <div className="status-header">
                  <FaServer />
                  <span>AI Server</span>
                </div>
                <div className={`status-indicator ${getStatusClass(systemStatus.aiServer.status)}`}>
                  {getStatusText(systemStatus.aiServer.status)}
                </div>
                <div className="status-detail">
                  {systemStatus.aiServer.message}
                </div>
              </div>
              
              <div className="status-card">
                <div className="status-header">
                  <FaRobot />
                  <span>ESP32 Devices</span>
                </div>
                <div className={`status-indicator ${getStatusClass(systemStatus.esp32Devices.status)}`}>
                  {getStatusText(systemStatus.esp32Devices.status)}
                </div>
                <div className="status-detail">
                  {systemStatus.esp32Devices.message}
                </div>
              </div>
              
              <div className="status-card">
                <div className="status-header">
                  <FaWifi />
                  <span>WebSocket</span>
                </div>
                <div className={`status-indicator ${getStatusClass(systemStatus.websocket.status)}`}>
                  {getStatusText(systemStatus.websocket.status)}
                </div>
                <div className="status-detail">
                  {systemStatus.websocket.message}
                </div>
              </div>
              
              <div className="status-card">
                <div className="status-header">
                  <FaChartLine />
                  <span>Performance</span>
                </div>
                <div className={`status-indicator ${getStatusClass(systemStatus.performance.status)}`}>
                  {getStatusText(systemStatus.performance.status)}
                </div>
                <div className="status-detail">
                  {systemStatus.performance.message}
                  {systemStatus.performance.metrics && (
                    <div className="performance-metrics">
                      <small>Memory: {systemStatus.performance.metrics.memoryUsage}% | Uptime: {Math.floor(systemStatus.performance.metrics.uptime / 3600)}h</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="status-error">
              <p>Failed to load system status</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
