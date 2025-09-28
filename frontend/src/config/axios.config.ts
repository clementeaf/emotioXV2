/**
 * Configuración de Axios para EmotioXV2
 * Cliente HTTP principal con TanStack Query
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
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

// Crear instancia de Axios
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request para agregar token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Sin timeout para research y companies
    if (config.url?.includes('/research') || config.url?.includes('/companies')) {
      config.timeout = 0;
    }

    console.log('📡 Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('📡 Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor de response para manejar errores globales
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ Response Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);

    // Manejar error de autenticación (401)
    if (error.response?.status === 401) {
      // Token expirado o inválido
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirigir al login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Función para actualizar el token
export const updateAxiosToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token);
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

export default axiosInstance;