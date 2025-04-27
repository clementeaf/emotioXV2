import { API_HTTP_ENDPOINT } from '@/api/endpoints';

// Estructura para welcome screen
interface WelcomeScreenEndpoints {
  CREATE: string;
  GET: string;
  GET_BY_RESEARCH: string;
  UPDATE: string;
  DELETE: string;
}

// Estructura para thank you screen
interface ThankYouScreenEndpoints {
  CREATE: string;
  GET: string;
  GET_BY_RESEARCH: string;
  UPDATE: string;
  DELETE: string;
}

interface AuthEndpoints {
  LOGIN: string;
  REGISTER: string;
  LOGOUT: string;
  REFRESH_TOKEN: string;
  PROFILE: string;
}

// Estructura para smart VOC
interface SmartVocEndpoints {
  CREATE: string;
  GET: string;
  GET_BY_RESEARCH: string;
  UPDATE: string;
  DELETE: string;
}

// Estructura para eye tracking
interface EyeTrackingEndpoints {
  CREATE: string;
  GET: string;
  GET_BY_RESEARCH: string;
  UPDATE: string;
  DELETE: string;
  RECRUIT_GET: string;
  RECRUIT_UPDATE: string;
  RECRUIT_CREATE: string;
  RECRUIT_GET_ALT: string;
  RECRUIT_UPDATE_ALT: string;
  RECRUIT_CREATE_ALT: string;
}

// Estructura para tareas cognitivas
interface CognitiveTaskEndpoints {
  CREATE: string;
  GET: string;
  GET_BY_RESEARCH: string;
  UPDATE: string;
  DELETE: string;
}

// Estructura para S3
interface S3Endpoints {
  UPLOAD: string;
  DOWNLOAD: string;
  DELETE_OBJECT: string;
}

// Modificamos la interfaz para incluir los endpoints añadidos
interface Endpoints {
  auth: AuthEndpoints;
  research: {
    CREATE: string;
    GET: string;
    LIST: string;
    UPDATE: string;
    DELETE: string;
    UPDATE_STATUS: string;
    UPDATE_STAGE: string;
  };
  welcomeScreen: WelcomeScreenEndpoints;
  thankYouScreen: ThankYouScreenEndpoints;
  smartVoc: SmartVocEndpoints;
  eyeTracking: EyeTrackingEndpoints;
  cognitiveTask: CognitiveTaskEndpoints;
  s3: S3Endpoints;
}

// Obtener la URL base desde el archivo endpoints.js generado dinámicamente
const getBaseURL = () => {
  // Usar la URL desde API_ENDPOINTS generado automáticamente
  console.log('Usando URL base desde endpoints.js:', API_HTTP_ENDPOINT);
  return API_HTTP_ENDPOINT;
};

