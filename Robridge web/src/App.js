import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import BarcodeScanner from './pages/BarcodeScanner';
import BarcodeGenerator from './pages/BarcodeGenerator';
import ImageProcessing from './pages/ImageProcessing';
import RobotControl from './pages/RobotControl';
import RackStatus from './pages/RackStatus';
import RackManagement from './pages/RackManagement';
import ProductManagement from './pages/ProductManagement';
import RackSettings from './pages/RackSettings';
import DeviceConnected from './pages/DeviceConnected';
import Settings from './pages/Settings';
import './App.css';

// Main App Content Component
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading RobBridge...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated()) {
    return <LoginPage />;
  }

  // Show main application if authenticated
  return (
    <div className="App">
      <Navigation />
      <main className="app-main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scanner" element={<BarcodeScanner />} />
          <Route path="/generator" element={<BarcodeGenerator />} />
          <Route path="/image-processing" element={<ImageProcessing />} />
          <Route path="/robot-control" element={<RobotControl />} />
          <Route path="/rack-status" element={<RackStatus />} />
          <Route path="/rack-management" element={<RackManagement />} />
          <Route path="/product-management" element={<ProductManagement />} />
          <Route path="/rack-settings" element={<RackSettings />} />
          <Route path="/device-connected" element={<DeviceConnected />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

// Main App Component with Auth Provider
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
