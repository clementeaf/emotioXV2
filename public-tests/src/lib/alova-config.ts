/**
 * Configuración de AlovaJS para Public-Tests
 * Sistema paralelo al actual TanStack Query - NO REEMPLAZA aún
 */

import { createAlova } from 'alova';
import ReactHook from 'alova/react';
import { API_HTTP_ENDPOINT } from '../config/endpoints';

// Función para obtener token si está disponible (para futuras necesidades)
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || null;
  }
  return null;
};

// Configuración AlovaJS - Paralela al sistema actual
export const alovaInstance = createAlova({
  baseURL: API_HTTP_ENDPOINT,
  statesHook: ReactHook,
  timeout: 30000,
  
  // Headers por defecto
  beforeRequest(method) {
    method.config.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...method.config.headers
    };

    // Agregar token si está disponible (para endpoints que lo requieran)
    const token = getToken();
    if (token) {
      method.config.headers.Authorization = `Bearer ${token}`;
    }
  },

  // Manejo de respuestas
  responded: {
    onSuccess: async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onError: (error) => {
      console.error('[AlovaJS Public-Tests] Error de red:', error);
      throw error;
    }
  },

  // Cache por defecto
  localCache: {
    expire: 300000, // 5 minutos
    mode: 'memory'
  }
});

// Debug info para desarrollo
if (import.meta.env.DEV) {
  console.log('[AlovaJS Config] Configuración inicializada:', {
    baseURL: API_HTTP_ENDPOINT,
    isDevelopment: true
  });
}