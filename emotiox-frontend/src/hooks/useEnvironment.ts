/**
 * useEnvironment Hook
 * React hook for accessing environment configuration
 */

import { useMemo } from 'react';
import { env, envInfo, getApiUrl, getWebSocketUrl, getTableName, getS3Url } from '../config';
import type { EnvironmentConfig } from '../config/env';

/**
 * Hook to access environment configuration
 */
export const useEnvironment = () => {
  return useMemo(() => ({
    config: env,
    ...envInfo,
    
    getApiUrl,
    getWebSocketUrl,
    getTableName,
    getS3Url,
    
    apiUrl: env.api.baseUrl,
    websocketUrl: env.websocket.endpoint,
    stage: env.stage,
    region: env.region,
    serviceName: env.serviceName,
  }), []);
};

/**
 * Hook to access API configuration
 */
export const useApiConfig = () => {
  return useMemo(() => ({
    baseUrl: env.api.baseUrl,
    timeout: env.api.timeout,
    retries: env.api.retries,
    getUrl: getApiUrl,
  }), []);
};

/**
 * Hook to access database configuration
 */
export const useDatabaseConfig = () => {
  return useMemo(() => ({
    region: env.database.region,
    tables: env.database.tables,
    getTableName,
  }), []);
};

/**
 * Hook to access authentication configuration
 */
export const useAuthConfig = () => {
  return useMemo(() => ({
    jwtSecret: env.auth.jwtSecret,
    tokenExpiration: env.auth.tokenExpiration,
    allowedOrigins: env.auth.allowedOrigins,
  }), []);
};

/**
 * Hook to access storage configuration
 */
export const useStorageConfig = () => {
  return useMemo(() => ({
    s3Bucket: env.storage.s3Bucket,
    region: env.storage.region,
    maxFileSize: env.storage.maxFileSize,
    allowedFileTypes: env.storage.allowedFileTypes,
    getS3Url,
  }), []);
};

/**
 * Hook to access email configuration
 */
export const useEmailConfig = () => {
  return useMemo(() => ({
    from: env.email.from,
    to: env.email.to,
    region: env.email.region,
  }), []);
};

/**
 * Hook to access WebSocket configuration
 */
export const useWebSocketConfig = () => {
  return useMemo(() => ({
    endpoint: env.websocket.endpoint,
    apiEndpoint: env.websocket.apiEndpoint,
    getUrl: getWebSocketUrl,
  }), []);
};

/**
 * Hook to access public tests configuration
 */
export const usePublicTestsConfig = () => {
  return useMemo(() => ({
    url: env.publicTests.url,
    enabled: env.publicTests.enabled,
  }), []);
};

/**
 * Hook to check if running in specific environment
 */
export const useEnvironmentCheck = () => {
  return useMemo(() => ({
    isDevelopment: envInfo.isDevelopment,
    isProduction: envInfo.isProduction,
    isStaging: envInfo.isStaging,
    environment: envInfo.environment,
    stage: envInfo.stage,
  }), []);
};

/**
 * Hook to get environment-specific configuration
 */
export const useEnvironmentConfig = <T extends keyof EnvironmentConfig>(
  section: T
): EnvironmentConfig[T] => {
  return useMemo(() => env[section], [section]);
};
