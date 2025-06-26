/**
 * Hook API Simple para EmotioXV2
 * Versión simplificada que evita problemas de tipos TypeScript
 */

import { useCallback, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { useAuth } from './useAuth';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Hook simple para llamadas a la API
 * Usa fetch directamente para evitar problemas de tipos
 */
export function useApiSimple() {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const makeRequest = useCallback(
    async <T>(
      url: string,
      options: RequestInit = {}
    ): Promise<ApiResponse<T>> => {
      setLoading(true);

      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        };

        const response = await fetch(`${API_BASE_URL}${url}`, {
          ...options,
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { data, error: null, loading: false };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
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
    // GET
    get: <T>(url: string) => makeRequest<T>(url, { method: 'GET' }),

    // POST
    post: <T>(url: string, data?: any) =>
      makeRequest<T>(url, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined
      }),

    // PUT
    put: <T>(url: string, data?: any) =>
      makeRequest<T>(url, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined
      }),

    // DELETE
    delete: <T>(url: string) => makeRequest<T>(url, { method: 'DELETE' }),

    // Endpoints específicos
    auth: {
      login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),

      register: (data: any) =>
        api.post('/auth/register', data),

      logout: () =>
        api.post('/auth/logout', {}),

      getProfile: () =>
        api.get('/auth/profile'),
    },

    research: {
      getAll: () => api.get('/research'),
      getById: (id: string) => api.get(`/research/${id}`),
      create: (data: any) => api.post('/research', data),
      update: (id: string, data: any) => api.put(`/research/${id}`, data),
      delete: (id: string) => api.delete(`/research/${id}`),
      updateStatus: (id: string, status: string) =>
        api.put(`/research/${id}/status`, { status }),
      updateStage: (id: string, stage: string) =>
        api.put(`/research/${id}/stage`, { stage }),
    },

    welcomeScreen: {
      getByResearch: (researchId: string) =>
        api.get(`/research/${researchId}/welcome-screen`),
      create: (researchId: string, data: any) =>
        api.post(`/research/${researchId}/welcome-screen`, data),
      update: (researchId: string, screenId: string, data: any) =>
        api.put(`/research/${researchId}/welcome-screen/${screenId}`, data),
      delete: (researchId: string, screenId: string) =>
        api.delete(`/research/${researchId}/welcome-screen/${screenId}`),
    },

    thankYouScreen: {
      getByResearch: (researchId: string) =>
        api.get(`/research/${researchId}/thank-you-screen`),
      create: (researchId: string, data: any) =>
        api.post(`/research/${researchId}/thank-you-screen`, data),
      update: (researchId: string, screenId: string, data: any) =>
        api.put(`/research/${researchId}/thank-you-screen/${screenId}`, data),
      delete: (researchId: string, screenId: string) =>
        api.delete(`/research/${researchId}/thank-you-screen/${screenId}`),
    },

    smartVoc: {
      getByResearch: (researchId: string) =>
        api.get(`/research/${researchId}/smart-voc`),
      create: (researchId: string, data: any) =>
        api.post(`/research/${researchId}/smart-voc`, data),
      update: (researchId: string, data: any) =>
        api.put(`/research/${researchId}/smart-voc`, data),
      delete: (researchId: string) =>
        api.delete(`/research/${researchId}/smart-voc`),
    },

    eyeTracking: {
      getByResearch: (researchId: string) =>
        api.get(`/research/${researchId}/eye-tracking`),
      create: (researchId: string, data: any) =>
        api.post(`/research/${researchId}/eye-tracking`, data),
      update: (researchId: string, data: any) =>
        api.put(`/research/${researchId}/eye-tracking`, data),
      delete: (researchId: string) =>
        api.delete(`/research/${researchId}/eye-tracking`),
    },

    eyeTrackingRecruit: {
      getConfigByResearch: (researchId: string) =>
        api.get(`/eye-tracking-recruit/research/${researchId}/config`),
      createConfig: (researchId: string, data: any) =>
        api.post(`/eye-tracking-recruit/research/${researchId}/config`, data),
      updateConfig: (researchId: string, data: any) =>
        api.put(`/eye-tracking-recruit/research/${researchId}/config`, data),
      createParticipant: (configId: string, data: any) =>
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
      registerPublicParticipant: (data: any) =>
        api.post('/eye-tracking-recruit/public/participant/start', data),
      updatePublicParticipantStatus: (participantId: string, status: string) =>
        api.put(`/eye-tracking-recruit/public/participant/${participantId}/status`, { status }),
    },

    cognitiveTask: {
      getByResearch: (researchId: string) =>
        api.get(`/research/${researchId}/cognitive-task`),
      create: (researchId: string, data: any) =>
        api.post(`/research/${researchId}/cognitive-task`, data),
      update: (researchId: string, data: any) =>
        api.put(`/research/${researchId}/cognitive-task`, data),
      delete: (researchId: string) =>
        api.delete(`/research/${researchId}/cognitive-task`),
    },

    s3: {
      upload: (data: any) => api.post('/s3/upload', data),
      download: (key: string) => api.get(`/s3/download?key=${encodeURIComponent(key)}`),
      deleteObject: (key: string) => api.delete(`/s3/delete-object?key=${key}`),
    },
  };

  return {
    loading,
    api,
  };
}

export default useApiSimple;
