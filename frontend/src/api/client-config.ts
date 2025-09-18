// 🎯 CONFIGURACIÓN SEGURA PARA EL CLIENTE
// Este archivo maneja las variables de entorno de forma segura en Next.js

// 🔧 OBTENER VARIABLES DE ENTORNO (se reemplazan en build time)
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev';
const NEXT_PUBLIC_WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://b59weq4qqh.execute-api.us-east-1.amazonaws.com/dev';
const NEXT_PUBLIC_PUBLIC_TESTS_URL = process.env.NEXT_PUBLIC_PUBLIC_TESTS_URL || 'https://d35071761848hm.cloudfront.net';
const NEXT_PUBLIC_ENV = process.env.NEXT_PUBLIC_ENV || 'production';

// 🎯 FUNCIÓN PARA DETECTAR ENTORNO EN RUNTIME
const getIsDevelopment = () => {
  if (typeof window === 'undefined') {
    // Server-side: usar la variable de entorno
    return NEXT_PUBLIC_ENV === 'development';
  }
  // Client-side: detectar por hostname y puerto
  const isLocalhost = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';

  // Verificar si está en puerto de desarrollo (3000) o sin puerto especificado en localhost
  const isDevPort = window.location.port === '3000' ||
                   (isLocalhost && !window.location.port);

  return isLocalhost && isDevPort;
};

// 🎯 FUNCIÓN PARA OBTENER URL DE PUBLIC TESTS DINÁMICAMENTE
const getPublicTestsBaseUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side: usar variable de entorno o default
    return NEXT_PUBLIC_ENV === 'development' ? 'http://localhost:5173' : NEXT_PUBLIC_PUBLIC_TESTS_URL;
  }
  // Client-side: detectar por hostname actual
  const isLocalhost = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';
  return isLocalhost ? 'http://localhost:5173' : NEXT_PUBLIC_PUBLIC_TESTS_URL;
};

// 🎯 CONFIGURACIÓN DE ENDPOINTS
export const CLIENT_CONFIG = {
  // API HTTP
  apiUrl: NEXT_PUBLIC_API_URL,

  // WebSocket
  wsUrl: NEXT_PUBLIC_WS_URL,

  // Public Tests - se evalúa dinámicamente
  get publicTestsUrl() {
    return getPublicTestsBaseUrl();
  },

  // Environment flags - se evalúa dinámicamente
  get isDevelopment() {
    return getIsDevelopment();
  },

  environment: NEXT_PUBLIC_ENV,

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

  // Debug log en desarrollo
  if (CLIENT_CONFIG.isDevelopment && typeof window !== 'undefined') {
    console.log('[client-config] Public Tests URL:', url);
  }

  return url;
};

export const getWebsocketUrl = (): string => {
  return CLIENT_CONFIG.wsUrl;
};

