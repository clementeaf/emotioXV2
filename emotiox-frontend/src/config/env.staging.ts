/**
 * Staging Environment Configuration
 * Staging environment for testing before production
 */

export const stagingEnv = {
  // Core Configuration
  NODE_ENV: 'staging',
  STAGE: 'staging',
  SERVICE_NAME: 'emotioxv2',
  APP_REGION: 'us-east-1',

  // API Configuration
  API_ENDPOINT: 'https://api-staging.emotiox.com',
  API_TIMEOUT: '30000',
  API_RETRIES: '3',

  // Database Tables (Staging)
  USER_TABLE: 'emotioxv2-users-staging',
  DYNAMODB_TABLE: 'emotioxv2-main-staging',
  PARTICIPANT_TABLE: 'emotioxv2-participants-staging',
  MODULE_RESPONSES_TABLE: 'emotioxv2-module-responses-staging',
  QUOTA_RECORDS_TABLE: 'emotioxv2-quota-records-staging',
  EDUCATIONAL_CONTENT_TABLE: 'emotioxv2-educational-content-staging',

  // IAT Tables
  IAT_TEST_CONFIG_TABLE: 'emotioxv2-iat-test-configs-staging',
  IAT_SESSION_TABLE: 'emotioxv2-iat-sessions-staging',
  IAT_RESULTS_TABLE: 'emotioxv2-iat-results-staging',
  IAT_ANALYSIS_TABLE: 'emotioxv2-iat-analysis-staging',
  IAT_INTEGRATION_TABLE: 'emotioxv2-iat-integration-staging',

  // Eye Tracking Tables
  EYE_TRACKING_SESSIONS_TABLE: 'emotioxv2-eye-tracking-sessions-staging',
  EYE_TRACKING_ANALYSES_TABLE: 'emotioxv2-eye-tracking-analyses-staging',
  IAT_EYE_TRACKING_CONFIGS_TABLE: 'emotioxv2-iat-eye-tracking-configs-staging',
  IAT_EYE_TRACKING_RESULTS_TABLE: 'emotioxv2-iat-eye-tracking-results-staging',

  // Other Tables
  LOCATION_TRACKING_TABLE: 'location-tracking-table-staging',
  RECRUITMENT_LINK_TABLE: 'emotioxv2-recruitment-links-staging',
  EYETRACKING_RECRUIT_CONFIG_TABLE: 'emotioxv2-eye-tracking-recruit-config-staging',
  EYETRACKING_RECRUIT_PARTICIPANT_TABLE: 'emotioxv2-eye-tracking-recruit-participant-staging',

  // Authentication
  JWT_SECRET: '', // MUST be provided via environment
  TOKEN_EXPIRATION: '604800',
  ALLOWED_ORIGIN: 'https://staging.emotiox.com,https://api-staging.emotiox.com',

  // Storage
  S3_BUCKET_NAME: 'emotioxv2-storage-staging',
  MAX_FILE_SIZE: '31457280', // 30MB
  ALLOWED_FILE_TYPES: 'image/jpeg,image/png,image/gif,application/pdf',

  // Email
  EMAIL_FROM: 'noreply@staging.emotiox.com',
  EMAIL_TO: 'admin@staging.emotiox.com',

  // WebSocket
  WEBSOCKET_ENDPOINT: 'wss://ws-staging.emotiox.com',
  WEBSOCKET_API_ENDPOINT: 'https://ws-api-staging.emotiox.com',

  // Public Tests
  PUBLIC_TESTS_URL: 'https://tests-staging.emotiox.com',
  PUBLIC_TESTS_ENABLED: 'true',
} as const;