// Configuración de la API
const API_CONFIG = {
  // URL base para todas las solicitudes - utilizando sistema dinámico
  baseURL: getBaseURL(),

  // Puntos finales para diferentes recursos
  endpoints: {
    // Autenticación
    auth: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH_TOKEN: '/auth/refreshToken',
      LOGOUT: '/auth/logout',
      PROFILE: '/auth/profile',
    },
    
    // Gestión de investigaciones
    research: {
      createResearch: '/research',
      getResearch: '/research/{id}',
      getAllResearch: '/research',
      updateResearch: '/research/{id}',
      deleteResearch: '/research/{id}',
      UPDATE_STATUS: '/research/{id}/status',
      UPDATE_STAGE: '/research/{id}/stage',
    },
    
    // Pantallas de bienvenida - RUTAS ESPECÍFICAS POR OPERACIÓN
    welcomeScreen: {
      // Ruta para GET por researchId y CREATE
      GET_BY_RESEARCH: '/research/{researchId}/welcome-screen',
      CREATE: '/research/{researchId}/welcome-screen',
      // Ruta para UPDATE y DELETE específicos (y GET por screenId si existiera)
      UPDATE: '/research/{researchId}/welcome-screen/{screenId}',
      DELETE: '/research/{researchId}/welcome-screen/{screenId}',
      GET: '/research/{researchId}/welcome-screen/{screenId}',
    },
    
    // Pantallas de agradecimiento - USAR RUTAS JERÁRQUICAS
    thankYouScreen: {
      BASE_PATH: '/research/{researchId}/thank-you-screen',
      GET_BY_RESEARCH: '/research/{researchId}/thank-you-screen',
      GET: '/research/{researchId}/thank-you-screen', // GET directo no aplica
      CREATE: '/research/{researchId}/thank-you-screen',
      UPDATE: '/research/{researchId}/thank-you-screen/{screenId}',
      DELETE: '/research/{researchId}/thank-you-screen/{screenId}',
    },
    
    // SmartVOC - USAR RUTAS JERÁRQUICAS
    smartVoc: {
      BASE_PATH: '/research/{researchId}/smart-voc',
      GET_BY_RESEARCH: '/research/{researchId}/smart-voc',
      GET: '/research/{researchId}/smart-voc', // GET directo no aplica
      CREATE: '/research/{researchId}/smart-voc',
      UPDATE: '/research/{researchId}/smart-voc',
      DELETE: '/research/{researchId}/smart-voc',
    },
    
    // Eye Tracking - USAR RUTAS JERÁRQUICAS
    eyeTracking: {
      BASE_PATH: '/research/{researchId}/eye-tracking',
      GET_BY_RESEARCH: '/research/{researchId}/eye-tracking',
      GET: '/research/{researchId}/eye-tracking', // GET directo no aplica
      CREATE: '/research/{researchId}/eye-tracking',
      UPDATE: '/research/{researchId}/eye-tracking',
      DELETE: '/research/{researchId}/eye-tracking',
      // Para Reclutamiento, usar la ruta específica
      RECRUIT_BASE_PATH: '/research/{researchId}/eye-tracking-recruit',
      RECRUIT_GET: '/research/{researchId}/eye-tracking-recruit',
      RECRUIT_UPDATE: '/research/{researchId}/eye-tracking-recruit',
      RECRUIT_CREATE: '/research/{researchId}/eye-tracking-recruit',
      // Eliminar rutas _ALT que ya no son necesarias
      // RECRUIT_GET_ALT: ...
      // RECRUIT_UPDATE_ALT: ...
      // RECRUIT_CREATE_ALT: ...
    },
    
    // Tareas Cognitivas - USAR RUTAS JERÁRQUICAS
    cognitiveTask: {
      BASE_PATH: '/research/{researchId}/cognitive-task',
      GET_BY_RESEARCH: '/research/{researchId}/cognitive-task',
      GET: '/research/{researchId}/cognitive-task', // GET directo no aplica
      CREATE: '/research/{researchId}/cognitive-task',
      UPDATE: '/research/{researchId}/cognitive-task',
      DELETE: '/research/{researchId}/cognitive-task',
      // Mantener por si se usa específicamente
      getByResearch: '/research/{researchId}/cognitive-task',
      createOrUpdate: '/research/{researchId}/cognitive-task' 
    },
    
    // S3
    s3: {
      UPLOAD: '/s3/upload',
      DOWNLOAD: '/s3/download',
      DELETE_OBJECT: '/s3/delete-object',
    },
  },
  
  // Configuraciones generales para la comunicación con la API
  config: {
    defaultTimeout: 30000, // 30 segundos
    retryAttempts: 3,
    retryDelay: 1000, // 1 segundo
  },
};

// Agregar logs para depuración
console.log('API_CONFIG:', {
  baseURL: API_CONFIG.baseURL,
  endpointExample: API_CONFIG.baseURL + API_CONFIG.endpoints.research.createResearch
});

// Añadir logs adicionales para depuración
console.log('Smart VOC endpoints:', {
  GET_BY_RESEARCH: API_CONFIG.baseURL + API_CONFIG.endpoints.smartVoc.GET_BY_RESEARCH.replace('{researchId}', 'ejemplo'),
  CREATE: API_CONFIG.baseURL + API_CONFIG.endpoints.smartVoc.CREATE,
  GET: API_CONFIG.baseURL + API_CONFIG.endpoints.smartVoc.GET.replace('{id}', 'ejemplo'),
  UPDATE: API_CONFIG.baseURL + API_CONFIG.endpoints.smartVoc.UPDATE.replace('{id}', 'ejemplo'),
});

console.log('MODO API: Usando URL dinámica desde configuración:', API_CONFIG.baseURL);

export default API_CONFIG;
export type APIConfig = typeof API_CONFIG; 
