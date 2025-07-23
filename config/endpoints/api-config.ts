/**
 * 🔄 CONFIGURACIÓN CENTRALIZADA DE ENDPOINTS - EmotioXV2
 *
 * Este archivo centraliza toda la configuración de endpoints del proyecto,
 * integrando con el sistema dinámico de backendV2 para mantener sincronización
 * automática entre todos los componentes.
 */

// Interfaz para configuración de endpoints
export interface ApiConfig {
  http: string;
  ws: string;
  stage: string;
  frontend: string;
  publicTests: string;
  generatedAt: string;
}

// Interfaz para endpoints específicos
export interface ApiEndpoints {
  http: string;
  ws: string;
  stage: string;
}

// URLs locales por defecto
export interface LocalUrls {
  frontend: string;
  publicTests: string;
  generatedAt: string;
}

// Configuración dinámica completa
export interface DynamicEndpoints {
  API_ENDPOINTS: ApiEndpoints;
  LOCAL_URLS: LocalUrls;
  API_HTTP_ENDPOINT: string;
  API_WEBSOCKET_ENDPOINT: string;
  getApiUrl: (path: string) => string;
  getWebsocketUrl: () => string;
  getPublicTestsUrl: () => string;
  navigateToPublicTests: (researchID: string) => void;
}

// Endpoints por defecto (fallback)
const DEFAULT_ENDPOINTS: DynamicEndpoints = {
  API_ENDPOINTS: {
    http: process.env.NEXT_PUBLIC_API_URL || 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev',
    ws: process.env.NEXT_PUBLIC_WS_URL || 'wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev',
    stage: 'dev'
  },
  LOCAL_URLS: {
    frontend: 'http://localhost:3000',
    publicTests: 'http://localhost:4700',
    generatedAt: new Date().toISOString()
  },
  API_HTTP_ENDPOINT: process.env.NEXT_PUBLIC_API_URL || 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev',
  API_WEBSOCKET_ENDPOINT: process.env.NEXT_PUBLIC_WS_URL || 'wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev',
  getApiUrl: (path: string) => {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${process.env.NEXT_PUBLIC_API_URL || 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev'}/${cleanPath}`;
  },
  getWebsocketUrl: () => process.env.NEXT_PUBLIC_WS_URL || 'wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev',
  getPublicTestsUrl: () => 'http://localhost:4700',
  navigateToPublicTests: (researchID: string) => {
    const url = `http://localhost:4700/${researchID}`;
    window.open(url, '_blank');
  }
};

/**
 * Función para cargar endpoints dinámicamente desde diferentes fuentes
 */
export async function loadDynamicEndpoints(): Promise<DynamicEndpoints> {
  try {
    // Intentar cargar desde diferentes ubicaciones
    const endpointsUrls = [
      '/config/endpoints/dynamic-endpoints.js',
      '/api/endpoints.js',
      '/config/endpoints.js',
      '/endpoints.js'
    ];

    for (const url of endpointsUrls) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const text = await response.text();

          // Extraer los endpoints del archivo JS
          const httpMatch = text.match(/http:\s*["']([^"']+)["']/);
          const wsMatch = text.match(/ws:\s*["']([^"']+)["']/);
          const stageMatch = text.match(/stage:\s*["']([^"']+)["']/);

          if (httpMatch) {
            const httpEndpoint = httpMatch[1];
            const wsEndpoint = wsMatch ? wsMatch[1] : httpEndpoint.replace('https://', 'wss://').replace('http://', 'ws://');
            const stage = stageMatch ? stageMatch[1] : 'dev';

            return {
              API_ENDPOINTS: {
                http: httpEndpoint,
                ws: wsEndpoint,
                stage
              },
              LOCAL_URLS: {
                frontend: 'http://localhost:3000',
                publicTests: 'http://localhost:4700',
                generatedAt: new Date().toISOString()
              },
              API_HTTP_ENDPOINT: httpEndpoint,
              API_WEBSOCKET_ENDPOINT: wsEndpoint,
              getApiUrl: (path: string) => {
                const cleanPath = path.startsWith('/') ? path.substring(1) : path;
                return `${httpEndpoint}/${cleanPath}`;
              },
              getWebsocketUrl: () => wsEndpoint,
              getPublicTestsUrl: () => 'http://localhost:4700',
              navigateToPublicTests: (researchID: string) => {
                const url = `http://localhost:4700/${researchID}`;
                window.open(url, '_blank');
              }
            };
          }
        }
      } catch (error) {
        console.warn(`No se pudo cargar endpoints desde ${url}:`, error);
        continue;
      }
    }

    // Si no se pudo cargar, usar endpoints por defecto
    console.warn('No se pudieron cargar endpoints dinámicos, usando endpoints por defecto');
    return DEFAULT_ENDPOINTS;

  } catch (error) {
    console.error('Error cargando endpoints dinámicos:', error);
    return DEFAULT_ENDPOINTS;
  }
}

