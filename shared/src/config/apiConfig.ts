/**
 * Configuración centralizada de API para todos los servicios
 * Se actualiza automáticamente en cada deploy
 */

export interface ApiConfig {
  backend: {
    base_url: string;
    region: string;
    stage: string;
  };
  frontend: {
    base_url: string;
  };
  public_tests: {
    base_url: string;
  };
  s3: {
    bucket: string;
    region: string;
  };
  cloudfront: {
    distribution_id: string;
    domain: string;
  };
}

export interface EndpointConfig {
  auth: string;
  research: string;
  participants: string;
  responses: string;
  forms: string;
  educational_content: string;
  eye_tracking: string;
  smart_voc: string;
  cognitive_tasks: string;
  module_responses: string;
  websocket: string;
}

// Configuración por defecto (se sobrescribe en runtime)
const DEFAULT_CONFIG: ApiConfig = {
  backend: {
    base_url: "https://api-dev.emotioxv2.com",
    region: "us-east-1",
    stage: "dev"
  },
  frontend: {
    base_url: "https://admin-dev.emotioxv2.com"
  },
  public_tests: {
    base_url: "https://tests-dev.emotioxv2.com"
  },
  s3: {
    bucket: "emotioxv2-uploads-dev",
    region: "us-east-1"
  },
  cloudfront: {
    distribution_id: "E1234567890DEV",
    domain: "d1234567890dev.cloudfront.net"
  }
};

const DEFAULT_ENDPOINTS: EndpointConfig = {
  auth: "/auth",
  research: "/research",
  participants: "/participants",
  responses: "/responses",
  forms: "/forms",
  educational_content: "/educational-content",
  eye_tracking: "/eye-tracking",
  smart_voc: "/smart-voc",
  cognitive_tasks: "/cognitive-tasks",
  module_responses: "/module-responses",
  websocket: "/ws"
};

/**
 * Obtiene la configuración de API basada en el entorno
 */
export const getApiConfig = (): ApiConfig => {
  // En runtime, esto se puede sobrescribir con variables de entorno
  // const env = process.env.NODE_ENV || 'development';
  
  // Intentar cargar configuración desde archivo YAML
  try {
    // En un entorno real, esto cargaría desde el archivo YAML
    // const config = loadYamlConfig(`config/api-endpoints-${env}.yml`);
    // return config;
  } catch (error) {
    console.warn('[ApiConfig] No se pudo cargar configuración YAML, usando defaults');
  }
  
  return DEFAULT_CONFIG;
};

/**
 * Obtiene los endpoints de API
 */
export const getEndpoints = (): EndpointConfig => {
  return DEFAULT_ENDPOINTS;
};

/**
 * Construye URL completa para un endpoint
 */
export const buildApiUrl = (service: keyof ApiConfig, endpoint: keyof EndpointConfig): string => {
  const config = getApiConfig();
  const endpoints = getEndpoints();
  
  const serviceConfig = config[service] as { base_url: string };
  const baseUrl = serviceConfig.base_url;
  const endpointPath = endpoints[endpoint];
  
  return `${baseUrl}${endpointPath}`;
};

/**
 * Construye URL de WebSocket
 */
export const buildWebSocketUrl = (): string => {
  const config = getApiConfig();
  const endpoints = getEndpoints();
  
  return `wss://${config.backend.base_url.replace('https://', '')}${endpoints.websocket}`;
};

/**
 * Obtiene configuración de S3
 */
export const getS3Config = () => {
  const config = getApiConfig();
  return {
    bucket: config.s3.bucket,
    region: config.s3.region,
    baseUrl: `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com`
  };
};

/**
 * Obtiene configuración de CloudFront
 */
export const getCloudFrontConfig = () => {
  const config = getApiConfig();
  return {
    distributionId: config.cloudfront.distribution_id,
    domain: config.cloudfront.domain,
    baseUrl: `https://${config.cloudfront.domain}`
  };
};
