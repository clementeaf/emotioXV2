/**
 * Environment Configuration
 * Main configuration file that exports validated environment variables
 */

import { envValidator, EnvironmentValidationError } from './envValidator';
import type { EnvironmentConfig } from './env';

let config: EnvironmentConfig;

try {
  config = envValidator.validate();
} catch (error) {
  if (import.meta.env.DEV) {
    console.error('❌ Environment configuration error:', error);
    if (error instanceof EnvironmentValidationError) {
      console.error('Validation errors:', error.errors);
    }
  }
  
  throw new Error('Failed to load environment configuration');
}

export const env = config;

export const {
  environment,
  stage,
  serviceName,
  region,
  nodeEnv,
  api,
  database,
  auth,
  storage,
  email,
  websocket,
  publicTests,
} = config;

export const isDevelopment = environment === 'development';
export const isProduction = environment === 'production';
export const isStaging = environment === 'staging';

export const getApiUrl = (path: string = '') => {
  const baseUrl = api.baseUrl.endsWith('/') ? api.baseUrl.slice(0, -1) : api.baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const getWebSocketUrl = (path: string = '') => {
  const baseUrl = websocket.endpoint.endsWith('/') ? websocket.endpoint.slice(0, -1) : websocket.endpoint;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export const getTableName = (tableKey: keyof typeof database.tables) => {
  return database.tables[tableKey];
};

export const getS3Url = (key: string) => {
  return `https://${storage.s3Bucket}.s3.${storage.region}.amazonaws.com/${key}`;
};

export const envInfo = {
  environment,
  stage,
  serviceName,
  region,
  nodeEnv,
  isDevelopment,
  isProduction,
  isStaging,
} as const;

export { routes } from './routes';

export { mainNavigationItems, researchSections } from './navigation';
export type { NavigationItem, ResearchStage, ResearchSection } from './navigation';

if (import.meta.env.DEV) {
  (window as any).__EMOTIOX_ENV__ = {
    config,
    envInfo,
    getApiUrl,
    getWebSocketUrl,
    getTableName,
    getS3Url,
  };
}