/**
 * Environment Variables Configuration
 * Centralized environment variables management with type safety
 */

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// API Configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

// Database Configuration
export interface DatabaseConfig {
  region: string;
  tables: {
    users: string;
    participants: string;
    moduleResponses: string;
    quotaRecords: string;
    educationalContent: string;
    iatTestConfigs: string;
    iatSessions: string;
    iatResults: string;
    iatAnalysis: string;
    iatIntegration: string;
    eyeTrackingSessions: string;
    eyeTrackingAnalyses: string;
    iatEyeTrackingConfigs: string;
    iatEyeTrackingResults: string;
    locationTracking: string;
    recruitmentLinks: string;
    eyeTrackingRecruitConfig: string;
    eyeTrackingRecruitParticipant: string;
  };
}

// Authentication Configuration
export interface AuthConfig {
  jwtSecret: string;
  tokenExpiration: number;
  allowedOrigins: string[];
}

// Storage Configuration
export interface StorageConfig {
  s3Bucket: string;
  region: string;
  maxFileSize: number;
  allowedFileTypes: string[];
}

// Email Configuration
export interface EmailConfig {
  from: string;
  to: string;
  region: string;
}

// WebSocket Configuration
export interface WebSocketConfig {
  endpoint: string;
  apiEndpoint: string;
}

// Public Tests Configuration
export interface PublicTestsConfig {
  url: string;
  enabled: boolean;
}

// Main Environment Configuration
export interface EnvironmentConfig {
  environment: Environment;
  stage: string;
  serviceName: string;
  region: string;
  nodeEnv: string;
  api: ApiConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  storage: StorageConfig;
  email: EmailConfig;
  websocket: WebSocketConfig;
  publicTests: PublicTestsConfig;
}

// Environment variable names
export const ENV_VARS = {
  // Core
  NODE_ENV: 'NODE_ENV',
  STAGE: 'STAGE',
  SERVICE_NAME: 'SERVICE_NAME',
  APP_REGION: 'APP_REGION',
  
  // API
  API_ENDPOINT: 'API_ENDPOINT',
  API_TIMEOUT: 'API_TIMEOUT',
  API_RETRIES: 'API_RETRIES',
  
  // Database
  USER_TABLE: 'USER_TABLE',
  DYNAMODB_TABLE: 'DYNAMODB_TABLE',
  PARTICIPANT_TABLE: 'PARTICIPANT_TABLE',
  MODULE_RESPONSES_TABLE: 'MODULE_RESPONSES_TABLE',
  QUOTA_RECORDS_TABLE: 'QUOTA_RECORDS_TABLE',
  EDUCATIONAL_CONTENT_TABLE: 'EDUCATIONAL_CONTENT_TABLE',
  
  // IAT Tables
  IAT_TEST_CONFIG_TABLE: 'IAT_TEST_CONFIG_TABLE',
  IAT_SESSION_TABLE: 'IAT_SESSION_TABLE',
  IAT_RESULTS_TABLE: 'IAT_RESULTS_TABLE',
  IAT_ANALYSIS_TABLE: 'IAT_ANALYSIS_TABLE',
  IAT_INTEGRATION_TABLE: 'IAT_INTEGRATION_TABLE',
  
  // Eye Tracking Tables
  EYE_TRACKING_SESSIONS_TABLE: 'EYE_TRACKING_SESSIONS_TABLE',
  EYE_TRACKING_ANALYSES_TABLE: 'EYE_TRACKING_ANALYSES_TABLE',
  IAT_EYE_TRACKING_CONFIGS_TABLE: 'IAT_EYE_TRACKING_CONFIGS_TABLE',
  IAT_EYE_TRACKING_RESULTS_TABLE: 'IAT_EYE_TRACKING_RESULTS_TABLE',
  
  // Other Tables
  LOCATION_TRACKING_TABLE: 'LOCATION_TRACKING_TABLE',
  RECRUITMENT_LINK_TABLE: 'RECRUITMENT_LINK_TABLE',
  EYETRACKING_RECRUIT_CONFIG_TABLE: 'EYETRACKING_RECRUIT_CONFIG_TABLE',
  EYETRACKING_RECRUIT_PARTICIPANT_TABLE: 'EYETRACKING_RECRUIT_PARTICIPANT_TABLE',
  
  // Auth
  JWT_SECRET: 'JWT_SECRET',
  TOKEN_EXPIRATION: 'TOKEN_EXPIRATION',
  ALLOWED_ORIGIN: 'ALLOWED_ORIGIN',
  
  // Storage
  S3_BUCKET_NAME: 'S3_BUCKET_NAME',
  MAX_FILE_SIZE: 'MAX_FILE_SIZE',
  ALLOWED_FILE_TYPES: 'ALLOWED_FILE_TYPES',
  
  // Email
  EMAIL_FROM: 'EMAIL_FROM',
  EMAIL_TO: 'EMAIL_TO',
  
  // WebSocket
  WEBSOCKET_ENDPOINT: 'WEBSOCKET_ENDPOINT',
  WEBSOCKET_API_ENDPOINT: 'WEBSOCKET_API_ENDPOINT',
  
  // Public Tests
  PUBLIC_TESTS_URL: 'PUBLIC_TESTS_URL',
  PUBLIC_TESTS_ENABLED: 'PUBLIC_TESTS_ENABLED',
} as const;

