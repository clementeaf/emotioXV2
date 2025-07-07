// ARCHIVO GENERADO AUTOMÁTICAMENTE
// NO MODIFICAR MANUALMENTE
// Modificado para priorizar variable de entorno VITE_API_URL y usar /dev por defecto

const _API_HTTP_ENDPOINT = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL
      ? process.env.VITE_API_URL
      : 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev');

export const API_ENDPOINTS = {
  // Endpoint HTTP API
  http: _API_HTTP_ENDPOINT,

  // Endpoint WebSocket (opcional, si aplica)
  ws: '',

  // Etapa de despliegue (dev, prod, etc.)
  stage: 'dev'
};

// URLs de desarrollo local
export const LOCAL_URLS = {
  "frontend": "http://localhost:3000",
  "publicTests": "http://localhost:4700"
};

// Constantes para uso más fácil
export const API_HTTP_ENDPOINT = _API_HTTP_ENDPOINT;
export const API_WEBSOCKET_ENDPOINT = '';

// Función para obtener URL completa de una ruta
export function getApiUrl(path) {
  // Eliminar slash inicial si existe
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${_API_HTTP_ENDPOINT}/${cleanPath}`;
}

// Función para websocket (placeholder)
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
