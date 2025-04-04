
/**
 * Configuración de endpoints de la API
 * Este archivo es generado automáticamente por el script export-endpoints.js
 * No modificar manualmente.
 * 
 * Generado: 2025-04-04T00:05:41.619Z
 */

const API_CONFIG = {
  "apiBaseUrl": "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev",
  "authApiUrl": "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/auth",
  "researchApiUrl": "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/research",
  "welcomeScreenApiUrl": "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/welcome-screens",
  "eyeTrackingRecruitApiUrl": "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/eye-tracking-recruit",
  "webSocketEndpoint": "",
  "stage": "dev",
  "region": "us-east-1",
  "endpoints": {
    "auth": {
      "login": "/login",
      "register": "/register",
      "me": "/me",
      "logout": "/logout",
      "refreshToken": "/refresh-token"
    },
    "research": {
      "create": "",
      "get": "/{id}",
      "getAll": "",
      "update": "/{id}",
      "delete": "/{id}"
    },
    "welcomeScreen": {
      "create": "",
      "getByResearch": "/research/{researchId}",
      "update": "/{id}",
      "delete": "/{id}"
    },
    "eyeTrackingRecruit": {
      "getConfigByResearchId": "/research/{researchId}/config",
      "createConfig": "/research/{researchId}/config",
      "updateConfig": "/config/{configId}",
      "completeConfig": "/config/{configId}/complete",
      "deleteConfig": "/config/{configId}",
      "createParticipant": "/config/{configId}/participant",
      "updateParticipantStatus": "/participant/{participantId}/status",
      "getParticipantsByConfigId": "/config/{configId}/participants",
      "getStatsByConfigId": "/config/{configId}/stats",
      "generateRecruitmentLink": "/config/{configId}/link",
      "getActiveLinks": "/config/{configId}/links",
      "deactivateLink": "/link/{token}/deactivate",
      "validateRecruitmentLink": "/link/{token}/validate",
      "getResearchSummary": "/research/{researchId}/summary",
      "registerPublicParticipant": "/public/participant/start",
      "updatePublicParticipantStatus": "/public/participant/{participantId}/status"
    }
  }
};

export default API_CONFIG;
