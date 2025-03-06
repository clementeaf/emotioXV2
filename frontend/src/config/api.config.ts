import endpoints from './endpoints.json';

// Tipos para los endpoints
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';
type Endpoint = { [K in HttpMethod]?: string };
type Endpoints = { [key: string]: Endpoint };

// En desarrollo, usa localhost si está disponible
const isDev = process.env.NODE_ENV === 'development';
const localApiUrl = 'http://localhost:4000';

// Si estamos en desarrollo, reemplaza la URL base en los endpoints
const processedEndpoints = isDev
  ? Object.entries(endpoints as Endpoints).reduce<Endpoints>((acc, [key, value]) => {
      const method = Object.keys(value)[0] as HttpMethod;
      const path = value[method]!.split('/').slice(3).join('/');
      acc[key] = { [method]: `/${path}` };
      return acc;
    }, {})
  : endpoints;

export const API_CONFIG = {
  baseURL: isDev ? localApiUrl : (endpoints as Endpoints).requestOTP.POST!.split('/auth')[0],
  endpoints: processedEndpoints
};

export default API_CONFIG; 