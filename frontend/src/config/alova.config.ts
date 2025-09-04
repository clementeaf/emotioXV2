/**
 * Configuración de AlovaJS para EmotioXV2
 * Reemplaza el sistema de fetch y React Query con AlovaJS
 */

import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';
import { DYNAMIC_API_ENDPOINTS, isEndpointsSynced } from '../api/dynamic-endpoints';

// URLs base - Priorizar endpoints dinámicos
const API_BASE_URL = isEndpointsSynced()
  ? DYNAMIC_API_ENDPOINTS.http
  : (process.env.NEXT_PUBLIC_API_URL || DYNAMIC_API_ENDPOINTS.http);

// Validación de seguridad
if (typeof window !== 'undefined' && (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1'))) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!isDevelopment) {
    throw new Error('Configuración de API inválida: No se permite localhost en producción');
  }
}

// Función para obtener el token de autenticación
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Crear instancia global de Alova
export const alovaInstance = createAlova({
  baseURL: API_BASE_URL,
  
  // Configurar para React
  statesHook: ReactHook,
  
  // Usar el adaptador nativo de Alova para fetch
  requestAdapter: adapterFetch(),
  
  // Interceptor de request para agregar token
  beforeRequest: (method) => {
    const token = getAuthToken();
    if (token) {
      method.config.headers = {
        ...method.config.headers,
        Authorization: `Bearer ${token}`
      };
    }
  },
  
  // Interceptor de response para manejar errores globales
  responded: {
    onSuccess: async (response) => {
      // Parse the response as JSON
      return await response.json();
    },
    onError: async (error) => {
      // Manejar error de autenticación (401)
      if (error.message?.includes('401') || error.message?.toLowerCase().includes('unauthorized')) {
        // Token expirado o inválido
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Redirigir al login
          window.location.href = '/login';
        }
      }
      
      // Re-lanzar el error para que sea manejado por el componente
      throw error;
    }
  },
  
  // Configuración de caché
  cacheFor: {
    // GET requests se cachean por 5 minutos por defecto
    GET: 1000 * 60 * 5,
    // POST, PUT, DELETE no se cachean
    POST: 0,
    PUT: 0,
    DELETE: 0,
  },
  
  // Configuración de timeout
  timeout: 30000, // 30 segundos
});

// Función helper para invalidar caché
export const invalidateCache = (matcher?: string | RegExp) => {
  if (matcher) {
    alovaInstance.snapshots.match(matcher).forEach(method => {
      method.abort();
    });
  } else {
    // Invalidar toda la caché - match all and abort
    alovaInstance.snapshots.match(/.*/g).forEach(method => {
      method.abort();
    });
  }
};

// Función para actualizar el token en Alova
export const updateAlovaToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Exportar tipos útiles
export type AlovaMethod<T = any> = ReturnType<typeof alovaInstance.Get<T>>;
export type AlovaResponse<T = any> = T;

export default alovaInstance;