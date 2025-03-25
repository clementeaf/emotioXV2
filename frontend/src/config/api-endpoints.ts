
/**
 * Configuración de endpoints de la API
 * Este archivo es generado automáticamente por el script export-endpoints.js
 * No modificar manualmente.
 * 
 * Generado: 2025-03-25T15:44:17.307Z
 */

export interface ApiEndpoint {
  apiBaseUrl: string;
  authApiUrl: string;
  researchApiUrl: string;
  welcomeScreenApiUrl: string;
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
  };
}

const API_CONFIG: ApiEndpoint = {
  "apiBaseUrl": "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev",
  "authApiUrl": "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/auth",
  "researchApiUrl": "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/research",
  "welcomeScreenApiUrl": "https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/welcome-screens",
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
    }
  }
};

export default API_CONFIG;
