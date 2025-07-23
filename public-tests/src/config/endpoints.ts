// ARCHIVO GENERADO AUTOMÁTICAMENTE
// NO MODIFICAR MANUALMENTE
// Generado: 2025-07-20T16:20:17.392Z

// 🎯 DETECTAR SI ESTAMOS EN DESARROLLO LOCAL
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// Endpoints de API exportados desde backend
export const API_ENDPOINTS = {
  // Endpoint HTTP API
  http: isDevelopment
    ? "http://localhost:3000"
    : "https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev",

  // Endpoint WebSocket
  ws: isDevelopment
    ? "ws://localhost:3001"
    : "wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev",

  // Etapa de despliegue (dev, prod, etc.)
  stage: "dev"
};

// URLs de desarrollo local
export const LOCAL_URLS = {
  "frontend": "http://localhost:3000",
  "publicTests": "http://localhost:4700",
  "generatedAt": "2025-01-07T15:30:00.000Z"
};

// Constantes para uso más fácil
export const API_HTTP_ENDPOINT = isDevelopment
  ? "http://localhost:3000"
  : "https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev";

export const API_WEBSOCKET_ENDPOINT = isDevelopment
  ? "ws://localhost:3001"
  : "wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev";

// Función para obtener URL completa de una ruta
export function getApiUrl(path: string): string {
  // Eliminar slash inicial si existe
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_HTTP_ENDPOINT}/${cleanPath}`;
}

// Función para websocket
export function getWebsocketUrl(): string {
  return API_WEBSOCKET_ENDPOINT;
}

// Función para obtener URL de public-tests
export function getPublicTestsUrl(): string {
  return LOCAL_URLS.publicTests || 'http://localhost:4700';
}

// Función para navegar a public-tests con researchID
export function navigateToPublicTests(researchID: string): void {
  const url = `${getPublicTestsUrl()}/${researchID}`;
  window.open(url, '_blank');
}

// Versión default para import default
export default API_ENDPOINTS;
