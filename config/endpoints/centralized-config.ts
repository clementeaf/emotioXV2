/**
 * 🔄 CONFIGURACIÓN CENTRALIZADA DE ENDPOINTS - EmotioXV2
 *
 * Este archivo es generado automáticamente por el script de sincronización.
 * NO MODIFICAR MANUALMENTE - Los cambios se sobrescribirán en la próxima sincronización.
 *
 * Generado: 2025-10-01T19:51:46.000Z
 * Etapa: prod
 */

export const CENTRALIZED_API_CONFIG = {
  http: "http://localhost:3000/dev",
  ws: "ws://localhost:3001/dev",
  stage: "prod",
  frontend: "http://localhost:3000",
  publicTests: "http://localhost:4700",
  generatedAt: "2025-10-01T19:51:46.000Z"
};

export const API_HTTP_ENDPOINT = "http://localhost:3000/dev";
export const API_WEBSOCKET_ENDPOINT = "ws://localhost:3001/dev";
export const API_STAGE = "prod";

// Función para obtener URL completa de una ruta
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_HTTP_ENDPOINT}/${cleanPath}`;
}

// Función para obtener URL de WebSocket
export function getWebsocketUrl(): string {
  return API_WEBSOCKET_ENDPOINT;
}

// Función para obtener URL de public-tests
export function getPublicTestsUrl(): string {
  return CENTRALIZED_API_CONFIG.publicTests;
}

// Función para navegar a public-tests
export function navigateToPublicTests(researchID: string): void {
  const url = `${getPublicTestsUrl()}/${researchID}`;
  window.open(url, '_blank');
}

export default CENTRALIZED_API_CONFIG;
