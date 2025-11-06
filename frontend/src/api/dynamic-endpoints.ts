// ARCHIVO GENERADO AUTOMÁTICAMENTE POR POST-DEPLOY SYNC
// NO MODIFICAR MANUALMENTE - Se sobrescribe en cada deploy
// Generado: 2025-11-01T23:51:56.000Z
// Stage: dev

/**
 * 🔄 Endpoints dinámicos exportados desde AWS Lambda
 * Sincronizado automáticamente después del deploy del backend
 */

// 🎯 DETECTAR SI ESTAMOS EN DESARROLLO LOCAL
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Endpoints de API exportados desde backend
export const DYNAMIC_API_ENDPOINTS = {
  // Endpoint HTTP API
  http: "https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev",

  // Endpoint WebSocket - Siempre usar AWS Lambda
  ws: "wss://b59weq4qqh.execute-api.us-east-1.amazonaws.com/dev",

  // Etapa de despliegue (dev, prod, etc.)
  stage: "dev",

  // Metadata de sincronización
  syncedAt: "2025-11-01T23:51:56.000Z",
  syncedFromStage: "dev"
};

// URLs de desarrollo local
export const LOCAL_URLS = {
  "frontend": "http://localhost:3000",
  "publicTests": "http://localhost:5173",
  "generatedAt": "2025-11-01T23:51:56.000Z"
};

// Constantes para uso más fácil
export const API_HTTP_ENDPOINT = DYNAMIC_API_ENDPOINTS.http;
export const API_WEBSOCKET_ENDPOINT = DYNAMIC_API_ENDPOINTS.ws;

// Función para obtener URL completa de una ruta
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_HTTP_ENDPOINT}/${cleanPath}`;
}

// Función para obtener URL de WebSocket
export function getWebsocketUrl(): string {
  const wsUrl = API_WEBSOCKET_ENDPOINT;
  
  if (typeof window !== 'undefined') {
    console.log('🔌 WebSocket URL configurada:', wsUrl);
  }
  
  return wsUrl;
}

// Función para obtener URL de public-tests
export function getPublicTestsUrl(): string {
  // 🎯 DETECTAR ENTORNO AUTOMÁTICAMENTE
  const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  
  // Si estamos en localhost → usar localhost de public-tests
  if (isDevelopment) {
    return LOCAL_URLS.publicTests; // http://localhost:5173
  }
  
  // Si estamos desplegados en S3/CloudFront → usar S3/CloudFront de public-tests
  return process.env.NEXT_PUBLIC_PUBLIC_TESTS_URL || 'https://d35071761848hm.cloudfront.net';
}

// Función para navegar a public-tests con researchID
export function navigateToPublicTests(researchID: string): void {
  const url = `${getPublicTestsUrl()}/${researchID}`;
  window.open(url, '_blank');
}

// Función para verificar si los endpoints están sincronizados
export function isEndpointsSynced(): boolean {
  return !isDevelopment && API_HTTP_ENDPOINT.includes('execute-api.us-east-1.amazonaws.com');
}

// Versión default para import default
export default DYNAMIC_API_ENDPOINTS;
