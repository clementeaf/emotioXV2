// 🔄 ARCHIVO DE ENDPOINTS DINÁMICOS
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

// Endpoints por defecto (fallback) - Solo variables de entorno
const DEFAULT_ENDPOINTS: DynamicEndpoints = {
  API_ENDPOINTS: {
    http: process.env.NEXT_PUBLIC_API_URL || '',
    ws: process.env.NEXT_PUBLIC_WS_URL || '',
    stage: 'dev'
  },
  LOCAL_URLS: {
    frontend: 'http://localhost:3000',
    publicTests: 'http://localhost:4700',
    generatedAt: new Date().toISOString()
  },
  API_HTTP_ENDPOINT: process.env.NEXT_PUBLIC_API_URL || '',
  API_WEBSOCKET_ENDPOINT: process.env.NEXT_PUBLIC_WS_URL || '',
  getApiUrl: (path: string) => {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    return baseUrl ? `${baseUrl}/${cleanPath}` : '';
  },
  getWebsocketUrl: () => process.env.NEXT_PUBLIC_WS_URL || '',
  getPublicTestsUrl: () => {
    // Detectar entorno de despliegue
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;

      // Vercel deployment
      if (hostname.includes('vercel.app') || hostname.includes('vercel.com')) {
        return process.env.NEXT_PUBLIC_PUBLIC_TESTS_VERCEL_URL ||
          'https://emotio-xv-2-public-tests.vercel.app';
      }

      // AWS Amplify
      if (hostname.includes('amplifyapp.com') || hostname.includes('amplify.aws')) {
        return process.env.NEXT_PUBLIC_PUBLIC_TESTS_AWS_URL ||
          process.env.NEXT_PUBLIC_PUBLIC_TESTS_URL ||
          'https://emotioxv2-public-tests.s3.amazonaws.com';
      }

      // Local development
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
        return 'http://localhost:4700';
      }
    }

    // Fallback a Vercel
    return 'https://emotio-xv-2-public-tests.vercel.app';
  },
  navigateToPublicTests: (researchID: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_TESTS_AWS_URL ||
      process.env.NEXT_PUBLIC_PUBLIC_TESTS_URL ||
      'http://localhost:4700';
    const url = `${baseUrl}/${researchID}`;

    // console.log(`🌐 Navegando a public-tests: ${url}`);
    window.open(url, '_blank');
  }
};

// Función simplificada para cargar endpoints dinámicamente
export async function loadDynamicEndpoints(): Promise<DynamicEndpoints> {
  try {
    // 🎯 SOLO EN PRODUCCIÓN: Intentar cargar desde el servidor
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
      console.log('🔄 Entorno de producción detectado, intentando cargar endpoints dinámicos...');

      const endpointsUrls = [
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

              console.log('✅ Endpoints dinámicos cargados desde servidor');
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
                getPublicTestsUrl: () => {
                  // Detectar entorno de despliegue
                  if (typeof window !== 'undefined') {
                    const hostname = window.location.hostname;

                    // Vercel deployment
                    if (hostname.includes('vercel.app') || hostname.includes('vercel.com')) {
                      return process.env.NEXT_PUBLIC_PUBLIC_TESTS_VERCEL_URL ||
                        'https://emotio-xv-2-public-tests.vercel.app';
                    }

                    // AWS Amplify
                    if (hostname.includes('amplifyapp.com') || hostname.includes('amplify.aws')) {
                      return process.env.NEXT_PUBLIC_PUBLIC_TESTS_AWS_URL ||
                        process.env.NEXT_PUBLIC_PUBLIC_TESTS_URL ||
                        'https://emotioxv2-public-tests.s3.amazonaws.com';
                    }

                    // Local development
                    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
                      return 'http://localhost:4700';
                    }
                  }

                  // Fallback a Vercel
                  return 'https://emotio-xv-2-public-tests.vercel.app';
                },
                navigateToPublicTests: (researchID: string) => {
                  const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_TESTS_VERCEL_URL ||
                    'https://emotio-xv-2-public-tests.vercel.app';
                  const url = `${baseUrl}/${researchID}`;

                  // console.log(`🌐 Navegando a public-tests: ${url}`);
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
    }

    // 🎯 EN DESARROLLO O SI FALLA EN PRODUCCIÓN: Usar variables de entorno
    console.log('🔄 Usando endpoints desde variables de entorno');
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
