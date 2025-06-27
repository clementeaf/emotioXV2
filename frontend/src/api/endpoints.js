// ARCHIVO GENERADO AUTOMÁTICAMENTE
// NO MODIFICAR MANUALMENTE
// Generado: 2025-06-27T11:40:22.251Z

// Endpoints de API exportados desde backend
export const API_ENDPOINTS = {
  // Endpoint HTTP API
  http: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",

  // Endpoint WebSocket
  ws: process.env.NEXT_PUBLIC_WS_URL || "",

  // Etapa de despliegue (dev, prod, etc.)
  stage: process.env.NEXT_PUBLIC_STAGE || "dev"
};

// Constantes para uso más fácil
export const API_HTTP_ENDPOINT = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
export const API_WEBSOCKET_ENDPOINT = process.env.NEXT_PUBLIC_WS_URL || "";

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
