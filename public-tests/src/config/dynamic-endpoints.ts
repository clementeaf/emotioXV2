// 🔄 ARCHIVO DE ENDPOINTS DINÁMICOS PARA PUBLIC-TESTS
// Este archivo carga los endpoints desde el servidor para mantener sincronización
// con el backend desplegado en AWS Lambda

// Interfaz para los endpoints
interface ApiEndpoints {
  http: string;
  ws: string;
  stage: string;
}

interface LocalUrls {
  frontend: string;
  publicTests: string;
  generatedAt: string;
}

interface DynamicEndpoints {
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
    http: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    ws: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    stage: 'dev'
  },
  LOCAL_URLS: {
    frontend: 'http://localhost:3000',
    publicTests: 'http://localhost:4700',
    generatedAt: new Date().toISOString()
  },
  API_HTTP_ENDPOINT: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  API_WEBSOCKET_ENDPOINT: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  getApiUrl: (path: string) => {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/${cleanPath}`;
  },
  getWebsocketUrl: () => import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  getPublicTestsUrl: () => 'http://localhost:4700',
  navigateToPublicTests: (researchID: string) => {
    const url = `http://localhost:4700/${researchID}`;
    window.open(url, '_blank');
  }
};

// Función para cargar endpoints dinámicamente
export async function loadDynamicEndpoints(): Promise<DynamicEndpoints> {
  try {
    // Intentar cargar desde diferentes ubicaciones
    const endpointsUrls = [
      '/config/endpoints.js',
      '/api/endpoints.js',
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

// Función para obtener endpoints con caché
let cachedEndpoints: DynamicEndpoints | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

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

// Función para forzar recarga de endpoints
export async function refreshEndpoints(): Promise<DynamicEndpoints> {
  cachedEndpoints = null;
  lastFetchTime = 0;
  return await getDynamicEndpoints();
}

// Exportar endpoints por defecto para compatibilidad
export default DEFAULT_ENDPOINTS;
