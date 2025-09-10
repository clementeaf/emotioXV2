// ARCHIVO GENERADO AUTOMÁTICAMENTE POR POST-DEPLOY SYNC
// NO MODIFICAR MANUALMENTE - Se sobrescribe en cada deploy
// Generado: 2025-09-04T15:19:09.000Z
// Stage: dev

/**
 * 🔄 Endpoints dinámicos exportados desde AWS Lambda
 * Sincronizado automáticamente después del deploy del backend
 */

// 🎯 Endpoints configurados para usar AWS Lambda en todos los entornos

// Endpoints de API exportados desde backend
export const DYNAMIC_API_ENDPOINTS = {
  // Endpoint HTTP API - Forzar AWS Lambda incluso en desarrollo
  http: "https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev",

  // Endpoint WebSocket - Siempre usar AWS Lambda
  ws: "wss://b59weq4qqh.execute-api.us-east-1.amazonaws.com/dev",

  // Etapa de despliegue (dev, prod, etc.)
  stage: "dev",

  // Metadata de sincronización
  syncedAt: "2025-09-04T15:19:09.000Z",
  syncedFromStage: "dev"
};

// URLs de desarrollo local
export const LOCAL_URLS = {
  "frontend": "http://localhost:3000",
  "publicTests": "http://localhost:5173",
  "generatedAt": "2025-09-04T15:19:09.000Z"
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
  // Si estamos en producción (detectado por el dominio del frontend)
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('s3') || 
       window.location.hostname.includes('cloudfront') ||
       window.location.hostname.includes('.amazonaws.com'))) {
    // Usar variable de entorno si está disponible, sino usar localhost como fallback
    return process.env.NEXT_PUBLIC_PUBLIC_TESTS_URL || LOCAL_URLS.publicTests;
  }
  
  // En desarrollo local, usar localhost
  return LOCAL_URLS.publicTests;
}

// Función para navegar a public-tests con researchID
export function navigateToPublicTests(researchID: string): void {
  const url = `${getPublicTestsUrl()}/${researchID}`;
  window.open(url, '_blank');
}

// Función para verificar si los endpoints están sincronizados
export function isEndpointsSynced(): boolean {
  return API_HTTP_ENDPOINT.includes('execute-api.us-east-1.amazonaws.com');
}

// Versión default para import default
export default DYNAMIC_API_ENDPOINTS;
