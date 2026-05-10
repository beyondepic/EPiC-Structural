// Service for fetching regression data from Flask API
// Replaces static REGRESSION_DATA with dynamic API calls
// Now includes support for encrypted data transmission

import cryptoUtils from './cryptoUtils.js';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8002';

// Helper function to get authorization headers
function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Helper function to handle token refresh on 401 errors
async function handleTokenRefresh() {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
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
    localStorage.setItem('access_token', data.access_token);
    return data.access_token;
  } catch (error) {
    // Clear invalid tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    throw error;
  }
}

// Enhanced fetch function with automatic token refresh and decryption
async function authenticatedFetch(url, options = {}) {
  // Ensure encryption key is available
  if (!cryptoUtils.isInitialized()) {
    console.debug('Initializing encryption...');
    const success = await cryptoUtils.fetchEncryptionKey();
    if (!success) {
      console.warn('Failed to initialize encryption, continuing without encryption');
    }
  }

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...getAuthHeaders()
    }
  });

  // If unauthorized, try to refresh token and retry
  if (response.status === 401) {
    try {
      await handleTokenRefresh();
      // Retry the request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...getAuthHeaders()
        }
      });
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      throw new Error('Authentication failed. Please login again.');
    }
  }

  return response;
}

// Helper function to process encrypted response
async function processResponse(response) {
  console.debug('Processing response:', { encrypted: response.encrypted, hasData: !!response.data });
  
  if (response.encrypted && response.data) {
    try {
      console.debug('Attempting to decrypt response data...');
      // Decrypt the data (Note: decryptData is an async method)
      const decryptedData = await cryptoUtils.decryptData(response.data);
      if (decryptedData) {
        console.debug('Decryption successful');
        return decryptedData;
      } else {
        console.error('Decryption returned null');
        throw new Error('Decryption failed: No data returned');
      }
    } catch (error) {
      console.error('Decryption failed in processResponse:', error);
      // No longer fallback to unencrypted processing, throw error directly
      throw new Error(`Data decryption failed: ${error.message}`);
    }
  } else {
    // Handle unencrypted response (fallback or error)
    console.debug('Processing unencrypted response');
    return response;
  }
}

export async function getRegressionData(params) {
  // params: {structural_system, material, shape, environmental_flow}
  const url = `${API_BASE_URL}/backend/regression-data/`;
  
  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const rawResult = await response.json();
    const result = await processResponse(rawResult); // Added await

    // Check if it's a fallback response
    if (result.fallback) {
      console.warn('Using fallback response due to decryption failure');
      return null;
    }
    
    if (result.success && result.data) {
      // Return data compatible with original REGRESSION_DATA structure
      return {
        intercept: result.data.intercept,
        coefficients: result.data.coefficients,
        rSquared: result.data.r_squared
      };
    } else {
      throw new Error(result.message || 'No data found');
    }
  } catch (err) {
    console.error('Failed to fetch regression data:', err);
    return null;
  }
}

// Batch fetch (optional - for future optimization)
export async function getRegressionDataBatch(combinations) {
  // combinations: [{structural_system, material, shape, environmental_flow}, ...]
  const url = `${API_BASE_URL}/backend/regression-data/batch/`;
  
  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      body: JSON.stringify({ combinations })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const rawResult = await response.json();
    const result = await processResponse(rawResult); // Added await

    // Check if it's a fallback response
    if (result.fallback) {
      console.warn('Using fallback response due to decryption failure');
      return [];
    }
    
    if (result.success && result.results) {
      // Return array of results, each with same structure as getRegressionData
      return result.results.map(r => r.success ? {
        intercept: r.data.intercept,
        coefficients: r.data.coefficients,
        rSquared: r.data.r_squared
      } : null);
    } else {
      throw new Error(result.message || 'No data found');
    }
  } catch (err) {
    console.error('Failed to fetch batch regression data:', err);
    return [];
  }
}

// Get all available combinations
export async function getAvailableCombinations() {
  const url = `${API_BASE_URL}/backend/regression-data/combinations/`;
  
  try {
    const response = await authenticatedFetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const rawResult = await response.json();
    const result = await processResponse(rawResult); // Added await

    // Check if it's a fallback response
    if (result.fallback) {
      console.warn('Using fallback response due to decryption failure');
      return [];
    }
    
    if (result.success && result.data.combinations) {
      return result.data.combinations;
    } else {
      throw new Error(result.message || 'No combinations found');
    }
  } catch (err) {
    console.error('Failed to fetch available combinations:', err);
    return [];
  }
}

// Health check
export async function checkApiHealth() {
  const url = `${API_BASE_URL}/health`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const result = await response.json();
    return result.status === 'ok';
  } catch (err) {
    console.error('API health check failed:', err);
    return false;
  }
}

// Check if user is authenticated by calling a protected endpoint
export async function checkAuthentication() {
  const url = `${API_BASE_URL}/auth/me`;
  
  try {
    const response = await authenticatedFetch(url);
    
    if (!response.ok) {
      return false;
    }
    
    const userData = await response.json();
    return userData;
  } catch (err) {
    console.error('Authentication check failed:', err);
    return false;
  }
}
