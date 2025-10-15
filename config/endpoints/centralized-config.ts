/**
 * 🔄 CONFIGURACIÓN CENTRALIZADA DE ENDPOINTS - EmotioXV2
 *
 * Este archivo es generado automáticamente por el script post-deploy.
 * NO MODIFICAR MANUALMENTE - Los cambios se sobrescribirán en el próximo deploy.
 *
 * Generado: 2025-10-15T10:52:15.000Z
 * Etapa: dev
 * Backend Deployed: https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev
 */

export const CENTRALIZED_API_CONFIG = {
  http: "https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev",
  ws: "wss://b59weq4qqh.execute-api.us-east-1.amazonaws.com/dev",
  stage: "dev",
  frontend: "http://localhost:3000",
  publicTests: "http://localhost:4700",
  generatedAt: "2025-10-15T10:52:15.000Z",
  deployedEndpoint: "https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev",
  syncMethod: "post-deploy-script"
};

export const API_HTTP_ENDPOINT = "https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev";
export const API_WEBSOCKET_ENDPOINT = "wss://b59weq4qqh.execute-api.us-east-1.amazonaws.com/dev";
export const API_STAGE = "dev";

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
  return CENTRALIZED_API_CONFIG.publicTests;
}

// Función para navegar a public-tests
export function navigateToPublicTests(researchID: string): void {
  const url = `${getPublicTestsUrl()}/${researchID}`;
  window.open(url, '_blank');
}

// Función para verificar sincronización
export function isEndpointsSynced(): boolean {
  return API_HTTP_ENDPOINT.includes('execute-api.us-east-1.amazonaws.com');
}

export default CENTRALIZED_API_CONFIG;
