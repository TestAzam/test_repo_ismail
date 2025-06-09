import { apiService } from './api';

// Authentication service
export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await apiService.post('/auth/login', credentials);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Register company
  register: async (companyData) => {
    try {
      const response = await apiService.post('/auth/register', companyData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiService.get('/auth/me');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Refresh token (if implemented)
  refreshToken: async (refreshToken) => {
    try {
      const response = await apiService.post('/auth/refresh', {
        refresh_token: refreshToken
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Logout (clear local storage)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Get stored user
  getUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      return null;
    }
  },

  // Store auth data
  storeAuthData: (authData) => {
    try {
      localStorage.setItem('token', authData.access_token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      
      if (authData.refresh_token) {
        localStorage.setItem('refresh_token', authData.refresh_token);
      }
    } catch (error) {
      console.error('Failed to store auth data:', error);
    }
  },

  // Clear auth data
  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
  },

  // Check if token is expired (basic check)
  isTokenExpired: () => {
    const token = localStorage.getItem('token');
    if (!token) return true;

    try {
      // Basic JWT token expiration check
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return true;
    }
  },

  // Get token expiration time
  getTokenExpiration: () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Failed to get token expiration:', error);
      return null;
    }
  }
};