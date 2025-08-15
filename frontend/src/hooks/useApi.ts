import { useCallback, useState } from 'react';

import { API_ENDPOINTS } from '../config/api';

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

        // // console.log('Fetching URL:', url, 'with options:', fetchOptions);

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
      login: (data: { email: string; password: string }) => post(API_ENDPOINTS.auth.login, data),
      register: (data: any) => post(API_ENDPOINTS.auth.register, data),
      logout: () => post(API_ENDPOINTS.auth.logout, {}),
    },

    // Investigaciones
    research: {
      create: (data: any) => post(API_ENDPOINTS.research.create, data),
      getById: (id: string) => get(API_ENDPOINTS.research.getById.replace('{id}', id)),
      getAll: () => get(API_ENDPOINTS.research.getAll),
      update: (id: string, data: any) => put(API_ENDPOINTS.research.update.replace('{id}', id), data),
      delete: (id: string) => del(API_ENDPOINTS.research.delete.replace('{id}', id)),
      updateStatus: (id: string, status: string) => put(API_ENDPOINTS.research.updateStatus.replace('{id}', id), { status }),
      updateStage: (id: string, stage: string) => put(API_ENDPOINTS.research.updateStage.replace('{id}', id), { stage }),
    },

    // Welcome Screens
    'welcome-screen': {
      getByResearchId: (researchId: string) => get(API_ENDPOINTS['welcome-screen'].getByResearch.replace('{researchId}', researchId)),
      save: (researchId: string, data: any) => post(API_ENDPOINTS['welcome-screen'].save.replace('{researchId}', researchId), data),
      delete: (researchId: string) => del(API_ENDPOINTS['welcome-screen'].delete.replace('{researchId}', researchId)),
    },

    // Archivos
    files: {
      upload: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        // Implementar cuando tengamos un endpoint para subir archivos
        return post(`${API_ENDPOINTS.s3.upload}`, formData, {
          headers: {}, // Permitir que el navegador establezca el Content-Type correcto
        });
      },
      getUrl: (key: string) => get(`${API_ENDPOINTS.s3.download}?key=${key}`),
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
