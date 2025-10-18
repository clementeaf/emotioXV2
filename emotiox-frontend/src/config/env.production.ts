/**
 * Production Environment Configuration
 * Production-ready configuration with secure defaults
 */

export const productionEnv = {
  // Core Configuration
  NODE_ENV: 'production',
  STAGE: 'prod',
  SERVICE_NAME: 'emotioxv2',
  APP_REGION: 'us-east-1',

  // API Configuration
  API_ENDPOINT: 'https://api.emotiox.com',
  API_TIMEOUT: '30000',
  API_RETRIES: '3',

  // Database Tables (Production)
  USER_TABLE: 'emotioxv2-users-prod',
  DYNAMODB_TABLE: 'emotioxv2-main-prod',
  PARTICIPANT_TABLE: 'emotioxv2-participants-prod',
  MODULE_RESPONSES_TABLE: 'emotioxv2-module-responses-prod',
  QUOTA_RECORDS_TABLE: 'emotioxv2-quota-records-prod',
  EDUCATIONAL_CONTENT_TABLE: 'emotioxv2-educational-content-prod',

  // IAT Tables
  IAT_TEST_CONFIG_TABLE: 'emotioxv2-iat-test-configs-prod',
  IAT_SESSION_TABLE: 'emotioxv2-iat-sessions-prod',
  IAT_RESULTS_TABLE: 'emotioxv2-iat-results-prod',
  IAT_ANALYSIS_TABLE: 'emotioxv2-iat-analysis-prod',
  IAT_INTEGRATION_TABLE: 'emotioxv2-iat-integration-prod',

  // Eye Tracking Tables
  EYE_TRACKING_SESSIONS_TABLE: 'emotioxv2-eye-tracking-sessions-prod',
  EYE_TRACKING_ANALYSES_TABLE: 'emotioxv2-eye-tracking-analyses-prod',
  IAT_EYE_TRACKING_CONFIGS_TABLE: 'emotioxv2-iat-eye-tracking-configs-prod',
  IAT_EYE_TRACKING_RESULTS_TABLE: 'emotioxv2-iat-eye-tracking-results-prod',

  // Other Tables
  LOCATION_TRACKING_TABLE: 'location-tracking-table-prod',
  RECRUITMENT_LINK_TABLE: 'emotioxv2-recruitment-links-prod',
  EYETRACKING_RECRUIT_CONFIG_TABLE: 'emotioxv2-eye-tracking-recruit-config-prod',
  EYETRACKING_RECRUIT_PARTICIPANT_TABLE: 'emotioxv2-eye-tracking-recruit-participant-prod',

  // Authentication (MUST be set via environment variables in production)
  JWT_SECRET: '', // MUST be provided via environment
  TOKEN_EXPIRATION: '604800',
  ALLOWED_ORIGIN: 'https://emotiox.com,https://www.emotiox.com',

  // Storage
  S3_BUCKET_NAME: 'emotioxv2-storage-prod',
  MAX_FILE_SIZE: '52428800', // 50MB
  ALLOWED_FILE_TYPES: 'image/jpeg,image/png,image/gif,application/pdf,text/plain',

  // Email
  EMAIL_FROM: 'noreply@emotiox.com',
  EMAIL_TO: 'admin@emotiox.com',

  // WebSocket
  WEBSOCKET_ENDPOINT: 'wss://ws.emotiox.com',
  WEBSOCKET_API_ENDPOINT: 'https://ws-api.emotiox.com',

  // Public Tests
  PUBLIC_TESTS_URL: 'https://tests.emotiox.com',
  PUBLIC_TESTS_ENABLED: 'true',
} as const;
