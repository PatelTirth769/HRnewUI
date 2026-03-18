// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Common API response handler
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'API request failed');
  }
  return response.json();
};