import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { authService } from '../services/auth';
import toast from 'react-hot-toast';

// Auth context
const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        loading: false,
        user: null,
        token: null,
        isAuthenticated: false,
        error: action.payload
      };
    
    case 'LOGOUT':
      return {
        ...state,
        loading: false,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authService.login(credentials);
      
      // Store token in localStorage
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.access_token
        }
      });
      
      toast.success(`Добро пожаловать, ${response.user.username}!`);
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Ошибка входа в систему';
      
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Clear token from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      dispatch({ type: 'LOGOUT' });
      
      toast.success('Вы успешно вышли из системы');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we should still clear local state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        dispatch({ type: 'LOGOUT' });
        return;
      }
      
      dispatch({ type: 'AUTH_START' });
      
      // Verify token with backend
      const userData = await authService.getCurrentUser();
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: userData,
          token: token
        }
      });
      
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Register company function
  const register = useCallback(async (companyData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authService.register(companyData);
      
      toast.success('Компания успешно зарегистрирована! Теперь войдите в систему.');
      
      dispatch({
        type: 'AUTH_FAILURE',
        payload: null
      });
      
      return { success: true, company: response };
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Ошибка регистрации компании';
      
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update user data
  const updateUser = useCallback((userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData
    });
    
    // Update localStorage
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, [state.user]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((roles) => {
    if (!state.user) return false;
    
    if (typeof roles === 'string') {
      return state.user.role === roles;
    }
    
    if (Array.isArray(roles)) {
      return roles.includes(state.user.role);
    }
    
    return false;
  }, [state.user]);

  // Check if user has permission for specific action
  const hasPermission = useCallback((permission) => {
    if (!state.user) return false;
    
    const rolePermissions = {
      'Admin': [
        'read_all', 'write_all', 'delete_all', 'manage_users', 
        'manage_branches', 'manage_settings', 'view_reports'
      ],
      'Accountant': [
        'read_all', 'write_assets', 'write_operations', 
        'write_warehouses', 'view_reports'
      ],
      'Warehouse_keeper': [
        'read_all', 'write_assets', 'write_operations', 'write_warehouses'
      ],
      'Observer': [
        'read_all', 'view_reports'
      ]
    };
    
    const userPermissions = rolePermissions[state.user.role] || [];
    return userPermissions.includes(permission);
  }, [state.user]);

  // Get user display info
  const getUserDisplay = useCallback(() => {
    if (!state.user) return null;
    
    return {
      name: state.user.username,
      email: state.user.email,
      role: state.user.role,
      initials: state.user.username
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    };
  }, [state.user]);

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    login,
    logout,
    register,
    checkAuth,
    updateUser,
    clearError,
    
    // Helpers
    hasRole,
    hasPermission,
    getUserDisplay
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// HOC for components that need auth
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const auth = useAuth();
    
    if (!auth.isAuthenticated) {
      return null;
    }
    
    return <Component {...props} auth={auth} />;
  };
};

export default AuthContext;