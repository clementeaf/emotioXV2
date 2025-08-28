import { useState, useEffect, useCallback } from 'react';
import { Company } from '../../../shared/interfaces/company.interface';
import { companyService } from '@/services/companyService';
import { companiesCache } from '@/lib/cache/CacheManager';
import { setupAuthToken } from '@/lib/api';

interface UseCachedCompaniesResult {
  companies: Company[];
  loading: boolean;
  error: string | null;
  refreshCompanies: () => Promise<void>;
  invalidateCache: () => void;
}

const CACHE_KEY = 'active-companies';

/**
 * Hook optimizado con cache para manejar empresas
 */
export const useCachedCompanies = (autoLoad: boolean = true): UseCachedCompaniesResult => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async (useCache: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      
      // Configurar token antes de la llamada
      setupAuthToken();

      // Usar cache con función de fallback
      const fetchedCompanies = await companiesCache.getOrSet(
        CACHE_KEY,
        async () => {
          const result = await companyService.getActiveCompanies();
          
          // Si no hay empresas en la base de datos, usar fallback
          if (result.length === 0) {
            return [
              { id: 'enterprise1', name: 'Enterprise 1', status: 'active', createdAt: '', updatedAt: '' },
              { id: 'enterprise2', name: 'Enterprise 2', status: 'active', createdAt: '', updatedAt: '' },
              { id: 'enterprise3', name: 'Enterprise 3', status: 'active', createdAt: '', updatedAt: '' }
            ] as Company[];
          }
          
          return result;
        },
        useCache ? undefined : 0 // TTL 0 para forzar refresh
      );
      
      setCompanies(fetchedCompanies);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading companies');
      
      // En caso de error, intentar cargar del cache o usar fallback
      const cachedCompanies = companiesCache.get<Company[]>(CACHE_KEY);
      if (cachedCompanies) {
        setCompanies(cachedCompanies);
      } else {
        const fallbackCompanies: Company[] = [
          { id: 'enterprise1', name: 'Enterprise 1', status: 'active', createdAt: '', updatedAt: '' },
          { id: 'enterprise2', name: 'Enterprise 2', status: 'active', createdAt: '', updatedAt: '' },
          { id: 'enterprise3', name: 'Enterprise 3', status: 'active', createdAt: '', updatedAt: '' }
        ];
        setCompanies(fallbackCompanies);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCompanies = useCallback(() => {
    return fetchCompanies(false); // No usar cache
  }, [fetchCompanies]);

  const invalidateCache = useCallback(() => {
    companiesCache.delete(CACHE_KEY);
  }, []);

  useEffect(() => {
    if (autoLoad) {
      fetchCompanies();
    }
  }, [autoLoad, fetchCompanies]);

  return {
    companies,
    loading,
    error,
    refreshCompanies,
    invalidateCache
  };
};