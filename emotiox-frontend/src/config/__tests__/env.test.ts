import { describe, it, expect, vi } from 'vitest';
import { envValidator } from '../envValidator';

// Mock environment variables
const mockEnv = {
  NODE_ENV: 'development',
  STAGE: 'dev',
  SERVICE_NAME: 'emotioxv2',
  APP_REGION: 'us-east-1',
  API_ENDPOINT: 'http://localhost:3000',
  API_TIMEOUT: '30000',
  API_RETRIES: '3',
  USER_TABLE: 'emotioxv2-users-dev',
  PARTICIPANT_TABLE: 'emotioxv2-participants-dev',
  MODULE_RESPONSES_TABLE: 'emotioxv2-module-responses-dev',
  QUOTA_RECORDS_TABLE: 'emotioxv2-quota-records-dev',
  EDUCATIONAL_CONTENT_TABLE: 'emotioxv2-educational-content-dev',
  IAT_TEST_CONFIG_TABLE: 'emotioxv2-iat-test-configs-dev',
  IAT_SESSION_TABLE: 'emotioxv2-iat-sessions-dev',
  IAT_RESULTS_TABLE: 'emotioxv2-iat-results-dev',
  IAT_ANALYSIS_TABLE: 'emotioxv2-iat-analysis-dev',
  IAT_INTEGRATION_TABLE: 'emotioxv2-iat-integration-dev',
  EYE_TRACKING_SESSIONS_TABLE: 'emotioxv2-eye-tracking-sessions-dev',
  EYE_TRACKING_ANALYSES_TABLE: 'emotioxv2-eye-tracking-analyses-dev',
  IAT_EYE_TRACKING_CONFIGS_TABLE: 'emotioxv2-iat-eye-tracking-configs-dev',
  IAT_EYE_TRACKING_RESULTS_TABLE: 'emotioxv2-iat-eye-tracking-results-dev',
  LOCATION_TRACKING_TABLE: 'location-tracking-table',
  RECRUITMENT_LINK_TABLE: 'emotioxv2-recruitment-links-dev',
  EYETRACKING_RECRUIT_CONFIG_TABLE: 'emotioxv2-eye-tracking-recruit-config-dev',
  EYETRACKING_RECRUIT_PARTICIPANT_TABLE: 'emotioxv2-eye-tracking-recruit-participant-dev',
  JWT_SECRET: 'mi-clave-secreta-para-firmar-tokens-dev-only',
  TOKEN_EXPIRATION: '604800',
  ALLOWED_ORIGIN: 'http://localhost:11500,http://localhost:3000,http://localhost:4700',
  S3_BUCKET_NAME: 'emotioxv2-storage-dev',
  MAX_FILE_SIZE: '10485760',
  ALLOWED_FILE_TYPES: 'image/jpeg,image/png,image/gif,application/pdf',
  EMAIL_FROM: 'noreply@emotiox.dev',
  EMAIL_TO: 'admin@emotiox.dev',
  WEBSOCKET_ENDPOINT: 'ws://localhost:3001',
  WEBSOCKET_API_ENDPOINT: 'http://localhost:3001',
  PUBLIC_TESTS_URL: 'http://localhost:4700',
  PUBLIC_TESTS_ENABLED: 'true',
};

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Reset environment variables
    envValidator.reset();
    
    // Mock import.meta.env and process.env
    vi.stubGlobal('import', {
      meta: {
        env: mockEnv,
      },
    });
    
    vi.stubGlobal('process', {
      env: mockEnv,
    });
  });

  it('validates environment configuration successfully', () => {
    const config = envValidator.validate();
    
    expect(config.environment).toBe('development');
    expect(config.stage).toBe('dev');
    expect(config.serviceName).toBe('emotioxv2');
    expect(config.region).toBe('us-east-1');
  });

  it('validates API configuration', () => {
    const config = envValidator.validate();
    
    expect(config.api.baseUrl).toBe('http://localhost:3000');
    expect(config.api.timeout).toBe(30000);
    expect(config.api.retries).toBe(3);
  });

  it('validates database configuration', () => {
    const config = envValidator.validate();
    
    expect(config.database.region).toBe('us-east-1');
    expect(config.database.tables.users).toBe('emotioxv2-users-dev');
    expect(config.database.tables.participants).toBe('emotioxv2-participants-dev');
  });

  it('validates authentication configuration', () => {
    const config = envValidator.validate();
    
    expect(config.auth.jwtSecret).toBe('mi-clave-secreta-para-firmar-tokens-dev-only');
    expect(config.auth.tokenExpiration).toBe(604800);
    expect(config.auth.allowedOrigins).toEqual([
      'http://localhost:11500',
      'http://localhost:3000',
      'http://localhost:4700'
    ]);
  });

  it('validates storage configuration', () => {
    const config = envValidator.validate();
    
    expect(config.storage.s3Bucket).toBe('emotioxv2-storage-dev');
    expect(config.storage.region).toBe('us-east-1');
    expect(config.storage.maxFileSize).toBe(10485760);
    expect(config.storage.allowedFileTypes).toEqual([
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ]);
  });

  it('validates email configuration', () => {
    const config = envValidator.validate();
    
    expect(config.email.from).toBe('noreply@emotiox.dev');
    expect(config.email.to).toBe('admin@emotiox.dev');
    expect(config.email.region).toBe('us-east-1');
  });

  it('validates WebSocket configuration', () => {
    const config = envValidator.validate();
    
    expect(config.websocket.endpoint).toBe('ws://localhost:3001');
    expect(config.websocket.apiEndpoint).toBe('http://localhost:3001');
  });

  it('validates public tests configuration', () => {
    const config = envValidator.validate();
    
    expect(config.publicTests.url).toBe('http://localhost:4700');
    expect(config.publicTests.enabled).toBe(true);
  });

  it('validates JWT secret length', () => {
    const config = envValidator.validate();
    expect(config.auth.jwtSecret.length).toBeGreaterThanOrEqual(32);
  });

  it('validates API URL format', () => {
    const config = envValidator.validate();
    expect(config.api.baseUrl).toMatch(/^https?:\/\//);
  });

  it('validates email format', () => {
    const config = envValidator.validate();
    expect(config.email.from).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(config.email.to).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it('validates timeout range', () => {
    const config = envValidator.validate();
    expect(config.api.timeout).toBeGreaterThanOrEqual(1000);
    expect(config.api.timeout).toBeLessThanOrEqual(300000);
  });

  it('validates file size range', () => {
    const config = envValidator.validate();
    expect(config.storage.maxFileSize).toBeGreaterThanOrEqual(1024);
    expect(config.storage.maxFileSize).toBeLessThanOrEqual(104857600);
  });

  it('uses default values when variables are missing', () => {
    vi.stubGlobal('import', {
      meta: {
        env: {
          NODE_ENV: 'development',
          STAGE: 'dev',
          SERVICE_NAME: 'emotioxv2',
          APP_REGION: 'us-east-1',
          API_ENDPOINT: 'http://localhost:3000',
          USER_TABLE: 'emotioxv2-users-dev',
          PARTICIPANT_TABLE: 'emotioxv2-participants-dev',
          MODULE_RESPONSES_TABLE: 'emotioxv2-module-responses-dev',
          QUOTA_RECORDS_TABLE: 'emotioxv2-quota-records-dev',
          EDUCATIONAL_CONTENT_TABLE: 'emotioxv2-educational-content-dev',
          IAT_TEST_CONFIG_TABLE: 'emotioxv2-iat-test-configs-dev',
          IAT_SESSION_TABLE: 'emotioxv2-iat-sessions-dev',
          IAT_RESULTS_TABLE: 'emotioxv2-iat-results-dev',
          IAT_ANALYSIS_TABLE: 'emotioxv2-iat-analysis-dev',
          IAT_INTEGRATION_TABLE: 'emotioxv2-iat-integration-dev',
          EYE_TRACKING_SESSIONS_TABLE: 'emotioxv2-eye-tracking-sessions-dev',
          EYE_TRACKING_ANALYSES_TABLE: 'emotioxv2-eye-tracking-analyses-dev',
          IAT_EYE_TRACKING_CONFIGS_TABLE: 'emotioxv2-iat-eye-tracking-configs-dev',
          IAT_EYE_TRACKING_RESULTS_TABLE: 'emotioxv2-iat-eye-tracking-results-dev',
          LOCATION_TRACKING_TABLE: 'location-tracking-table',
          RECRUITMENT_LINK_TABLE: 'emotioxv2-recruitment-links-dev',
          EYETRACKING_RECRUIT_CONFIG_TABLE: 'emotioxv2-eye-tracking-recruit-config-dev',
          EYETRACKING_RECRUIT_PARTICIPANT_TABLE: 'emotioxv2-eye-tracking-recruit-participant-dev',
          JWT_SECRET: 'mi-clave-secreta-para-firmar-tokens-dev-only',
          S3_BUCKET_NAME: 'emotioxv2-storage-dev',
          EMAIL_FROM: 'noreply@emotiox.dev',
          EMAIL_TO: 'admin@emotiox.dev',
          WEBSOCKET_ENDPOINT: 'ws://localhost:3001',
          WEBSOCKET_API_ENDPOINT: 'http://localhost:3001',
          PUBLIC_TESTS_URL: 'http://localhost:4700',
        },
      },
    });

    const config = envValidator.validate();
    
    // Should use defaults for missing variables
    expect(config.api.timeout).toBe(30000);
    expect(config.api.retries).toBe(3);
    expect(config.auth.tokenExpiration).toBe(604800);
    expect(config.storage.maxFileSize).toBe(10485760);
    expect(config.publicTests.enabled).toBe(true);
  });

  it('validates array environment variables', () => {
    const config = envValidator.validate();
    
    expect(config.auth.allowedOrigins).toEqual([
      'http://localhost:11500',
      'http://localhost:3000',
      'http://localhost:4700'
    ]);
    
    expect(config.storage.allowedFileTypes).toEqual([
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ]);
  });

  it('validates boolean environment variables', () => {
    const config = envValidator.validate();
    
    expect(config.publicTests.enabled).toBe(true);
  });

  it('validates number environment variables', () => {
    const config = envValidator.validate();
    
    expect(config.api.timeout).toBe(30000);
    expect(config.api.retries).toBe(3);
    expect(config.auth.tokenExpiration).toBe(604800);
    expect(config.storage.maxFileSize).toBe(10485760);
  });

  it('checks if configuration is valid', () => {
    expect(envValidator.isValid()).toBe(true);
  });

  it('handles validation errors gracefully', () => {
    const errors = envValidator.getValidationErrors();
    expect(Array.isArray(errors)).toBe(true);
  });

  it('resets configuration', () => {
    envValidator.reset();
    expect(envValidator.isValid()).toBe(true);
  });
});
