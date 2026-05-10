import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginForm.css';

const LoginForm = ({ onClose }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    // Clear error message
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(credentials.username, credentials.password);
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Login failed');
    }
    
    setIsLoading(false);
  };

  const handleDemoLogin = async (username, password) => {
    setIsLoading(true);
    setError('');
    
    const result = await login(username, password);
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Login failed');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="login-overlay">
      <div className="login-modal">
        <div className="login-header">
          <h2>User Login</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Enter username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              placeholder="Enter password"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="demo-accounts">
          <h3>Demo Accounts</h3>
          <div className="demo-buttons">
            <button 
              className="demo-button admin"
              onClick={() => handleDemoLogin('admin', 'admin123')}
              disabled={isLoading}
            >
              Admin Account
              <small>admin / admin123</small>
            </button>
            <button 
              className="demo-button user"
              onClick={() => handleDemoLogin('user', 'user123')}
              disabled={isLoading}
            >
              User Account
              <small>user / user123</small>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;