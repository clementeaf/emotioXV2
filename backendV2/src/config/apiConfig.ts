/**
 * Configuración de API para backend
 * Se actualiza automáticamente en cada deploy
 */

// import { getApiConfig, getS3Config, getCloudFrontConfig } from 'shared/config/apiConfig';

/**
 * Configuración de API para el backend
 */
export const backendApiConfig = {
  // Información del entorno
  get environment() {
    return process.env.NODE_ENV || 'development';
  },
  
  get region() {
    return process.env.AWS_REGION || 'us-east-1';
  },
  
  get stage() {
    return process.env.STAGE || 'dev';
  },
  
  // URLs para diferentes servicios
  get frontendUrl() {
    return process.env.FRONTEND_URL || 'https://admin-dev.emotioxv2.com';
  },
  
  get publicTestsUrl() {
    return process.env.PUBLIC_TESTS_URL || 'https://tests-dev.emotioxv2.com';
  },
  
  // Configuración de AWS
  get s3Config() {
    return {
      bucket: process.env.S3_BUCKET || 'emotioxv2-uploads-dev',
      region: process.env.AWS_REGION || 'us-east-1',
      baseUrl: `https://${process.env.S3_BUCKET || 'emotioxv2-uploads-dev'}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`
    };
  },
  
  get cloudFrontConfig() {
    return {
      distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || 'E1234567890DEV',
      domain: process.env.CLOUDFRONT_DOMAIN || 'd1234567890dev.cloudfront.net',
      baseUrl: `https://${process.env.CLOUDFRONT_DOMAIN || 'd1234567890dev.cloudfront.net'}`
    };
  },
  
  // Configuración específica del backend
  get corsOrigins() {
    return [
      this.frontendUrl,
      this.publicTestsUrl,
      'http://localhost:3000',
      'http://localhost:3001'
    ];
  },
  
  get allowedHeaders() {
    return [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ];
  },
  
  get allowedMethods() {
    return ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];
  }
};

/**
 * Obtiene configuración de CORS para el backend
 */
export const getCorsConfig = () => {
  return {
    origin: backendApiConfig.corsOrigins,
    headers: backendApiConfig.allowedHeaders,
    methods: backendApiConfig.allowedMethods,
    credentials: true,
    optionsSuccessStatus: 200
  };
};

/**
 * Obtiene configuración de S3 para el backend
 */
export const getS3BackendConfig = () => {
  return {
    bucket: backendApiConfig.s3Config.bucket,
    region: backendApiConfig.s3Config.region,
    baseUrl: backendApiConfig.s3Config.baseUrl,
    // Configuración específica para el backend
    uploadsPath: 'uploads',
    tempPath: 'temp',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  };
};

/**
 * Obtiene configuración de CloudFront para el backend
 */
export const getCloudFrontBackendConfig = () => {
  return {
    distributionId: backendApiConfig.cloudFrontConfig.distributionId,
    domain: backendApiConfig.cloudFrontConfig.domain,
    baseUrl: backendApiConfig.cloudFrontConfig.baseUrl,
    // Configuración específica para el backend
    cacheBehavior: {
      defaultTtl: 86400, // 1 día
      maxTtl: 31536000,  // 1 año
      minTtl: 0
    }
  };
};

/**
 * Obtiene configuración completa del backend
 */
export const getBackendConfig = () => {
  return {
    environment: backendApiConfig.environment,
    region: backendApiConfig.region,
    stage: backendApiConfig.stage,
    urls: {
      frontend: backendApiConfig.frontendUrl,
      publicTests: backendApiConfig.publicTestsUrl
    },
    cors: getCorsConfig(),
    s3: getS3BackendConfig(),
    cloudFront: getCloudFrontBackendConfig()
  };
};