// Default values for development
export const DEFAULT_VALUES = {
  environment: 'development' as Environment,
  stage: 'dev',
  serviceName: 'emotioxv2',
  region: 'us-east-1',
  nodeEnv: 'development',
  api: {
    baseUrl: 'http://localhost:3000',
    timeout: 30000,
    retries: 3,
  },
  database: {
    region: 'us-east-1',
    tables: {
      users: 'emotioxv2-users-dev',
      participants: 'emotioxv2-participants-dev',
      moduleResponses: 'emotioxv2-module-responses-dev',
      quotaRecords: 'emotioxv2-quota-records-dev',
      educationalContent: 'emotioxv2-educational-content-dev',
      iatTestConfigs: 'emotioxv2-iat-test-configs-dev',
      iatSessions: 'emotioxv2-iat-sessions-dev',
      iatResults: 'emotioxv2-iat-results-dev',
      iatAnalysis: 'emotioxv2-iat-analysis-dev',
      iatIntegration: 'emotioxv2-iat-integration-dev',
      eyeTrackingSessions: 'emotioxv2-eye-tracking-sessions-dev',
      eyeTrackingAnalyses: 'emotioxv2-eye-tracking-analyses-dev',
      iatEyeTrackingConfigs: 'emotioxv2-iat-eye-tracking-configs-dev',
      iatEyeTrackingResults: 'emotioxv2-iat-eye-tracking-results-dev',
      locationTracking: 'location-tracking-table',
      recruitmentLinks: 'emotioxv2-recruitment-links-dev',
      eyeTrackingRecruitConfig: 'emotioxv2-eye-tracking-recruit-config-dev',
      eyeTrackingRecruitParticipant: 'emotioxv2-eye-tracking-recruit-participant-dev',
    },
  },
  auth: {
    jwtSecret: 'mi-clave-secreta-para-firmar-tokens',
    tokenExpiration: 604800, // 7 days
    allowedOrigins: ['*'],
  },
  storage: {
    s3Bucket: 'emotioxv2-storage-dev',
    region: 'us-east-1',
    maxFileSize: 10485760, // 10MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  },
  email: {
    from: 'noreply@emotiox.com',
    to: 'admin@emotiox.com',
    region: 'us-east-1',
  },
  websocket: {
    endpoint: 'ws://localhost:3001',
    apiEndpoint: 'http://localhost:3001',
  },
  publicTests: {
    url: 'http://localhost:4700',
    enabled: true,
  },
} as const;
