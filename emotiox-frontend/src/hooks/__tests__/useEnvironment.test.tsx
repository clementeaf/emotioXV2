import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useEnvironment,
  useApiConfig,
  useDatabaseConfig,
  useAuthConfig,
  useStorageConfig,
  useEmailConfig,
  useWebSocketConfig,
  usePublicTestsConfig,
  useEnvironmentCheck,
  useEnvironmentConfig,
} from '../useEnvironment';

// Mock the config module
vi.mock('../../config', () => ({
  env: {
    environment: 'development',
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
      jwtSecret: 'mi-clave-secreta-para-firmar-tokens-dev-only',
      tokenExpiration: 604800,
      allowedOrigins: ['http://localhost:11500', 'http://localhost:3000', 'http://localhost:4700'],
    },
    storage: {
      s3Bucket: 'emotioxv2-storage-dev',
      region: 'us-east-1',
      maxFileSize: 10485760,
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    },
    email: {
      from: 'noreply@emotiox.dev',
      to: 'admin@emotiox.dev',
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
  },
  envInfo: {
    environment: 'development',
    stage: 'dev',
    serviceName: 'emotioxv2',
    region: 'us-east-1',
    nodeEnv: 'development',
    isDevelopment: true,
    isProduction: false,
    isStaging: false,
  },
  getApiUrl: vi.fn((path: string) => `http://localhost:3000${path}`),
  getWebSocketUrl: vi.fn((path: string) => `ws://localhost:3001${path}`),
  getTableName: vi.fn((tableKey: string) => `emotioxv2-${tableKey}-dev`),
  getS3Url: vi.fn((key: string) => `https://emotioxv2-storage-dev.s3.us-east-1.amazonaws.com/${key}`),
}));

describe('useEnvironment Hook', () => {
  it('returns environment configuration', () => {
    const { result } = renderHook(() => useEnvironment());
    
    expect(result.current.config).toBeDefined();
    expect(result.current.isDevelopment).toBe(true);
    expect(result.current.isProduction).toBe(false);
    expect(result.current.isStaging).toBe(false);
    expect(result.current.stage).toBe('dev');
    expect(result.current.region).toBe('us-east-1');
    expect(result.current.serviceName).toBe('emotioxv2');
  });

  it('returns API configuration', () => {
    const { result } = renderHook(() => useApiConfig());
    
    expect(result.current.baseUrl).toBe('http://localhost:3000');
    expect(result.current.timeout).toBe(30000);
    expect(result.current.retries).toBe(3);
    expect(result.current.getUrl).toBeDefined();
  });

  it('returns database configuration', () => {
    const { result } = renderHook(() => useDatabaseConfig());
    
    expect(result.current.region).toBe('us-east-1');
    expect(result.current.tables.users).toBe('emotioxv2-users-dev');
    expect(result.current.tables.participants).toBe('emotioxv2-participants-dev');
    expect(result.current.getTableName).toBeDefined();
  });

  it('returns authentication configuration', () => {
    const { result } = renderHook(() => useAuthConfig());
    
    expect(result.current.jwtSecret).toBe('mi-clave-secreta-para-firmar-tokens-dev-only');
    expect(result.current.tokenExpiration).toBe(604800);
    expect(result.current.allowedOrigins).toEqual([
      'http://localhost:11500',
      'http://localhost:3000',
      'http://localhost:4700'
    ]);
  });

  it('returns storage configuration', () => {
    const { result } = renderHook(() => useStorageConfig());
    
    expect(result.current.s3Bucket).toBe('emotioxv2-storage-dev');
    expect(result.current.region).toBe('us-east-1');
    expect(result.current.maxFileSize).toBe(10485760);
    expect(result.current.allowedFileTypes).toEqual([
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ]);
    expect(result.current.getS3Url).toBeDefined();
  });

  it('returns email configuration', () => {
    const { result } = renderHook(() => useEmailConfig());
    
    expect(result.current.from).toBe('noreply@emotiox.dev');
    expect(result.current.to).toBe('admin@emotiox.dev');
    expect(result.current.region).toBe('us-east-1');
  });

  it('returns WebSocket configuration', () => {
    const { result } = renderHook(() => useWebSocketConfig());
    
    expect(result.current.endpoint).toBe('ws://localhost:3001');
    expect(result.current.apiEndpoint).toBe('http://localhost:3001');
    expect(result.current.getUrl).toBeDefined();
  });

  it('returns public tests configuration', () => {
    const { result } = renderHook(() => usePublicTestsConfig());
    
    expect(result.current.url).toBe('http://localhost:4700');
    expect(result.current.enabled).toBe(true);
  });

  it('returns environment check information', () => {
    const { result } = renderHook(() => useEnvironmentCheck());
    
    expect(result.current.isDevelopment).toBe(true);
    expect(result.current.isProduction).toBe(false);
    expect(result.current.isStaging).toBe(false);
    expect(result.current.environment).toBe('development');
    expect(result.current.stage).toBe('dev');
  });

  it('returns specific environment configuration section', () => {
    const { result: apiResult } = renderHook(() => useEnvironmentConfig('api'));
    const { result: dbResult } = renderHook(() => useEnvironmentConfig('database'));
    
    expect(apiResult.current.baseUrl).toBe('http://localhost:3000');
    expect(dbResult.current.region).toBe('us-east-1');
  });

  it('memoizes results correctly', () => {
    const { result, rerender } = renderHook(() => useEnvironment());
    
    const firstResult = result.current;
    rerender();
    const secondResult = result.current;
    
    // Results should be memoized and identical
    expect(firstResult).toBe(secondResult);
  });

  it('provides utility functions', () => {
    const { result } = renderHook(() => useEnvironment());
    
    expect(result.current.getApiUrl).toBeDefined();
    expect(result.current.getWebSocketUrl).toBeDefined();
    expect(result.current.getTableName).toBeDefined();
    expect(result.current.getS3Url).toBeDefined();
  });

  it('provides quick access to common values', () => {
    const { result } = renderHook(() => useEnvironment());
    
    expect(result.current.apiUrl).toBe('http://localhost:3000');
    expect(result.current.websocketUrl).toBe('ws://localhost:3001');
    expect(result.current.stage).toBe('dev');
    expect(result.current.region).toBe('us-east-1');
    expect(result.current.serviceName).toBe('emotioxv2');
  });
});
