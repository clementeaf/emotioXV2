interface ApiConfig {
  apiUrl: string;
  websocketUrl: string;
  stage: string;
  region: string;
}

// Importar configuración dinámica según el ambiente
const config: ApiConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://ucut04rvah.execute-api.us-east-1.amazonaws.com',
  websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://50pf180l5f.execute-api.us-east-1.amazonaws.com/dev',
  stage: process.env.NEXT_PUBLIC_STAGE || 'dev',
  region: process.env.NEXT_PUBLIC_REGION || 'us-east-1',
};

// Endpoints de la API
export const apiEndpoints = {
  // Autenticación
  auth: {
    requestOTP: `${config.apiUrl}/auth/request-otp`,
    validateOTP: `${config.apiUrl}/auth/validate-otp`,
    logout: `${config.apiUrl}/auth/logout`,
  },
  
  // Usuarios
  user: {
    create: `${config.apiUrl}/user`,
    get: `${config.apiUrl}/user`,
    update: `${config.apiUrl}/user`,
    delete: `${config.apiUrl}/user`,
  },
  
  // Emociones
  emotions: {
    base: `${config.apiUrl}/emotions`,
    getAll: `${config.apiUrl}/emotions`,
    getById: (id: string) => `${config.apiUrl}/emotions/${id}`,
    create: `${config.apiUrl}/emotions`,
    update: (id: string) => `${config.apiUrl}/emotions/${id}`,
    delete: (id: string) => `${config.apiUrl}/emotions/${id}`,
  },

  // Archivos
  files: {
    upload: `${config.apiUrl}/files/upload`,
    getUrl: (key: string) => `${config.apiUrl}/files/${key}`,
  },
  
  // WebSocket
  websocket: {
    endpoint: config.websocketUrl,
    connect: (token: string) => `${config.websocketUrl}?token=${token}`,
  },
};

// Configuración para AWS
export const awsConfig = {
  region: process.env.NEXT_PUBLIC_REGION || 'us-east-1',
  stage: process.env.NEXT_PUBLIC_STAGE || 'dev',
};

export default config; 