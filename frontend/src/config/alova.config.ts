/**
 * TEMPORARY: Legacy Alova configuration for Cognitive Task
 * Will be removed after Cognitive Task migration to domain architecture
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
    // Verificar primero localStorage, luego sessionStorage
    return localStorage.getItem('token') || sessionStorage.getItem('token');
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

    if (method.url?.includes('/research') || method.url?.includes('/companies')) {
      method.config.timeout = 0;
    }
  },

  // Interceptor de response para manejar errores globales
  responded: {
    onSuccess: async (response) => {
      // Para respuestas 204 No Content (típico en DELETE), no hay JSON
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null; // Retornar null en lugar de intentar parsear JSON vacío
      }

      // Verificar si hay contenido antes de parsear JSON
      const text = await response.text();
      if (!text) {
        return null;
      }

      try {
        return JSON.parse(text);
      } catch (error) {
        // Si no es JSON válido, retornar el texto plano
        return text;
      }
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
    GET: 1000 * 60 * 5,
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
    // Buscar y abortar los métodos que coincidan para forzar refetch
    const methods = alovaInstance.snapshots.match(matcher);
    methods.forEach(method => {
      // Abortar y limpiar el snapshot
      method.abort();
    });
  } else {
    // Abortar todos los métodos para forzar refetch
    const allMethods = alovaInstance.snapshots.match(/.*/);
    allMethods.forEach(method => {
      method.abort();
    });
  }
};

export default alovaInstance;