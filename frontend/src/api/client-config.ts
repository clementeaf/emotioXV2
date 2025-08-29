// 🎯 CONFIGURACIÓN SEGURA PARA EL CLIENTE
// Este archivo maneja las variables de entorno de forma segura en Next.js

// 🔧 VARIABLES DE ENTORNO HARDCODEADAS PARA DESARROLLO
// Estos valores son establecidos por el script de build/deploy
const NEXT_PUBLIC_API_URL = 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev';
const NEXT_PUBLIC_WS_URL = 'wss://b59weq4qqh.execute-api.us-east-1.amazonaws.com/dev';
const NEXT_PUBLIC_PUBLIC_TESTS_URL = 'http://localhost:5173';
const NEXT_PUBLIC_ENV = 'development';

// 🎯 DETECTAR ENTORNO DE DESARROLLO
const isDevelopment = NEXT_PUBLIC_ENV === 'development' || 
                     (typeof window !== 'undefined' && window.location.hostname === 'localhost');

// 🎯 CONFIGURACIÓN DE ENDPOINTS
export const CLIENT_CONFIG = {
  // API HTTP
  apiUrl: NEXT_PUBLIC_API_URL || 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev',
  
  // WebSocket
  wsUrl: NEXT_PUBLIC_WS_URL || 'wss://b59weq4qqh.execute-api.us-east-1.amazonaws.com/dev',
  
  // Public Tests
  publicTestsUrl: isDevelopment ? 'http://localhost:5173' : (NEXT_PUBLIC_PUBLIC_TESTS_URL || 'https://public-tests.emotioxv2.com'),
  
  // Environment flags
  isDevelopment,
  
  // Debug info
  envVars: {
    NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_PUBLIC_TESTS_URL,
    NEXT_PUBLIC_ENV
  }
};

// 🎯 FUNCIONES DE UTILIDAD
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${CLIENT_CONFIG.apiUrl}/${cleanPath}`;
};

export const getPublicTestsUrl = (researchId?: string, participantId?: string): string => {
  let url = CLIENT_CONFIG.publicTestsUrl;
  if (researchId && participantId) {
    url += `?researchId=${researchId}&userId=${participantId}`;
  }
  return url;
};

export const getWebsocketUrl = (): string => {
  return CLIENT_CONFIG.wsUrl;
};

