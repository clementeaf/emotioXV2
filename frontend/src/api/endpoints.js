// ARCHIVO GENERADO AUTOMÁTICAMENTE
// NO MODIFICAR MANUALMENTE
// Generado: 2025-06-21T22:31:11.382Z

// Endpoints de API exportados desde backend
export const API_ENDPOINTS = {
  // Endpoint HTTP API
  http: "https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev",
  
  // Endpoint WebSocket
  ws: "wss://w8dj7wxnl9.execute-api.us-east-1.amazonaws.com/dev",
  
  // Etapa de despliegue (dev, prod, etc.)
  stage: "dev"
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

// Versión default para import default
export default API_ENDPOINTS;