/**
 * Función para obtener configuración de API con caché
 */
let cachedEndpoints: DynamicEndpoints | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function getApiConfig(): Promise<ApiConfig> {
  const now = Date.now();

  // Usar caché si está disponible y no ha expirado
  if (cachedEndpoints && (now - lastFetchTime) < CACHE_DURATION) {
    return {
      http: cachedEndpoints.API_HTTP_ENDPOINT,
      ws: cachedEndpoints.API_WEBSOCKET_ENDPOINT,
      stage: cachedEndpoints.API_ENDPOINTS.stage,
      frontend: cachedEndpoints.LOCAL_URLS.frontend,
      publicTests: cachedEndpoints.LOCAL_URLS.publicTests,
      generatedAt: cachedEndpoints.LOCAL_URLS.generatedAt
    };
  }

  // Cargar endpoints frescos
  cachedEndpoints = await loadDynamicEndpoints();
  lastFetchTime = now;

  return {
    http: cachedEndpoints.API_HTTP_ENDPOINT,
    ws: cachedEndpoints.API_WEBSOCKET_ENDPOINT,
    stage: cachedEndpoints.API_ENDPOINTS.stage,
    frontend: cachedEndpoints.LOCAL_URLS.frontend,
    publicTests: cachedEndpoints.LOCAL_URLS.publicTests,
    generatedAt: cachedEndpoints.LOCAL_URLS.generatedAt
  };
}

/**
 * Función para obtener endpoints dinámicos completos
 */
export async function getDynamicEndpoints(): Promise<DynamicEndpoints> {
  const now = Date.now();

  // Usar caché si está disponible y no ha expirado
  if (cachedEndpoints && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedEndpoints;
  }

  // Cargar endpoints frescos
  cachedEndpoints = await loadDynamicEndpoints();
  lastFetchTime = now;

  return cachedEndpoints;
}

// Exportar configuración por defecto para uso inmediato
export const API_CONFIG: ApiConfig = {
  http: DEFAULT_ENDPOINTS.API_HTTP_ENDPOINT,
  ws: DEFAULT_ENDPOINTS.API_WEBSOCKET_ENDPOINT,
  stage: DEFAULT_ENDPOINTS.API_ENDPOINTS.stage,
  frontend: DEFAULT_ENDPOINTS.LOCAL_URLS.frontend,
  publicTests: DEFAULT_ENDPOINTS.LOCAL_URLS.publicTests,
  generatedAt: DEFAULT_ENDPOINTS.LOCAL_URLS.generatedAt
};

// Exportar funciones de utilidad
export const getApiUrl = DEFAULT_ENDPOINTS.getApiUrl;
export const getWebsocketUrl = DEFAULT_ENDPOINTS.getWebsocketUrl;
export const getPublicTestsUrl = DEFAULT_ENDPOINTS.getPublicTestsUrl;
export const navigateToPublicTests = DEFAULT_ENDPOINTS.navigateToPublicTests;

// Exportar configuración completa por defecto
export default API_CONFIG;
