/**
 * Hook useApi migrado a Axios + TanStack Query
 * Mantiene la misma interfaz pero usa Axios internamente
 */

import { useCallback, useState } from 'react';
import { apiClient } from '@/api/config/axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '@/providers/AuthProvider';

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

  // Helper para construir URLs con parámetros
  const buildUrl = useCallback((url: string, params: Record<string, string> = {}) => {
    let finalUrl = url;
    Object.entries(params).forEach(([key, value]) => {
      finalUrl = finalUrl.replace(`{${key}}`, value);
    });
    return finalUrl;
  }, []);

  const fetchApi = useCallback(
    async (
      url: string,
      method: string = 'GET',
      body?: any,
      options: UseApiOptions = {}
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
            response = await apiClient.post<T>(url, body);
            break;
          case 'PUT':
            response = await apiClient.put<T>(url, body);
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

  // API endpoints organizados (mantiene compatibilidad con useApi original)
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
      getById: (id: string) => get(buildUrl(API_ENDPOINTS.research.getById, { id })),
      getAll: () => get(API_ENDPOINTS.research.getAll),
      update: (id: string, data: any) => put(buildUrl(API_ENDPOINTS.research.update, { id }), data),
      delete: (id: string) => del(buildUrl(API_ENDPOINTS.research.delete, { id })),
      updateStatus: (id: string, status: string) => 
        put(buildUrl(API_ENDPOINTS.research.updateStatus, { id }), { status }),
      updateStage: (id: string, stage: string) => 
        put(buildUrl(API_ENDPOINTS.research.updateStage, { id }), { stage }),
    },

    // Welcome Screens
    'welcome-screen': {
      getByResearchId: (researchId: string) => 
        get(buildUrl(API_ENDPOINTS['welcome-screen'].getByResearch, { researchId })),
      save: (researchId: string, data: any) => 
        post(buildUrl(API_ENDPOINTS['welcome-screen'].save, { researchId }), data),
      delete: (researchId: string) => 
        del(buildUrl(API_ENDPOINTS['welcome-screen'].delete, { researchId })),
    },

    // Thank You Screens
    'thank-you-screen': {
      getByResearchId: (researchId: string) => 
        get(buildUrl(API_ENDPOINTS.thankYouScreen.getByResearch, { researchId })),
      save: (researchId: string, data: any) => 
        post(buildUrl(API_ENDPOINTS.thankYouScreen.save, { researchId }), data),
      delete: (researchId: string) => 
        del(buildUrl(API_ENDPOINTS.thankYouScreen.delete, { researchId })),
    },

    // SmartVOC
    smartVoc: {
      getByResearch: (researchId: string) => 
        get(buildUrl(API_ENDPOINTS.smartVoc.getByResearch, { researchId })),
      create: (researchId: string, data: any) => 
        post(buildUrl(API_ENDPOINTS.smartVoc.create, { researchId }), data),
      update: (researchId: string, data: any) => 
        put(buildUrl(API_ENDPOINTS.smartVoc.update, { researchId }), data),
      delete: (researchId: string) => 
        del(buildUrl(API_ENDPOINTS.smartVoc.delete, { researchId })),
    },

    // Eye Tracking
    eyeTracking: {
      getByResearch: (researchId: string) => 
        get(buildUrl(API_ENDPOINTS.eyeTracking.getByResearch, { researchId })),
      create: (researchId: string, data: any) => 
        post(buildUrl(API_ENDPOINTS.eyeTracking.create, { researchId }), data),
      update: (researchId: string, data: any) => 
        put(buildUrl(API_ENDPOINTS.eyeTracking.update, { researchId }), data),
      delete: (researchId: string) => 
        del(buildUrl(API_ENDPOINTS.eyeTracking.delete, { researchId })),
    },

    // Cognitive Task
    cognitiveTask: {
      getByResearch: (researchId: string) => 
        get(buildUrl(API_ENDPOINTS.cognitiveTask.getByResearch, { researchId })),
      create: (researchId: string, data: any) => 
        post(buildUrl(API_ENDPOINTS.cognitiveTask.create, { researchId }), data),
      update: (researchId: string, data: any) => 
        put(buildUrl(API_ENDPOINTS.cognitiveTask.update, { researchId }), data),
      delete: (researchId: string) => 
        del(buildUrl(API_ENDPOINTS.cognitiveTask.delete, { researchId })),
    },

    // Participantes
    participants: {
      getAll: () => get(API_ENDPOINTS.participants.getAll),
      getById: (id: string) => get(buildUrl(API_ENDPOINTS.participants.getById, { id })),
      login: (data: { name: string; email: string; researchId: string }) => 
        post(API_ENDPOINTS.participants.login, data),
      create: (data: any) => post(API_ENDPOINTS.participants.create, data),
      delete: (id: string) => del(buildUrl(API_ENDPOINTS.participants.delete, { id })),
    },

    // Module Responses
    moduleResponses: {
      getResponsesByResearch: (researchId: string) => 
        get(buildUrl(API_ENDPOINTS.moduleResponses.getResponsesByResearch, { researchId })),
      getResponsesForParticipant: (researchId: string, participantId: string) => 
        get(buildUrl(API_ENDPOINTS.moduleResponses.getResponsesForParticipant, { researchId, participantId })),
      saveResponse: (data: any) => post(API_ENDPOINTS.moduleResponses.saveResponse, data),
      updateResponse: (responseId: string, data: any) => 
        put(buildUrl(API_ENDPOINTS.moduleResponses.updateResponse, { responseId }), data),
    },

    // Archivos S3
    files: {
      upload: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return post(API_ENDPOINTS.s3.upload, formData, {
          headers: {}, // Permitir que Alova establezca el Content-Type correcto para FormData
        });
      },
      getUrl: (key: string) => get(`${API_ENDPOINTS.s3.download}?key=${key}`),
      delete: (key: string) => del(buildUrl(API_ENDPOINTS.s3.deleteObject, { key })),
    },
  };

  return {
    loading,
    api,
    get,
    post,
    put,
    delete: del,
    // Cache invalidation - Sin caché específico, TanStack Query maneja esto automáticamente
    invalidateCache: (pattern?: string | RegExp) => {
      console.warn('Cache invalidation not implemented - use TanStack Query directly');
    }
  };
}

export default useApi;