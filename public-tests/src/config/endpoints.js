// ARCHIVO GENERADO AUTOMÁTICAMENTE
// NO MODIFICAR MANUALMENTE
// Generado: 2025-07-06T20:11:35.951Z

// Endpoints de API exportados desde backend
export const API_ENDPOINTS = {
  // Endpoint HTTP API
  http: "http://localhost:3000/dev",
  
  // Endpoint WebSocket
  ws: "ws://localhost:3001/dev",
  
  // Etapa de despliegue (dev, prod, etc.)
  stage: "dev"
};

// URLs de AWS Amplify
export const AMPLIFY_URLS = {
  "frontend": "https://d12psv9dnscmm4.amplifyapp.com",
  "publicTests": "https://d2vbj9lxdnqvqq.amplifyapp.com",
  "frontendAppId": "d12psv9dnscmm4",
  "publicTestsAppId": "d2vbj9lxdnqvqq",
  "generatedAt": "2025-07-06T20:11:33Z"
};

// Constantes para uso más fácil
export const API_HTTP_ENDPOINT = "http://localhost:3000/dev";
export const API_WEBSOCKET_ENDPOINT = "ws://localhost:3001/dev";

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
  return AMPLIFY_URLS.publicTests || 'http://localhost:4700';
}

// Función para navegar a public-tests con researchID
export function navigateToPublicTests(researchID) {
  const url = `${getPublicTestsUrl()}/${researchID}`;
  window.open(url, '_blank');
}

// Versión default para import default
export default API_ENDPOINTS;
