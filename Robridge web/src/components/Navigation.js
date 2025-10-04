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
  FaUser,
  FaShieldAlt,
  FaCrown
} from 'react-icons/fa';
import { useAuth, ROLES } from '../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout, getUserInfo, hasPageAccess, getUserRole } = useAuth();
  const user = getUserInfo();
  const userRole = getUserRole();

  // All available navigation items
  const allNavItems = [
    { path: '/', icon: FaHome, label: 'Dashboard', roles: [ROLES.ADMIN, ROLES.EXPO_USER, ROLES.FULL_ACCESS] },
    { path: '/scanner', icon: FaBarcode, label: 'Barcode Scanner', roles: [ROLES.ADMIN, ROLES.EXPO_USER, ROLES.FULL_ACCESS] },
    { path: '/generator', icon: FaQrcode, label: 'Barcode Generator', roles: [ROLES.ADMIN, ROLES.FULL_ACCESS] },
    { path: '/image-processing', icon: FaImage, label: 'Image Processing', roles: [ROLES.ADMIN, ROLES.FULL_ACCESS] },
    { path: '/robot-control', icon: FaRobot, label: 'Robot Status', roles: [ROLES.ADMIN, ROLES.FULL_ACCESS] },
    { path: '/rack-status', icon: FaWarehouse, label: 'Rack Status', roles: [ROLES.ADMIN, ROLES.FULL_ACCESS] },
    { path: '/rack-management', icon: FaWarehouse, label: 'Rack Management', roles: [ROLES.ADMIN, ROLES.FULL_ACCESS] },
    { path: '/product-management', icon: FaBox, label: 'Product Management', roles: [ROLES.ADMIN, ROLES.FULL_ACCESS] },
    { path: '/device-connected', icon: FaWifi, label: 'Device Connected', roles: [ROLES.ADMIN, ROLES.EXPO_USER, ROLES.FULL_ACCESS] },
    { path: '/settings', icon: FaCog, label: 'Settings', roles: [ROLES.ADMIN, ROLES.FULL_ACCESS] }
  ];

  // Filter navigation items based on user role and page access
  const navItems = allNavItems.filter(item => {
    if (!user || !userRole) return false;
    
    // Check if user's role is in the item's allowed roles
    const hasRoleAccess = item.roles.includes(userRole);
    
    // Also check page access for additional security
    const hasPageAccessCheck = hasPageAccess(item.path);
    
    return hasRoleAccess && hasPageAccessCheck;
  });

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
        <div className={`nav-logo ${userRole === ROLES.EXPO_USER ? 'expo-logo' : ''}`}>
          <img src="/logo.png" alt="RobBridge Logo" className={`logo-image ${userRole === ROLES.EXPO_USER ? 'expo-logo-image' : ''}`} />
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
              {userRole === ROLES.EXPO_USER && <FaUser />}
              {userRole === ROLES.ADMIN && <FaShieldAlt />}
              {userRole === ROLES.FULL_ACCESS && <FaCrown />}
            </div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
              <div className="user-role">
                {userRole === ROLES.EXPO_USER && 'Expo User'}
                {userRole === ROLES.ADMIN && 'Administrator'}
                {userRole === ROLES.FULL_ACCESS && 'Full Access'}
              </div>
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
