// ARCHIVO GENERADO AUTOMÁTICAMENTE
// NO MODIFICAR MANUALMENTE
// Generado: 2025-07-06T20:17:59.201Z

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
  "publicTests": "http://localhost:4700",
  "generatedAt": "2025-07-06T23:30:00Z"
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

// Función para detectar el entorno de despliegue
export function detectDeploymentEnvironment() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // AWS Amplify
    if (hostname.includes('amplifyapp.com') || hostname.includes('amplify.aws')) {
      return 'amplify';
    }

    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
      return 'local';
    }
  }

  return 'unknown';
}

// Función para obtener URL de public-tests basada en el entorno
export function getPublicTestsUrl() {
  const environment = detectDeploymentEnvironment();

  switch (environment) {
    case 'local':
      return 'http://localhost:4700';

    case 'amplify':
      return 'https://emotio-xv-2-public-tests.vercel.app';

    default:
      return 'https://emotio-xv-2-public-tests.vercel.app';
  }
}

// Función para navegar a public-tests con researchID
export function navigateToPublicTests(researchID) {
  const baseUrl = getPublicTestsUrl();
  const url = `${baseUrl}/?researchId=${researchID}`;

  console.log(`🌐 Navegando a public-tests: ${url} (entorno: ${detectDeploymentEnvironment()})`);
  window.open(url, '_blank');
}

// Versión default para import default
export default API_ENDPOINTS;
