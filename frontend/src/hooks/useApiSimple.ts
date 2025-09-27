/**
 * Hook API Simple migrado a Axios + TanStack Query
 * Versión simplificada que usa la nueva arquitectura
 */

import { useCallback, useState } from 'react';
import { apiClient } from '@/api/config/axios';
import { useAuth } from '@/providers/AuthProvider';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  [key: string]: unknown;
}

interface ResearchData {
  title: string;
  description?: string;
  status?: string;
  [key: string]: unknown;
}

interface ScreenData {
  title?: string;
  description?: string;
  content?: string;
  [key: string]: unknown;
}

interface ConfigData {
  [key: string]: unknown;
}

interface ParticipantData {
  email?: string;
  name?: string;
  [key: string]: unknown;
}

interface S3UploadData {
  file: File;
  key?: string;
  [key: string]: unknown;
}

/**
 * Hook simple para llamadas a la API usando Axios
 * Mantiene la misma interfaz que useApiSimple pero usa Axios internamente
 */
export function useApiSimple() {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const makeRequest = useCallback(
    async <T>(
      url: string,
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
      data?: any
    ): Promise<ApiResponse<T>> => {
      setLoading(true);

      try {
        let response;

        // Crear la petición Axios apropiada
        switch (method.toUpperCase()) {
          case 'GET':
            response = await apiClient.get<T>(url);
            break;
          case 'POST':
            response = await apiClient.post<T>(url, data);
            break;
          case 'PUT':
            response = await apiClient.put<T>(url, data);
            break;
          case 'DELETE':
            response = await apiClient.delete<T>(url);
            break;
          default:
            throw new Error(`Método HTTP no soportado: ${method}`);
        }

        return { data: response.data, error: null, loading: false };
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
        return {
          data: null,
          error: errorMessage,
          loading: false,
        };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Métodos HTTP simplificados
  const api = {
    // Métodos básicos
    get: <T>(url: string) => makeRequest<T>(url, 'GET'),
    post: <T>(url: string, data?: unknown) => makeRequest<T>(url, 'POST', data),
    put: <T>(url: string, data?: unknown) => makeRequest<T>(url, 'PUT', data),
    delete: <T>(url: string) => makeRequest<T>(url, 'DELETE'),

    // Endpoints específicos - Mantenemos para compatibilidad pero recomendamos usar dominios
    auth: {
      login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
      register: (data: RegisterData) =>
        api.post('/auth/register', data),
      logout: () =>
        api.post('/auth/logout', {}),
      getProfile: () =>
        api.get('/auth/profile'),
    },

    research: {
      getAll: () => api.get('/research'),
      getById: (id: string) => api.get(`/research/${id}`),
      create: (data: ResearchData) => api.post('/research', data),
      update: (id: string, data: Partial<ResearchData>) => api.put(`/research/${id}`, data),
      delete: (id: string) => api.delete(`/research/${id}`),
      updateStatus: (id: string, status: string) =>
        api.put(`/research/${id}/status`, { status }),
      updateStage: (id: string, stage: string) =>
        api.put(`/research/${id}/stage`, { stage }),
    },

    welcomeScreen: {
      getByResearch: (researchId: string) =>
        api.get(`/research/${researchId}/welcome-screen`),
      create: (researchId: string, data: ScreenData) =>
        api.post(`/research/${researchId}/welcome-screen`, data),
      update: (researchId: string, screenId: string, data: Partial<ScreenData>) =>
        api.put(`/research/${researchId}/welcome-screen/${screenId}`, data),
      delete: (researchId: string, screenId: string) =>
        api.delete(`/research/${researchId}/welcome-screen/${screenId}`),
    },

    thankYouScreen: {
      getByResearch: (researchId: string) =>
        api.get(`/research/${researchId}/thank-you-screen`),
      create: (researchId: string, data: ScreenData) =>
        api.post(`/research/${researchId}/thank-you-screen`, data),
      update: (researchId: string, screenId: string, data: Partial<ScreenData>) =>
        api.put(`/research/${researchId}/thank-you-screen/${screenId}`, data),
      delete: (researchId: string, screenId: string) =>
        api.delete(`/research/${researchId}/thank-you-screen/${screenId}`),
    },

    smartVoc: {
      getByResearch: (researchId: string) =>
        api.get(`/research/${researchId}/smart-voc`),
      create: (researchId: string, data: ConfigData) =>
        api.post(`/research/${researchId}/smart-voc`, data),
      update: (researchId: string, data: Partial<ConfigData>) =>
        api.put(`/research/${researchId}/smart-voc`, data),
      delete: (researchId: string) =>
        api.delete(`/research/${researchId}/smart-voc`),
    },

    eyeTracking: {
      getByResearch: (researchId: string) =>
        api.get(`/research/${researchId}/eye-tracking`),
      create: (researchId: string, data: ConfigData) =>
        api.post(`/research/${researchId}/eye-tracking`, data),
      update: (researchId: string, data: Partial<ConfigData>) =>
        api.put(`/research/${researchId}/eye-tracking`, data),
      delete: (researchId: string) =>
        api.delete(`/research/${researchId}/eye-tracking`),
    },

    eyeTrackingRecruit: {
      getConfigByResearch: (researchId: string) =>
        api.get(`/eye-tracking-recruit/research/${researchId}/config`),
      createConfig: (researchId: string, data: ConfigData) =>
        api.post(`/eye-tracking-recruit/research/${researchId}/config`, data),
      updateConfig: (researchId: string, data: Partial<ConfigData>) =>
        api.put(`/eye-tracking-recruit/research/${researchId}/config`, data),
      createParticipant: (configId: string, data: ParticipantData) =>
        api.post(`/eye-tracking-recruit/config/${configId}/participant`, data),
      updateParticipantStatus: (participantId: string, status: string) =>
        api.put(`/eye-tracking-recruit/participant/${participantId}/status`, { status }),
      getParticipants: (configId: string) =>
        api.get(`/eye-tracking-recruit/config/${configId}/participants`),
      getStats: (configId: string) =>
        api.get(`/eye-tracking-recruit/config/${configId}/stats`),
      generateLink: (configId: string) =>
        api.post(`/eye-tracking-recruit/config/${configId}/link`, {}),
      getActiveLinks: (configId: string) =>
        api.get(`/eye-tracking-recruit/config/${configId}/links`),
      deactivateLink: (token: string) =>
        api.put(`/eye-tracking-recruit/link/${token}/deactivate`, {}),
      validateLink: (token: string) =>
        api.get(`/eye-tracking-recruit/link/${token}/validate`),
      getResearchSummary: (researchId: string) =>
        api.get(`/eye-tracking-recruit/research/${researchId}/summary`),
      registerPublicParticipant: (data: ParticipantData) =>
        api.post('/eye-tracking-recruit/public/participant/start', data),
      updatePublicParticipantStatus: (participantId: string, status: string) =>
        api.put(`/eye-tracking-recruit/public/participant/${participantId}/status`, { status }),
    },

    cognitiveTask: {
      getByResearch: (researchId: string) =>
        api.get(`/research/${researchId}/cognitive-task`),
      create: (researchId: string, data: ConfigData) =>
        api.post(`/research/${researchId}/cognitive-task`, data),
      update: (researchId: string, data: Partial<ConfigData>) =>
        api.put(`/research/${researchId}/cognitive-task`, data),
      delete: (researchId: string) =>
        api.delete(`/research/${researchId}/cognitive-task`),
    },

    s3: {
      upload: (data: S3UploadData) => {
        if (data.file instanceof File) {
          const formData = new FormData();
          formData.append('file', data.file);
          if (data.key) {
            formData.append('key', data.key as string);
          }
          return api.post('/s3/upload', formData);
        }
        return api.post('/s3/upload', data);
      },
      download: (key: string) => api.get(`/s3/download?key=${encodeURIComponent(key)}`),
      deleteObject: (key: string) => api.delete(`/s3/delete-object?key=${key}`),
    },
  };

  // Utilidades simplificadas - Sin caché de Alova
  const utils = {
    // Sin caché específico - TanStack Query maneja esto automáticamente
    invalidateCache: (pattern?: string | RegExp) => {
      console.warn('Cache invalidation not implemented - use TanStack Query directly');
    },

    getCachedData: <T>(url: string): T | null => {
      console.warn('Cache access not implemented - use TanStack Query directly');
      return null;
    },

    prefetch: async <T>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) => {
      try {
        await makeRequest<T>(url, method, data);
      } catch (error) {
        console.warn('Error prefetching data:', error);
      }
    }
  };

  return {
    loading,
    api,
    utils,
  };
}

export default useApiSimple;