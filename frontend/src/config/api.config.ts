import endpoints from './endpoints.json';
import { shouldUseSimulatedMode, isDevelopmentMode } from '../lib/utils';

// Tipos para los endpoints
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';
type Endpoint = { [K in HttpMethod]?: string };

interface ResearchEndpoints {
  CREATE: string;
  GET: string;
  LIST: string;
  UPDATE: string;
  DELETE: string;
  UPDATE_STATUS: string;
  UPDATE_STAGE: string;
}

interface Endpoints {
  requestOTP: Endpoint;
  validateOTP: Endpoint;
  login: Endpoint;
  register: Endpoint;
  logout: Endpoint;
  createUser: Endpoint;
  getUser: Endpoint;
  updateUser: Endpoint;
  deleteUser: Endpoint;
  optionsHandler: Endpoint;
  websocket: { URL: string };
  research: ResearchEndpoints;
}

// Función para detectar si debemos usar proxies locales o endpoints reales
const detectApiMode = () => {
  // Verificar si estamos en modo simulado
  const useSimulatedMode = shouldUseSimulatedMode();
  
  // Si estamos en modo simulado, siempre usamos proxies locales
  if (useSimulatedMode) {
    return {
      useProxies: true,
      message: 'Usando datos simulados (modo simulado activado)'
    };
  }
  
  // Si estamos en desarrollo Y no hay una API_URL específica, usamos proxies locales
  const isDev = isDevelopmentMode();
  const hasApiUrl = !!process.env.NEXT_PUBLIC_API_URL;
  
  // Si hay URL de API específica, siempre la usamos sin importar el entorno
  if (hasApiUrl) {
    return {
      useProxies: false,
      message: 'Usando API real desde variable de entorno'
    };
  }
  
  // En desarrollo sin API_URL, usamos proxies
  if (isDev && !hasApiUrl) {
    return {
      useProxies: true,
      message: 'Usando proxies locales (desarrollo sin API_URL)'
    };
  }
  
  // En cualquier otro caso, intentamos usar endpoints reales
  return {
    useProxies: false,
    message: 'Usando endpoints reales'
  };
};

const apiMode = detectApiMode();

// Configuración de la API
const API_CONFIG = {
  // En desarrollo usamos localhost, en producción la URL real
  // Si hay una URL específica en las variables de entorno, la usamos
  baseURL: 'http://localhost:4700/api' 
           (isDevelopmentMode() ? 'http://localhost:4700/api' : 'https://api.emotio-x.com'),
  
  // Endpoints: usamos proxies locales o endpoints reales según el modo
  endpoints: apiMode.useProxies 
    ? {
        ...endpoints,
        research: {
          CREATE: '/api/proxy/research',
          GET: '/api/proxy/research/{id}',
          LIST: '/api/proxy/research',
          UPDATE: '/api/proxy/research/{id}',
          DELETE: '/api/proxy/research/{id}',
          UPDATE_STATUS: '/api/proxy/research/{id}/status',
          UPDATE_STAGE: '/api/proxy/research/{id}/stage'
        }
      } as Endpoints
    : endpoints as Endpoints,
  
  // Información sobre el modo de desarrollo
  devMode: isDevelopmentMode() ? {
    enabled: true,
    message: apiMode.message,
    useSimulatedData: shouldUseSimulatedMode()
  } : undefined
};

export default API_CONFIG;
export type APIConfig = typeof API_CONFIG; 
