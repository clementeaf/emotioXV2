import endpoints from './endpoints.json';

// Tipos para los endpoints
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';
type Endpoint = { [K in HttpMethod]?: string };
type Endpoints = { [key: string]: Endpoint };

// URL base de la API
const API_BASE_URL = 'https://fww0ghfvga.execute-api.us-east-1.amazonaws.com';
const WS_BASE_URL = 'wss://99ci9zzrei.execute-api.us-east-1.amazonaws.com/dev';

// En desarrollo, usa localhost si está disponible
const isDev = process.env.NODE_ENV === 'development';
const localApiUrl = 'http://localhost:4000';
const localWsUrl = 'ws://localhost:4000';

// Asegurarse de que los endpoints siempre tengan una URL válida
const ensureValidEndpoints = (endpoints: Endpoints): Endpoints => {
  return Object.entries(endpoints).reduce<Endpoints>((acc, [key, value]) => {
    const processedValue = Object.entries(value).reduce<Endpoint>((methodAcc, [method, url]) => {
      if (isDev) {
        // En desarrollo, usa las rutas relativas
        const path = url.split('/').slice(3).join('/');
        methodAcc[method as HttpMethod] = `/${path}`;
      } else {
        // En producción, asegúrate de que la URL sea absoluta
        methodAcc[method as HttpMethod] = url.startsWith('http')
          ? url
          : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
      }
      return methodAcc;
    }, {});

    acc[key] = processedValue;
    return acc;
  }, {});
};

export const API_CONFIG = {
  baseURL: isDev ? localApiUrl : API_BASE_URL,
  wsURL: isDev ? localWsUrl : WS_BASE_URL,
  endpoints: ensureValidEndpoints(endpoints as Endpoints),
} as const;

export type APIConfig = typeof API_CONFIG;
export default API_CONFIG; 