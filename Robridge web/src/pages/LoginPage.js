import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaLock, FaEnvelope, FaSignInAlt, FaUser, FaCrown, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    // Simulate login process
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call the login function from auth context with role-based validation
      const result = login(formData.email, formData.password);
      
      if (result.success) {
        setSuccess(result.message);
        // The AuthContext will handle the redirect automatically
      } else {
        setError(result.message);
      }
      
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="background-pattern"></div>
      </div>
      
      <div className="login-center">
        <div className="login-header">
          <div className="login-logo">
            <img 
              src="/robridge-logo.png" 
              alt="Robridge Logo" 
              className="logo-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="logo-fallback" style={{display: 'none'}}>
              <div className="logo-text">ROBRIDGE</div>
            </div>
          </div>
          <h1 className="login-title">Welcome</h1>
          <p className="login-subtitle">Robot Control and Barcode Management System</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-container">
              <div className="input-icon">
                <FaEnvelope />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Gmail"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-container">
              <div className="input-icon">
                <FaLock />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <button
            type="submit"
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Signing In...
              </>
            ) : (
              <>
                <FaSignInAlt />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="demo-credentials-section">
            <div className="section-divider"></div>
            <h3 className="demo-title">Role-Based Access:</h3>
            <p className="demo-description">
              The system automatically detects your access level based on your email domain.
            </p>
            
            <div className="role-examples">
              <div className="role-item">
                <FaUser className="role-icon expo-icon" />
                <div className="role-info">
                  <strong>@expo.com / @expo.dev / @expo.io</strong>
                  <span>Expo User - Dashboard, Scanner, Device Connected</span>
                </div>
              </div>
              
              <div className="role-item">
                <FaShieldAlt className="role-icon admin-icon" />
                <div className="role-info">
                  <strong>@admin.robridge.com</strong>
                  <span>Admin - Full Access + Admin Controls</span>
                </div>
              </div>
              
              <div className="role-item">
                <FaCrown className="role-icon full-icon" />
                <div className="role-info">
                  <strong>@robridge.com</strong>
                  <span>Full Access - All Features</span>
                </div>
              </div>
            </div>
            
            <div className="demo-buttons">
              <button 
                type="button" 
                className="demo-btn expo-btn"
                onClick={() => {
                  setFormData({ email: 'user@expo.com', password: 'expo123' });
                }}
              >
                <FaUser />
                Expo User
              </button>
              
              <button 
                type="button" 
                className="demo-btn admin-btn"
                onClick={() => {
                  setFormData({ email: 'admin@admin.robridge.com', password: 'admin123' });
                }}
              >
                <FaShieldAlt />
                Admin Access
              </button>
              
              <button 
                type="button" 
                className="demo-btn full-btn"
                onClick={() => {
                  setFormData({ email: 'user@robridge.com', password: 'full123' });
                }}
              >
                <FaCrown />
                Full Access
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
