// ARCHIVO GENERADO AUTOMÁTICAMENTE
// NO MODIFICAR MANUALMENTE
// Generado: 2025-07-11T11:11:28.775Z

// Endpoints de API exportados desde backend
export const API_ENDPOINTS = {
  // Endpoint HTTP API
  http: "https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev",

  // Endpoint WebSocket
  ws: "wss://w8dj7wxnl9.execute-api.us-east-1.amazonaws.com/dev",

  // Etapa de despliegue (dev, prod, etc.)
  stage: "dev"
};

// URLs de desarrollo local
export const LOCAL_URLS = {
  "frontend": "http://localhost:3000",
  "publicTests": "http://localhost:4700"
};

// Constantes para uso más fácil
export const API_HTTP_ENDPOINT = "https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev";
export const API_WEBSOCKET_ENDPOINT = "wss://w8dj7wxnl9.execute-api.us-east-1.amazonaws.com/dev";

// Función para obtener URL completa de una ruta
export function getApiUrl(path) {
  // Eliminar slash inicial si existe
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_HTTP_ENDPOINT}/${cleanPath}`;
}

// Función para websocket
export function getWebsocketUrl() {
  return API_WEBSOCKET_ENDPOINT;
}

// Función para obtener URL de public-tests
export function getPublicTestsUrl() {
  return LOCAL_URLS.publicTests || 'http://localhost:4700';
}

// Función para navegar a public-tests con researchID
export function navigateToPublicTests(researchID) {
  const url = `${getPublicTestsUrl()}/${researchID}`;
  window.open(url, '_blank');
}

// Versión default para import default
export default API_ENDPOINTS;
