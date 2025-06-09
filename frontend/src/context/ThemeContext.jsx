import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// Theme context
const ThemeContext = createContext();

// Theme types
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// Theme reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
        resolvedTheme: action.payload === THEMES.AUTO 
          ? (state.systemTheme || THEMES.LIGHT)
          : action.payload
      };
    
    case 'SET_SYSTEM_THEME':
      return {
        ...state,
        systemTheme: action.payload,
        resolvedTheme: state.theme === THEMES.AUTO 
          ? action.payload 
          : state.theme
      };
    
    case 'TOGGLE_THEME':
      const newTheme = state.resolvedTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
      return {
        ...state,
        theme: newTheme,
        resolvedTheme: newTheme
      };
    
    default:
      return state;
  }
};

// Get initial theme from localStorage or system preference
const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      return savedTheme;
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
  }
  
  // Default to auto mode
  return THEMES.AUTO;
};

// Get system theme preference
const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? THEMES.DARK 
      : THEMES.LIGHT;
  }
  return THEMES.LIGHT;
};

// Initial state
const initialState = {
  theme: getInitialTheme(),
  systemTheme: getSystemTheme(),
  resolvedTheme: THEMES.LIGHT
};

// Set resolved theme
initialState.resolvedTheme = initialState.theme === THEMES.AUTO 
  ? initialState.systemTheme 
  : initialState.theme;

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Set theme
  const setTheme = useCallback((theme) => {
    try {
      localStorage.setItem('theme', theme);
      dispatch({ type: 'SET_THEME', payload: theme });
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
      dispatch({ type: 'SET_THEME', payload: theme });
    }
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    dispatch({ type: 'TOGGLE_THEME' });
    
    // Save to localStorage
    try {
      const newTheme = state.resolvedTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [state.resolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      const newSystemTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
      dispatch({ type: 'SET_SYSTEM_THEME', payload: newSystemTheme });
    };

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(state.resolvedTheme);
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = state.resolvedTheme === THEMES.DARK ? '#1f2937' : '#3b82f6';
    }
  }, [state.resolvedTheme]);

  // Get theme info
  const getThemeInfo = useCallback(() => {
    return {
      current: state.theme,
      resolved: state.resolvedTheme,
      system: state.systemTheme,
      isDark: state.resolvedTheme === THEMES.DARK,
      isLight: state.resolvedTheme === THEMES.LIGHT,
      isAuto: state.theme === THEMES.AUTO
    };
  }, [state]);

  // Get theme icon
  const getThemeIcon = useCallback(() => {
    switch (state.theme) {
      case THEMES.LIGHT:
        return 'Sun';
      case THEMES.DARK:
        return 'Moon';
      case THEMES.AUTO:
        return 'Monitor';
      default:
        return 'Sun';
    }
  }, [state.theme]);

  // Get next theme in cycle
  const getNextTheme = useCallback(() => {
    switch (state.theme) {
      case THEMES.LIGHT:
        return THEMES.DARK;
      case THEMES.DARK:
        return THEMES.AUTO;
      case THEMES.AUTO:
        return THEMES.LIGHT;
      default:
        return THEMES.LIGHT;
    }
  }, [state.theme]);

  // Cycle through themes
  const cycleTheme = useCallback(() => {
    const nextTheme = getNextTheme();
    setTheme(nextTheme);
  }, [getNextTheme, setTheme]);

  // Context value
  const value = {
    // State
    theme: state.theme,
    resolvedTheme: state.resolvedTheme,
    systemTheme: state.systemTheme,
    
    // Actions
    setTheme,
    toggleTheme,
    cycleTheme,
    
    // Helpers
    getThemeInfo,
    getThemeIcon,
    getNextTheme,
    
    // Constants
    THEMES
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

// HOC for components that need theme
export const withTheme = (Component) => {
  return function ThemedComponent(props) {
    const theme = useTheme();
    
    return <Component {...props} theme={theme} />;
  };
};

export default ThemeContext;