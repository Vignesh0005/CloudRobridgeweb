import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaHome, 
  FaBarcode, 
  FaQrcode, 
  FaImage, 
  FaRobot, 
  FaWarehouse,
  FaWifi,
  FaCog,
  FaCogs,
  FaBox,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaUser
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout, getUserInfo } = useAuth();
  const user = getUserInfo();


  const navItems = [
    { path: '/', icon: FaHome, label: 'Dashboard' },
    { path: '/scanner', icon: FaBarcode, label: 'Barcode Scanner' },
    { path: '/generator', icon: FaQrcode, label: 'Barcode Generator' },
    { path: '/image-processing', icon: FaImage, label: 'Image Processing' },
    { path: '/robot-control', icon: FaRobot, label: 'Robot Status' },
    { path: '/rack-status', icon: FaWarehouse, label: 'Rack Status' },
    { path: '/rack-management', icon: FaWarehouse, label: 'Rack Management' },
    { path: '/product-management', icon: FaBox, label: 'Product Management' },
    { path: '/rack-settings', icon: FaCogs, label: 'Rack Settings' },
    { path: '/device-connected', icon: FaWifi, label: 'Device Connected' },
    { path: '/settings', icon: FaCog, label: 'Settings' }
  ];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <nav className={`navigation ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="nav-header">
        <div className="nav-logo">
          <img src="/logo.png" alt="RobBridge Logo" className="logo-image" />
        </div>
        <button className="nav-toggle" onClick={toggleCollapse}>
          {isCollapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>
      
      <ul className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path} className="nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
                title={isCollapsed ? item.label : ''}
              >
                <Icon className="nav-icon" />
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div className="nav-footer">
        {!isCollapsed && user && (
          <div className="user-info">
            <div className="user-avatar">
              <FaUser />
            </div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
        )}
        
        <button 
          className="logout-btn"
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : ''}
        >
          <FaSignOutAlt />
          {!isCollapsed && <span>Logout</span>}
        </button>
        
        <div className="nav-version">v1.0.0</div>
      </div>
    </nav>
  );
};

export default Navigation;
