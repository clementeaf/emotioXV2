import { useState, useCallback } from 'react';
import { apiEndpoints } from '@/config/api.config';
import { useAuth } from './useAuth';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface UseApiOptions {
  headers?: HeadersInit;
  credentials?: RequestCredentials;
}

export function useApi<T = any>(defaultOptions: UseApiOptions = {}) {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchApi = useCallback(
    async (
      url: string,
      method: string = 'GET',
      body?: any,
      options: UseApiOptions = {}
    ): Promise<ApiResponse<T>> => {
      setLoading(true);
      
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        };

        // Para solicitudes a través del proxy local, no necesitamos mode: 'cors'
        // Para solicitudes directas a AWS, necesitamos mode: 'cors'
        const isProxyUrl = url.startsWith('/');
        
        const fetchOptions: RequestInit = {
          method,
          headers,
          // Importante: No enviar credenciales para evitar problemas de CORS
          credentials: 'omit',
          ...(body ? { body: JSON.stringify(body) } : {}),
          mode: 'cors',
        };

        console.log('Fetching URL:', url, 'with options:', fetchOptions);

        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { data, error: null, loading: false };
      } catch (error) {
        console.error('API Error:', error);
        return {
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const get = useCallback(
    (url: string, options?: UseApiOptions) => fetchApi(url, 'GET', undefined, options),
    [fetchApi]
  );

  const post = useCallback(
    (url: string, data?: any, options?: UseApiOptions) => 
      fetchApi(url, 'POST', data, options),
    [fetchApi]
  );

  const put = useCallback(
    (url: string, data?: any, options?: UseApiOptions) => 
      fetchApi(url, 'PUT', data, options),
    [fetchApi]
  );

  const del = useCallback(
    (url: string, options?: UseApiOptions) => fetchApi(url, 'DELETE', undefined, options),
    [fetchApi]
  );

  const api = {
    // Autenticación
    auth: {
      requestOTP: (data: { email: string }) => post(apiEndpoints.auth.requestOTP, data),
      validateOTP: (data: { email: string; code: string }) => post(apiEndpoints.auth.validateOTP, data),
      logout: () => del(apiEndpoints.auth.logout),
    },

    // Usuario
    user: {
      create: (data: any) => post(apiEndpoints.user.create, data),
      get: () => get(apiEndpoints.user.get),
      update: (data: any) => put(apiEndpoints.user.update, data),
      delete: () => del(apiEndpoints.user.delete),
    },

    // Emociones
    emotions: {
      getAll: () => get(apiEndpoints.emotions.getAll),
      getById: (id: string) => get(apiEndpoints.emotions.getById(id)),
      create: (data: any) => post(apiEndpoints.emotions.create, data),
      update: (id: string, data: any) => put(apiEndpoints.emotions.update(id), data),
      delete: (id: string) => del(apiEndpoints.emotions.delete(id)),
    },

    // Archivos
    files: {
      upload: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return post(apiEndpoints.files.upload, formData, {
          headers: {}, // Permitir que el navegador establezca el Content-Type correcto
        });
      },
      getUrl: (key: string) => get(apiEndpoints.files.getUrl(key)),
    },
  };

  return {
    loading,
    api,
    get,
    post,
    put,
    delete: del,
  };
} 