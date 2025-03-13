import { createAlova } from 'alova';
import { Method } from 'alova';
import ReactHook from 'alova/react';
import API_CONFIG from '@/config/api.config';

// Tipos para las respuestas de la API
interface APIResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

// Interfaces para autenticación
export interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

// Adaptador personalizado para fetch
const customFetchAdapter = () => {
  return (config: any) => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchPromise = fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.data ? JSON.stringify(config.data) : undefined,
      signal,
    });

    return {
      response: () => fetchPromise.then(response => {
        if (!response.ok) {
          throw new Error('Error en la solicitud');
        }
        return response;
      }),
      headers: () => fetchPromise.then(response => response.headers),
      abort: () => controller.abort(),
      onDownload: undefined,
      onUpload: undefined,
    };
  };
};

// Crear instancia de Alova
const alovaInstance = createAlova({
  baseURL: API_CONFIG.baseURL,
  statesHook: ReactHook,
  requestAdapter: customFetchAdapter(),
  beforeRequest(method: Method) {
    // Configuración por defecto
    method.config.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...method.config.headers,
    };

    // Agregar token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      method.config.headers = {
        ...method.config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  },
  responded: {
    onSuccess: async (response: any) => {
      const data = await response.json();
      return data;
    },
    onError(error: Error) {
      throw error;
    },
  },
});

// Endpoints de autenticación
export const authAPI = {
  login: (data: LoginRequest) =>
    alovaInstance.Post<APIResponse<AuthResponse>>(
      API_CONFIG.endpoints.login.POST || '/auth/login',
      data
    ),
  logout: () =>
    alovaInstance.Post<APIResponse>(
      API_CONFIG.endpoints.logout.POST || '/auth/logout'
    ),
};

// Endpoints de usuarios
export const userAPI = {
  create: (data: { email: string; name: string }) =>
    alovaInstance.Post<APIResponse<User>>(
      API_CONFIG.endpoints.createUser.POST || '/users',
      data
    ),
  
  get: () => 
    alovaInstance.Get<APIResponse<User>>(
      API_CONFIG.endpoints.getUser.GET || '/users/me'
    ),
  
  update: (data: { name?: string }) =>
    alovaInstance.Put<APIResponse<User>>(
      API_CONFIG.endpoints.updateUser.PUT || '/users/me',
      data
    ),
  
  delete: () =>
    alovaInstance.Delete<APIResponse<{ message: string }>>(
      API_CONFIG.endpoints.deleteUser.DELETE || '/users/me'
    ),
};

export default alovaInstance; 