/**
 * Configuración de endpoints de la API
 * Este archivo es generado automáticamente por el script export-endpoints.js
 * No modificar manualmente.
 *
 * Generado: 2025-04-04T00:05:41.624Z
 */

export interface ApiEndpoint {
  apiBaseUrl: string;
  authApiUrl: string;
  researchApiUrl: string;
  welcomeScreenApiUrl: string;
  eyeTrackingRecruitApiUrl: string;
  webSocketEndpoint: string;
  stage: string;
  region: string;
  endpoints: {
    auth: {
      login: string;
      register: string;
      me: string;
      logout: string;
      refreshToken: string;
    };
    research: {
      create: string;
      get: string;
      getAll: string;
      update: string;
      delete: string;
    };
    welcomeScreen: {
      create: string;
      getByResearch: string;
      update: string;
      delete: string;
    };
    eyeTrackingRecruit: {
      getConfigByResearchId: string;
      createConfig: string;
      updateConfig: string;
      completeConfig: string;
      deleteConfig: string;
      createParticipant: string;
      updateParticipantStatus: string;
      getParticipantsByConfigId: string;
      getStatsByConfigId: string;
      generateRecruitmentLink: string;
      getActiveLinks: string;
      deactivateLink: string;
      validateRecruitmentLink: string;
      getResearchSummary: string;
      registerPublicParticipant: string;
      updatePublicParticipantStatus: string;
    };
  };
}

const API_CONFIG: ApiEndpoint = {
  'apiBaseUrl': 'https://5jdha0p3jl.execute-api.us-east-1.amazonaws.com/dev',
  'authApiUrl': 'https://5jdha0p3jl.execute-api.us-east-1.amazonaws.com/dev/auth',
  'researchApiUrl': 'https://5jdha0p3jl.execute-api.us-east-1.amazonaws.com/dev/research',
  'welcomeScreenApiUrl': 'https://5jdha0p3jl.execute-api.us-east-1.amazonaws.com/dev/welcome-screens',
  'eyeTrackingRecruitApiUrl': 'https://5jdha0p3jl.execute-api.us-east-1.amazonaws.com/dev/eye-tracking-recruit',
  'webSocketEndpoint': '',
  'stage': 'dev',
  'region': 'us-east-1',
  'endpoints': {
    'auth': {
      'login': '/login',
      'register': '/register',
      'me': '/me',
      'logout': '/logout',
      'refreshToken': '/refresh-token'
    },
    'research': {
      'create': '',
      'get': '/{id}',
      'getAll': '',
      'update': '/{id}',
      'delete': '/{id}'
    },
    'welcomeScreen': {
      'create': '',
      'getByResearch': '/research/{researchId}',
      'update': '/{id}',
      'delete': '/{id}'
    },
    'eyeTrackingRecruit': {
      'getConfigByResearchId': '/research/{researchId}/config',
      'createConfig': '/research/{researchId}/config',
      'updateConfig': '/config/{configId}',
      'completeConfig': '/config/{configId}/complete',
      'deleteConfig': '/config/{configId}',
      'createParticipant': '/config/{configId}/participant',
      'updateParticipantStatus': '/participant/{participantId}/status',
      'getParticipantsByConfigId': '/config/{configId}/participants',
      'getStatsByConfigId': '/config/{configId}/stats',
      'generateRecruitmentLink': '/config/{configId}/link',
      'getActiveLinks': '/config/{configId}/links',
      'deactivateLink': '/link/{token}/deactivate',
      'validateRecruitmentLink': '/link/{token}/validate',
      'getResearchSummary': '/research/{researchId}/summary',
      'registerPublicParticipant': '/public/participant/start',
      'updatePublicParticipantStatus': '/public/participant/{participantId}/status'
    }
  }
};

export default API_CONFIG;

/**
 * Configuración de endpoints estáticos
 * Este objeto contiene las rutas API predefinidas para usar en toda la aplicación
 *
 * Última actualización: 2025-04-23T15:30:00.000Z
 */
export const API_STATIC_CONFIG = {
  'apiBaseUrl': 'https://5jdha0p3jl.execute-api.us-east-1.amazonaws.com/dev',
  'authApiUrl': 'https://5jdha0p3jl.execute-api.us-east-1.amazonaws.com/dev/auth',
  'researchApiUrl': 'https://5jdha0p3jl.execute-api.us-east-1.amazonaws.com/dev/research',
  'welcomeScreenApiUrl': 'https://5jdha0p3jl.execute-api.us-east-1.amazonaws.com/dev/welcome-screens',
  'eyeTrackingRecruitApiUrl': 'https://5jdha0p3jl.execute-api.us-east-1.amazonaws.com/dev/eye-tracking-recruit',
  // ... existing code ...
};
