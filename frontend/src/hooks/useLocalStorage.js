import { useState, useEffect, useCallback } from 'react';

// Custom hook for localStorage with React state synchronization
export const useLocalStorage = (key, defaultValue = null, options = {}) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncAcrossTabs = true
  } = options;

  // Get initial value from localStorage or use default
  const getInitialValue = useCallback(() => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return deserialize(item);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }, [key, defaultValue, deserialize]);

  const [storedValue, setStoredValue] = useState(getInitialValue);

  // Update localStorage when value changes
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (valueToStore === null || valueToStore === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, serialize(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, storedValue]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(defaultValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  // Listen for changes from other tabs
  useEffect(() => {
    if (!syncAcrossTabs) return;

    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage change for key "${key}":`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(defaultValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, defaultValue, deserialize, syncAcrossTabs]);

  return [storedValue, setValue, removeValue];
};

// Hook for session storage
export const useSessionStorage = (key, defaultValue = null, options = {}) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse
  } = options;

  const getInitialValue = useCallback(() => {
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return deserialize(item);
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return defaultValue;
    }
  }, [key, defaultValue, deserialize]);

  const [storedValue, setStoredValue] = useState(getInitialValue);

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (valueToStore === null || valueToStore === undefined) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, serialize(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, serialize, storedValue]);

  const removeValue = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
      setStoredValue(defaultValue);
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
};

// Hook for storing complex objects with validation
export const useStoredState = (key, defaultValue, validator = null) => {
  const [value, setValue, removeValue] = useLocalStorage(key, defaultValue, {
    serialize: (val) => {
      if (validator && !validator(val)) {
        throw new Error(`Invalid value for key "${key}"`);
      }
      return JSON.stringify(val);
    },
    deserialize: (str) => {
      const parsed = JSON.parse(str);
      if (validator && !validator(parsed)) {
        throw new Error(`Invalid stored value for key "${key}"`);
      }
      return parsed;
    }
  });

  return [value, setValue, removeValue];
};

// Hook for storing arrays with utility methods
export const useStoredArray = (key, defaultValue = []) => {
  const [array, setArray, removeArray] = useLocalStorage(key, defaultValue);

  const push = useCallback((item) => {
    setArray(prev => [...prev, item]);
  }, [setArray]);

  const remove = useCallback((index) => {
    setArray(prev => prev.filter((_, i) => i !== index));
  }, [setArray]);

  const removeByValue = useCallback((value) => {
    setArray(prev => prev.filter(item => item !== value));
  }, [setArray]);

  const update = useCallback((index, newValue) => {
    setArray(prev => prev.map((item, i) => i === index ? newValue : item));
  }, [setArray]);

  const clear = useCallback(() => {
    setArray([]);
  }, [setArray]);

  const contains = useCallback((value) => {
    return array.includes(value);
  }, [array]);

  return {
    array,
    setArray,
    removeArray,
    push,
    remove,
    removeByValue,
    update,
    clear,
    contains,
    length: array.length,
    isEmpty: array.length === 0
  };
};

// Hook for storing user preferences
export const usePreferences = (defaultPreferences = {}) => {
  const [preferences, setPreferences, removePreferences] = useLocalStorage(
    'user_preferences',
    defaultPreferences
  );

  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, [setPreferences]);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, [setPreferences, defaultPreferences]);

  const getPreference = useCallback((key, fallback = null) => {
    return preferences[key] ?? fallback;
  }, [preferences]);

  return {
    preferences,
    updatePreference,
    resetPreferences,
    getPreference,
    removePreferences
  };
};

// Hook for recent items (with automatic cleanup)
export const useRecentItems = (key, maxItems = 10) => {
  const [items, setItems] = useLocalStorage(key, []);

  const addItem = useCallback((item) => {
    setItems(prev => {
      // Remove existing item if present
      const filtered = prev.filter(existing => 
        JSON.stringify(existing) !== JSON.stringify(item)
      );
      
      // Add to beginning and limit to maxItems
      return [item, ...filtered].slice(0, maxItems);
    });
  }, [setItems, maxItems]);

  const removeItem = useCallback((item) => {
    setItems(prev => prev.filter(existing => 
      JSON.stringify(existing) !== JSON.stringify(item)
    ));
  }, [setItems]);

  const clearItems = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return {
    items,
    addItem,
    removeItem,
    clearItems
  };
};

export default useLocalStorage;