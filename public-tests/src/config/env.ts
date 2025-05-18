// @ts-expect-error - Ignorando temporalmente falta de tipos para endpoints.js
import endpoints from './endpoints.js'; // Importar los endpoints exportados
// import { z } from 'zod'; // No se usa

// Función auxiliar para obtener la URL base de la API
function getApiUrl(): string {
  // 1. Intentar desde el archivo endpoints.js exportado por el backend
  if (endpoints && endpoints.http) {
    console.log('Using API URL from endpoints.js:', endpoints.http);
    return endpoints.http;
  }

  // 2. Intentar desde variables de entorno (Vite)
  const envApiUrl = typeof window !== 'undefined'
    ? (window as unknown as { __NEXT_DATA__?: { props?: { env?: { VITE_API_URL?: string } } } }).__NEXT_DATA__?.props?.env?.VITE_API_URL
    : process.env.VITE_API_URL;

  if (envApiUrl) {
    console.log('Using API URL from environment variable (VITE_API_URL):', envApiUrl);
    return envApiUrl;
  }

  // 3. Usar valor hardcodeado como último recurso
  const fallbackUrl = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
  console.warn('API URL not found in endpoints.js or environment variables. Using fallback:', fallbackUrl);
  return fallbackUrl;
}

export const config = {
  apiUrl: getApiUrl(),
  // Puedes añadir otros endpoints si los necesitas, ej: endpoints.websocket
  websocketUrl: endpoints?.websocket || '' // Añadir URL de WebSocket si existe
}; 