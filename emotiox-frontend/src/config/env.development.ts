/**
 * Development Environment Configuration
 * Safe defaults for local development
 */

export const developmentEnv = {
  // Core Configuration
  NODE_ENV: 'development',
  STAGE: 'dev',
  SERVICE_NAME: 'emotioxv2',
  APP_REGION: 'us-east-1',

  // API Configuration
  API_ENDPOINT: 'http://localhost:3000',
  API_TIMEOUT: '30000',
  API_RETRIES: '3',

  // Database Tables (Development)
  USER_TABLE: 'emotioxv2-users-dev',
  DYNAMODB_TABLE: 'emotioxv2-main-dev',
  PARTICIPANT_TABLE: 'emotioxv2-participants-dev',
  MODULE_RESPONSES_TABLE: 'emotioxv2-module-responses-dev',
  QUOTA_RECORDS_TABLE: 'emotioxv2-quota-records-dev',
  EDUCATIONAL_CONTENT_TABLE: 'emotioxv2-educational-content-dev',

  // IAT Tables
  IAT_TEST_CONFIG_TABLE: 'emotioxv2-iat-test-configs-dev',
  IAT_SESSION_TABLE: 'emotioxv2-iat-sessions-dev',
  IAT_RESULTS_TABLE: 'emotioxv2-iat-results-dev',
  IAT_ANALYSIS_TABLE: 'emotioxv2-iat-analysis-dev',
  IAT_INTEGRATION_TABLE: 'emotioxv2-iat-integration-dev',

  // Eye Tracking Tables
  EYE_TRACKING_SESSIONS_TABLE: 'emotioxv2-eye-tracking-sessions-dev',
  EYE_TRACKING_ANALYSES_TABLE: 'emotioxv2-eye-tracking-analyses-dev',
  IAT_EYE_TRACKING_CONFIGS_TABLE: 'emotioxv2-iat-eye-tracking-configs-dev',
  IAT_EYE_TRACKING_RESULTS_TABLE: 'emotioxv2-iat-eye-tracking-results-dev',

  // Other Tables
  LOCATION_TRACKING_TABLE: 'location-tracking-table',
  RECRUITMENT_LINK_TABLE: 'emotioxv2-recruitment-links-dev',
  EYETRACKING_RECRUIT_CONFIG_TABLE: 'emotioxv2-eye-tracking-recruit-config-dev',
  EYETRACKING_RECRUIT_PARTICIPANT_TABLE: 'emotioxv2-eye-tracking-recruit-participant-dev',

  // Authentication
  JWT_SECRET: 'mi-clave-secreta-para-firmar-tokens-dev-only',
  TOKEN_EXPIRATION: '604800',
  ALLOWED_ORIGIN: 'http://localhost:11500,http://localhost:3000,http://localhost:4700',

  // Storage
  S3_BUCKET_NAME: 'emotioxv2-storage-dev',
  MAX_FILE_SIZE: '10485760',
  ALLOWED_FILE_TYPES: 'image/jpeg,image/png,image/gif,application/pdf',

  // Email
  EMAIL_FROM: 'noreply@emotiox.dev',
  EMAIL_TO: 'admin@emotiox.dev',

  // WebSocket
  WEBSOCKET_ENDPOINT: 'ws://localhost:3001',
  WEBSOCKET_API_ENDPOINT: 'http://localhost:3001',

  // Public Tests
  PUBLIC_TESTS_URL: 'http://localhost:4700',
  PUBLIC_TESTS_ENABLED: 'true',
} as const;
