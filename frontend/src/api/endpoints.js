// ARCHIVO GENERADO AUTOMÁTICAMENTE
// NO MODIFICAR MANUALMENTE
// Generado: 2025-06-29T18:25:36.646Z

// Endpoints de API exportados desde backend
export const API_ENDPOINTS = {
  // Endpoint HTTP API
  http: "https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod",
  
  // Endpoint WebSocket
  ws: "wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod",
  
  // Etapa de despliegue (dev, prod, etc.)
  stage: "dev"
};

// Constantes para uso más fácil
export const API_HTTP_ENDPOINT = "https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod";
export const API_WEBSOCKET_ENDPOINT = "wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod";

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
