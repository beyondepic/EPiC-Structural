import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check local storage for saved token on initialization
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user_info');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user info:', error);
        // Clear invalid data
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8002'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Save token and user info
      setToken(data.access_token);
      setUser(data.user);
      
      // Store in local storage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_info', JSON.stringify(data.user));
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8002'}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem('access_token', data.access_token);
      
      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout(); // If refresh fails, clear all authentication info
      return null;
    }
  };

  const isAuthenticated = !!(user && token);

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    refreshToken,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};