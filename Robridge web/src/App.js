import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
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
import DeviceConnected from './pages/DeviceConnected';
import SavedScans from './pages/SavedScans';
import Settings from './pages/Settings';
import './App.css';

// Protected Route Component with Role-based Access Control
function ProtectedRoute({ children, requiredPath }) {
  const { isAuthenticated, hasPageAccess, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPath && !hasPageAccess(requiredPath)) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p>Your role doesn't include access to this feature.</p>
          <button onClick={() => window.history.back()}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
}

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
          <Route path="/" element={
            <ProtectedRoute requiredPath="/">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/scanner" element={
            <ProtectedRoute requiredPath="/scanner">
              <BarcodeScanner />
            </ProtectedRoute>
          } />
          <Route path="/generator" element={
            <ProtectedRoute requiredPath="/generator">
              <BarcodeGenerator />
            </ProtectedRoute>
          } />
          <Route path="/image-processing" element={
            <ProtectedRoute requiredPath="/image-processing">
              <ImageProcessing />
            </ProtectedRoute>
          } />
          <Route path="/robot-control" element={
            <ProtectedRoute requiredPath="/robot-control">
              <RobotControl />
            </ProtectedRoute>
          } />
          <Route path="/rack-status" element={
            <ProtectedRoute requiredPath="/rack-status">
              <RackStatus />
            </ProtectedRoute>
          } />
          <Route path="/rack-management" element={
            <ProtectedRoute requiredPath="/rack-management">
              <RackManagement />
            </ProtectedRoute>
          } />
          <Route path="/product-management" element={
            <ProtectedRoute requiredPath="/product-management">
              <ProductManagement />
            </ProtectedRoute>
          } />
          <Route path="/device-connected" element={
            <ProtectedRoute requiredPath="/device-connected">
              <DeviceConnected />
            </ProtectedRoute>
          } />
          <Route path="/saved-scans" element={
            <ProtectedRoute requiredPath="/saved-scans">
              <SavedScans />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute requiredPath="/settings">
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  );
}

// Main App Component with Auth Provider
function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router>
          <AppContent />
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
