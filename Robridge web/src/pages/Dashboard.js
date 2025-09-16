import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBarcode, 
  FaQrcode, 
  FaImage, 
  FaRobot,
  FaDatabase,
  FaChartLine,
  FaWarehouse,
  FaBox
} from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
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

  const recentActivity = [
    { action: 'Barcode scanned', detail: 'Product ID: PRD-001', time: '2 min ago', type: 'scan' },
    { action: 'Barcode generated', detail: 'Order #12345', time: '15 min ago', type: 'generate' },
    { action: 'Image processed', detail: 'enhanced_photo.jpg', time: '1 hour ago', type: 'image' },
    { action: 'Map updated', detail: 'LiDAR data refreshed', time: '2 hours ago', type: 'robot' }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-brand">
          <img src="/logo.png" alt="RobBridge Logo" className="dashboard-logo" />
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
        {/* Quick Actions */}
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

        {/* Recent Activity */}
        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'scan' && <FaBarcode />}
                  {activity.type === 'generate' && <FaQrcode />}
                  {activity.type === 'image' && <FaImage />}
                  {activity.type === 'robot' && <FaRobot />}
                </div>
                <div className="activity-content">
                  <div className="activity-action">{activity.action}</div>
                  <div className="activity-detail">{activity.detail}</div>
                </div>
                <div className="activity-time">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="dashboard-section">
          <h2>System Status</h2>
          <div className="status-grid">
            <div className="status-card">
              <div className="status-header">
                <FaDatabase />
                <span>Database</span>
              </div>
              <div className="status-indicator status-connected">
                Connected
              </div>
            </div>
            <div className="status-card">
              <div className="status-header">
                <FaRobot />
                <span>Robot</span>
              </div>
              <div className="status-indicator status-warning">
                Standby
              </div>
            </div>
            <div className="status-card">
              <div className="status-header">
                <FaChartLine />
                <span>Performance</span>
              </div>
              <div className="status-indicator status-connected">
                Optimal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
