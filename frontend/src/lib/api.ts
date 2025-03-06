import { createAlova, Method } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';
import API_CONFIG from '../config/api.config';

// Interfaces para las respuestas
export interface APIResponse<T = unknown> {
  data: T;
  message?: string;
  error?: string;
}

// Interfaces para autenticación
export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Crear una instancia de Alova
export const alovaInstance = createAlova({
  baseURL: API_CONFIG.baseURL,
  statesHook: ReactHook,
  requestAdapter: adapterFetch(),
  
  // Configuración global para todas las peticiones
  beforeRequest(config: Method) {
    config.config = {
      ...config.config,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        ...config.config.headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    };

    const token = localStorage.getItem('token');
    if (token) {
      config.config.headers.Authorization = `Bearer ${token}`;
    }
  },

  // Manejo global de respuestas
  responded: {
    onSuccess: async (response: Response) => {
      if (!response.ok) {
        let errorMessage = 'Error en la solicitud';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          // Si no podemos parsear el error, usamos el mensaje por defecto
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    
    onError: (error: Error) => {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.error('Error de conexión: Verifica que el servidor esté disponible');
        throw new Error('No se pudo conectar con el servidor. Por favor, intenta nuevamente.');
      } else {
        console.error('Error en la petición:', error);
        throw error;
      }
    }
  }
});

// Endpoints de autenticación usando las rutas generadas
export const authAPI = {
  requestOTP: (email: string) => 
    alovaInstance.Post<APIResponse<{ message: string }>>(API_CONFIG.endpoints.requestOTP.POST, { email }),
  
  validateOTP: (email: string, code: string) =>
    alovaInstance.Post<APIResponse<AuthResponse>>(API_CONFIG.endpoints.validateOTP.POST, { email, code }),
  
  logout: () =>
    alovaInstance.Post<APIResponse<{ message: string }>>(API_CONFIG.endpoints.logout.POST),
};

// Endpoints de usuarios usando las rutas generadas
export const userAPI = {
  create: (data: { email: string; name: string }) =>
    alovaInstance.Post<APIResponse<User>>(API_CONFIG.endpoints.createUser.POST, data),
  
  get: () => 
    alovaInstance.Get<APIResponse<User>>(API_CONFIG.endpoints.getUser.GET),
  
  update: (data: { name?: string }) =>
    alovaInstance.Put<APIResponse<User>>(API_CONFIG.endpoints.updateUser.PUT, data),
  
  delete: () =>
    alovaInstance.Delete<APIResponse<{ message: string }>>(API_CONFIG.endpoints.deleteUser.DELETE),
};

export default alovaInstance; 