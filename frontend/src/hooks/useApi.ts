import { useState, useCallback } from 'react';
import API_CONFIG from '@/config/api.config';
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
    // Estas operaciones opcionales solo estarán disponibles si se definen en la configuración
    
    // Autenticación
    auth: {
      login: (data: { email: string; password: string }) => post(API_CONFIG.endpoints.auth.LOGIN, data),
      register: (data: any) => post(API_CONFIG.endpoints.auth.REGISTER, data),
      logout: () => post(API_CONFIG.endpoints.auth.LOGOUT, {}),
      
      // Mantener compatibilidad con las operaciones opcionales anteriores
      ...(API_CONFIG.endpoints.requestOTP ? {
        requestOTP: (data: { email: string }) => post(API_CONFIG.endpoints.requestOTP?.POST as string, data),
        validateOTP: (data: { email: string; code: string }) => post(API_CONFIG.endpoints.validateOTP?.POST as string, data),
      } : {})
    },

    // Usuario
    user: API_CONFIG.endpoints.createUser ? {
      create: (data: any) => post(API_CONFIG.endpoints.createUser?.POST as string, data),
      get: () => get(API_CONFIG.endpoints.getUser?.GET as string),
      update: (data: any) => put(API_CONFIG.endpoints.updateUser?.PUT as string, data),
      delete: () => del(API_CONFIG.endpoints.deleteUser?.DELETE as string),
    } : undefined,

    // Investigaciones - Siempre disponible ya que es requerido en el tipo Endpoints
    research: {
      create: (data: any) => post(API_CONFIG.endpoints.research.CREATE, data),
      getById: (id: string) => get(API_CONFIG.endpoints.research.GET.replace('{id}', id)),
      getAll: () => get(API_CONFIG.endpoints.research.LIST),
      update: (id: string, data: any) => put(API_CONFIG.endpoints.research.UPDATE.replace('{id}', id), data),
      delete: (id: string) => del(API_CONFIG.endpoints.research.DELETE.replace('{id}', id)),
      updateStatus: (id: string, status: string) => put(API_CONFIG.endpoints.research.UPDATE_STATUS.replace('{id}', id), { status }),
      updateStage: (id: string, stage: string) => put(API_CONFIG.endpoints.research.UPDATE_STAGE.replace('{id}', id), { stage }),
    },

    // Welcome Screens - Siempre disponible ya que es requerido en el tipo Endpoints
    welcomeScreen: {
      create: (data: any) => post(API_CONFIG.endpoints.welcomeScreen.CREATE, data),
      getById: (id: string) => get(API_CONFIG.endpoints.welcomeScreen.GET.replace('{id}', id)),
      getByResearchId: (researchId: string) => get(API_CONFIG.endpoints.welcomeScreen.GET_BY_RESEARCH.replace('{researchId}', researchId)),
      update: (id: string, data: any) => put(API_CONFIG.endpoints.welcomeScreen.UPDATE.replace('{id}', id), data),
      delete: (id: string) => del(API_CONFIG.endpoints.welcomeScreen.DELETE.replace('{id}', id)),
    },

    // Archivos
    files: {
      upload: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        // Implementar cuando tengamos un endpoint para subir archivos
        return post('/api/files/upload', formData, {
          headers: {}, // Permitir que el navegador establezca el Content-Type correcto
        });
      },
      getUrl: (key: string) => get(`/api/files/${key}`),
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