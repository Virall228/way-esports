import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiOptions<T> {
  initialData?: T;
  cacheKey?: string;
  cacheTTL?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

// Global cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getCachedData = (key: string): any => {
  const cached = apiCache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    apiCache.delete(key);
    return null;
  }

  return cached.data;
};

const setCachedData = (key: string, data: any, ttl: number): void => {
  apiCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

export function useApi<T = any>(
  apiCall: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const {
    initialData = null,
    cacheKey,
    cacheTTL = 5 * 1000, // 5 seconds default to avoid stale data
    onSuccess,
    onError,
    enabled = true
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    if (cacheKey) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        setData(cached);
        return;
      }
    }

    setLoading(true);
    setError(null);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const result = await apiCall();

      setData(result);

      // Cache the result
      if (cacheKey) {
        setCachedData(cacheKey, result, cacheTTL);
      }

      onSuccess?.(result);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled
      }

      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [apiCall, cacheKey, cacheTTL, onSuccess, onError, enabled]);

  const refetch = useCallback(async () => {
    // Clear cache for this key
    if (cacheKey) {
      apiCache.delete(cacheKey);
    }
    await fetchData();
  }, [fetchData, cacheKey]);

  const clearCache = useCallback(() => {
    if (cacheKey) {
      apiCache.delete(cacheKey);
    }
  }, [cacheKey]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache
  };
}

// Hook for mutations (POST, PUT, DELETE)
export function useMutation<T = any, R = any>(
  mutationFn: (data: T) => Promise<R>,
  options: {
    onSuccess?: (data: R) => void;
    onError?: (error: Error) => void;
  } = {}
): {
  mutate: (data: T) => Promise<R | undefined>;
  loading: boolean;
  error: Error | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (data: T): Promise<R | undefined> => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(data);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  return {
    mutate,
    loading,
    error
  };
}

// Utility to clear all cache
export const clearAllApiCache = (): void => {
  apiCache.clear();
};

// Utility to clear cache by pattern
export const clearApiCacheByPattern = (pattern: string): void => {
  for (const [key] of apiCache.entries()) {
    if (key.includes(pattern)) {
      apiCache.delete(key);
    }
  }
}; 