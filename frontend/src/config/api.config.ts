import endpoints from './endpoints.json';

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
  DELETE: string;
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

// Obtener la URL base desde el archivo endpoints.json generado dinámicamente
const getBaseURL = () => {
  // Usar directamente la URL desde endpoints.json
  if (endpoints && endpoints.apiUrl) {
    console.log('Usando URL base desde endpoints.json:', endpoints.apiUrl);
    return endpoints.apiUrl;
  }
  
  // Fallback por si no existe endpoints.json
  const fallbackUrl = 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev';
  console.log('Usando URL base fallback:', fallbackUrl);
  return fallbackUrl;
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
    
    // Pantallas de bienvenida
    welcomeScreen: {
      GET_BY_RESEARCH: '/welcome-screens/research/{researchId}',
      GET: '/welcome-screens/{id}',
      CREATE: '/welcome-screens',
      UPDATE: '/welcome-screens/{id}',
      DELETE: '/welcome-screens/{id}',
    },
    
    // Pantallas de agradecimiento
    thankYouScreen: {
      GET_BY_RESEARCH: '/thank-you-screens/research/{researchId}',
      GET: '/thank-you-screens/{id}',
      CREATE: '/thank-you-screens',
      UPDATE: '/thank-you-screens/{id}',
      DELETE: '/thank-you-screens/{id}',
    },
    
    // SmartVOC
    smartVoc: {
      GET_BY_RESEARCH: '/smart-voc/research/{researchId}/smart-voc',
      GET: '/smart-voc/{id}',
      CREATE: '/smart-voc',
      UPDATE: '/smart-voc/{id}',
      DELETE: '/smart-voc/{id}',
    },
    
    // Eye Tracking
    eyeTracking: {
      GET_BY_RESEARCH: '/eye-tracking/research/{researchId}',
      GET: '/eye-tracking/{id}',
      CREATE: '/eye-tracking',
      UPDATE: '/eye-tracking/{id}',
      DELETE: '/eye-tracking/{id}',
      RECRUIT_GET: '/eye-tracking/recruit/{recruitId}',
      RECRUIT_UPDATE: '/eye-tracking/recruit/{recruitId}',
      RECRUIT_CREATE: '/eye-tracking/recruit',
      RECRUIT_GET_ALT: '/eye-tracking-recruit/config/{recruitId}',
      RECRUIT_UPDATE_ALT: '/eye-tracking-recruit/config/{recruitId}',
      RECRUIT_CREATE_ALT: '/eye-tracking-recruit/research/{researchId}/config',
    },
    
    // Tareas Cognitivas
    cognitiveTask: {
      getByResearch: '/cognitive-task/research/{researchId}',
      get: '/cognitive-task/{id}',
      create: '/cognitive-task',
      update: '/cognitive-task/{id}',
      delete: '/cognitive-task/{id}',
      createOrUpdate: '/cognitive-task/research/{researchId}'
    },
    
    // S3
    s3: {
      UPLOAD: '/s3/upload',
      DOWNLOAD: '/s3/download/{key}',
      DELETE: '/s3/delete/{key}',
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
  endpointExample: API_CONFIG.baseURL + API_CONFIG.endpoints.research.CREATE
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
