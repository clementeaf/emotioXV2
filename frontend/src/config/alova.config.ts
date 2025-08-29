/**
 * Configuración de AlovaJS para EmotioXV2
 * Reemplaza el sistema de fetch y React Query con AlovaJS
 */

import { createAlova } from 'alova';
import { ReactHook } from 'alova/client';
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
  
  // Request adapter usando fetch nativo
  requestAdapter: (elements, method) => {
    const { url, data, headers, params } = elements;
    
    // Construir URL con query params si existen
    let finalUrl = url;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params as Record<string, string>);
      finalUrl = `${url}?${searchParams.toString()}`;
    }
    
    // Configurar opciones de fetch
    const fetchOptions: RequestInit = {
      method: method.type,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
    };
    
    // Agregar body si existe
    if (data) {
      if (data instanceof FormData) {
        // Para FormData (uploads), remover Content-Type para que el browser lo configure
        delete (fetchOptions.headers as any)['Content-Type'];
        fetchOptions.body = data;
      } else {
        fetchOptions.body = JSON.stringify(data);
      }
    }
    
    // Realizar la petición
    return fetch(finalUrl, fetchOptions).then(async response => {
      // Manejar errores HTTP
      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: 'Error desconocido' };
        }
        
        // Lista de endpoints que pueden devolver 404 de forma normal
        const expectedNotFoundEndpoints = [
          '/cognitive-task',
          '/welcome-screen', 
          '/smart-voc',
          '/thank-you-screen'
        ];
        
        // Si es un 404 esperado, devolver null
        if (response.status === 404) {
          const isExpectedNotFound = expectedNotFoundEndpoints.some(endpoint =>
            response.url.includes(endpoint)
          );
          
          if (isExpectedNotFound) {
            return null;
          }
        }
        
        // Para otros errores, lanzar error con mensaje específico
        const errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      // Parsear respuesta exitosa
      try {
        const data = await response.json();
        
        // Adaptar respuesta del backend al formato esperado
        if (data && typeof data === 'object' && 'data' in data && 'status' in data) {
          return {
            success: data.status >= 200 && data.status < 300,
            data: data.data,
            message: data.message,
            error: data.error
          };
        }
        
        return data;
      } catch {
        // Si no es JSON, devolver respuesta como texto
        return response.text();
      }
    });
  },
  
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
    onSuccess: async (response, method) => {
      return response;
    },
    onError: async (error, method) => {
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
    // Invalidar toda la caché
    alovaInstance.snapshots.clear();
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