import { useState, useCallback } from 'react';
import { apiCache } from '@/lib/cache/CacheManager';

interface UseCachedApiOptions {
  cacheKey: string;
  ttl?: number;
  enabled?: boolean;
}

interface UseCachedApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (forceRefresh?: boolean) => Promise<T>;
  invalidate: () => void;
}

/**
 * Hook genérico para manejar llamadas a API con cache
 */
export function useCachedApi<T>(
  apiCall: () => Promise<T>,
  options: UseCachedApiOptions
): UseCachedApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (forceRefresh: boolean = false): Promise<T> => {
    if (!options.enabled && options.enabled !== undefined) {
      throw new Error('API call is disabled');
    }

    try {
      setLoading(true);
      setError(null);

      const result = await apiCache.getOrSet(
        options.cacheKey,
        apiCall,
        forceRefresh ? 0 : options.ttl
      );

      setData(result as T);
      return result as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API call failed';
      setError(errorMessage);
      
      // Intentar obtener del cache en caso de error
      const cachedResult = apiCache.get(options.cacheKey) as T | null;
      if (cachedResult !== null) {
        setData(cachedResult);
        return cachedResult;
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, options]);

  const invalidate = useCallback(() => {
    apiCache.delete(options.cacheKey);
    setData(null);
  }, [options.cacheKey]);

  return {
    data,
    loading,
    error,
    execute,
    invalidate
  };
}

/**
 * Hook especializado para listados con cache
 */
export function useCachedList<T>(
  apiCall: () => Promise<T[]>,
  cacheKey: string,
  ttl?: number
) {
  return useCachedApi(apiCall, { cacheKey, ttl, enabled: true });
}

/**
 * Hook para invalidar múltiples caches por patrón
 */
export function useCacheInvalidation() {
  const invalidatePattern = useCallback((pattern: RegExp) => {
    const deleted = apiCache.invalidatePattern(pattern.source);
    return deleted;
  }, []);

  const invalidateAll = useCallback(() => {
    apiCache.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    return apiCache.getStats();
  }, []);

  return {
    invalidatePattern,
    invalidateAll,
    getCacheStats
  };
}