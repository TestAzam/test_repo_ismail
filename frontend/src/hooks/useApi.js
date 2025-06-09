import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, isCancel } from '../services/api';
import toast from 'react-hot-toast';

// Custom hook for API calls with loading, error handling, and caching
export const useApi = (apiCall, dependencies = [], options = {}) => {
  const {
    immediate = true,
    defaultData = null,
    onSuccess,
    onError,
    showErrorToast = true,
    cacheKey,
    cacheTTL = 5 * 60 * 1000 // 5 minutes
  } = options;

  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cancelTokenRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Execute API call
  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache if cacheKey is provided
      if (cacheKey) {
        const cached = cacheRef.current.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < cacheTTL) {
          setData(cached.data);
          setLoading(false);
          return cached.data;
        }
      }

      // Cancel previous request if exists
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Operation cancelled due to new request');
      }

      // Create new cancel token
      cancelTokenRef.current = apiService.createCancelToken?.() || null;

      const result = await apiCall(...args);
      
      setData(result);
      
      // Cache result if cacheKey is provided
      if (cacheKey) {
        cacheRef.current.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      if (onSuccess) {
        onSuccess(result);
      }

      return result;

    } catch (err) {
      if (isCancel && isCancel(err)) {
        // Request was cancelled, don't update state
        return;
      }

      setError(err);
      
      if (showErrorToast) {
        const errorMessage = err.response?.data?.detail || err.message || 'Произошла ошибка';
        toast.error(errorMessage);
      }

      if (onError) {
        onError(err);
      }

      throw err;

    } finally {
      setLoading(false);
      cancelTokenRef.current = null;
    }
  }, [apiCall, cacheKey, cacheTTL, onSuccess, onError, showErrorToast]);

  // Auto execute on mount and dependency changes
  useEffect(() => {
    if (immediate) {
      execute();
    }

    // Cleanup function
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
    };
  }, [immediate, execute, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
    };
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    if (cacheKey) {
      cacheRef.current.delete(cacheKey);
    }
  }, [cacheKey]);

  // Reset state
  const reset = useCallback(() => {
    setData(defaultData);
    setError(null);
    setLoading(false);
    clearCache();
  }, [defaultData, clearCache]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    clearCache
  };
};

// Hook for paginated API calls
export const usePaginatedApi = (apiCall, initialParams = {}, options = {}) => {
  const [params, setParams] = useState({
    page: 1,
    size: 10,
    ...initialParams
  });

  const {
    data: response,
    loading,
    error,
    execute,
    reset
  } = useApi(
    () => apiCall(params),
    [JSON.stringify(params)],
    options
  );

  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const nextPage = useCallback(() => {
    if (response?.has_next) {
      updateParams({ page: params.page + 1 });
    }
  }, [response?.has_next, params.page, updateParams]);

  const prevPage = useCallback(() => {
    if (response?.has_prev) {
      updateParams({ page: params.page - 1 });
    }
  }, [response?.has_prev, params.page, updateParams]);

  const goToPage = useCallback((page) => {
    updateParams({ page });
  }, [updateParams]);

  const changePageSize = useCallback((size) => {
    updateParams({ page: 1, size });
  }, [updateParams]);

  return {
    data: response?.items || [],
    pagination: {
      page: response?.page || 1,
      size: response?.size || 10,
      total: response?.total || 0,
      pages: response?.pages || 0,
      has_next: response?.has_next || false,
      has_prev: response?.has_prev || false
    },
    params,
    loading,
    error,
    execute,
    reset,
    updateParams,
    nextPage,
    prevPage,
    goToPage,
    changePageSize
  };
};

// Hook for debounced API calls (useful for search)
export const useDebouncedApi = (apiCall, delay = 300, dependencies = [], options = {}) => {
  const [debouncedDeps, setDebouncedDeps] = useState(dependencies);
  const timeoutRef = useRef(null);

  // Debounce dependencies
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedDeps(dependencies);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);

  // Use regular useApi with debounced dependencies
  return useApi(apiCall, debouncedDeps, { immediate: false, ...options });
};

// Hook for infinite scroll/load more functionality
export const useInfiniteApi = (apiCall, initialParams = {}, options = {}) => {
  const [allData, setAllData] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [params, setParams] = useState({
    page: 1,
    size: 20,
    ...initialParams
  });

  const {
    data: response,
    loading,
    error,
    execute
  } = useApi(
    () => apiCall(params),
    [JSON.stringify(params)],
    {
      immediate: false,
      onSuccess: (data) => {
        if (params.page === 1) {
          // First page - replace all data
          setAllData(data.items || []);
        } else {
          // Subsequent pages - append data
          setAllData(prev => [...prev, ...(data.items || [])]);
        }
        
        setHasMore(data.has_next || false);
        
        if (options.onSuccess) {
          options.onSuccess(data);
        }
      },
      ...options
    }
  );

  // Load initial data
  useEffect(() => {
    execute();
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setParams(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [loading, hasMore]);

  const refresh = useCallback(() => {
    setParams(prev => ({ ...prev, page: 1 }));
    setAllData([]);
    setHasMore(true);
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setParams(prev => ({ ...prev, ...newFilters, page: 1 }));
    setAllData([]);
    setHasMore(true);
  }, []);

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    updateFilters
  };
};

// Hook for optimistic updates
export const useOptimisticApi = (apiCall, options = {}) => {
  const [data, setData] = useState(options.defaultData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (optimisticData, ...args) => {
    const previousData = data;
    
    try {
      setLoading(true);
      setError(null);
      
      // Apply optimistic update
      if (optimisticData !== undefined) {
        setData(optimisticData);
      }

      const result = await apiCall(...args);
      setData(result);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;

    } catch (err) {
      // Revert optimistic update on error
      setData(previousData);
      setError(err);
      
      if (options.onError) {
        options.onError(err);
      }

      throw err;

    } finally {
      setLoading(false);
    }
  }, [apiCall, data, options]);

  return {
    data,
    loading,
    error,
    execute
  };
};

export default useApi;