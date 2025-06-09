import axios from 'axios';
import toast from 'react-hot-toast';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { requestStartedAt: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.requestStartedAt;
    
    // Log slow requests in development
    if (process.env.NODE_ENV === 'development' && duration > 2000) {
      console.warn(`Slow API request: ${response.config.method?.toUpperCase()} ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    const { response, request, config } = error;
    
    // Calculate request duration if available
    if (config?.metadata?.requestStartedAt) {
      const duration = new Date() - config.metadata.requestStartedAt;
      console.error(`API request failed after ${duration}ms:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        status: response?.status,
        error: response?.data
      });
    }
    
    // Handle different error scenarios
    if (response) {
      // Server responded with error status
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          handleUnauthorized();
          break;
        
        case 403:
          // Forbidden - show permission error
          toast.error('У вас нет прав для выполнения этого действия');
          break;
        
        case 404:
          // Not found
          toast.error('Запрашиваемый ресурс не найден');
          break;
        
        case 422:
          // Validation error
          handleValidationError(data);
          break;
        
        case 429:
          // Too many requests
          toast.error('Слишком много запросов. Попробуйте позже');
          break;
        
        case 500:
          // Server error
          toast.error('Внутренняя ошибка сервера. Попробуйте позже');
          break;
        
        default:
          // Generic error
          const message = data?.detail || data?.message || 'Произошла ошибка при выполнении запроса';
          toast.error(message);
      }
    } else if (request) {
      // Request was made but no response received
      if (error.code === 'ECONNABORTED') {
        toast.error('Превышено время ожидания запроса');
      } else {
        toast.error('Нет соединения с сервером');
      }
    } else {
      // Something else happened
      toast.error('Произошла неожиданная ошибка');
    }
    
    return Promise.reject(error);
  }
);

// Handle unauthorized access
const handleUnauthorized = () => {
  // Clear stored authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirect to login if not already there
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
    toast.error('Сессия истекла. Пожалуйста, войдите снова');
  }
};

// Handle validation errors
const handleValidationError = (data) => {
  if (data?.detail && Array.isArray(data.detail)) {
    // FastAPI validation errors
    const errors = data.detail.map(err => `${err.loc?.join('.')}: ${err.msg}`);
    toast.error(`Ошибка валидации: ${errors.join(', ')}`);
  } else if (data?.detail) {
    toast.error(data.detail);
  } else {
    toast.error('Ошибка валидации данных');
  }
};

// Utility functions for common HTTP methods
export const apiService = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // File upload
  upload: async (url, formData, config = {}) => {
    try {
      const response = await api.post(url, formData, {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Download file
  download: async (url, config = {}) => {
    try {
      const response = await api.get(url, {
        ...config,
        responseType: 'blob',
      });
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Get filename from headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('API health check failed');
  }
};

// Request cancellation utility
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

// Check if error is cancellation
export const isCancel = (error) => {
  return axios.isCancel(error);
};

// Retry utility for failed requests
export const retryRequest = async (requestFn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Don't retry client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

// Batch requests utility
export const batchRequests = async (requests, batchSize = 5) => {
  const results = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch);
    results.push(...batchResults);
  }
  
  return results;
};

// URL builder utility
export const buildUrl = (path, params = {}) => {
  let url = path;
  
  // Add query parameters
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  
  const queryString = searchParams.toString();
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString;
  }
  
  return url;
};

// Cache utility for GET requests
const cache = new Map();

export const cachedRequest = async (url, ttl = 5 * 60 * 1000) => { // 5 minutes default TTL
  const cacheKey = url;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  try {
    const data = await apiService.get(url);
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    return data;
  } catch (error) {
    // If we have cached data and request fails, return cached data
    if (cached) {
      console.warn('Using stale cache due to request failure:', error);
      return cached.data;
    }
    throw error;
  }
};

// Clear cache
export const clearCache = (pattern) => {
  if (pattern) {
    // Clear specific pattern
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    // Clear all cache
    cache.clear();
  }
};

export default api;