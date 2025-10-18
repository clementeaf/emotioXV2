/**
 * Environment Variables Validator
 * Validates and parses environment variables with proper error handling
 */

import { z } from 'zod';
import type { Environment, EnvironmentConfig } from './env';

// Zod schemas for validation
const EnvironmentSchema = z.enum(['development', 'staging', 'production']);

const ApiConfigSchema = z.object({
  baseUrl: z.string(),
  timeout: z.number().min(1000).max(300000), // 1s to 5min
  retries: z.number().min(0).max(10),
});

const DatabaseConfigSchema = z.object({
  region: z.string().min(1),
  tables: z.object({
    users: z.string().min(1),
    participants: z.string().min(1),
    moduleResponses: z.string().min(1),
    quotaRecords: z.string().min(1),
    educationalContent: z.string().min(1),
    iatTestConfigs: z.string().min(1),
    iatSessions: z.string().min(1),
    iatResults: z.string().min(1),
    iatAnalysis: z.string().min(1),
    iatIntegration: z.string().min(1),
    eyeTrackingSessions: z.string().min(1),
    eyeTrackingAnalyses: z.string().min(1),
    iatEyeTrackingConfigs: z.string().min(1),
    iatEyeTrackingResults: z.string().min(1),
    locationTracking: z.string().min(1),
    recruitmentLinks: z.string().min(1),
    eyeTrackingRecruitConfig: z.string().min(1),
    eyeTrackingRecruitParticipant: z.string().min(1),
  }),
});

const AuthConfigSchema = z.object({
  jwtSecret: z.string().min(32), // Minimum 32 characters for security
  tokenExpiration: z.number().min(300).max(31536000), // 5min to 1 year
  allowedOrigins: z.array(z.string()),
});

const StorageConfigSchema = z.object({
  s3Bucket: z.string().min(1),
  region: z.string().min(1),
  maxFileSize: z.number().min(1024).max(104857600), // 1KB to 100MB
  allowedFileTypes: z.array(z.string()),
});

const EmailConfigSchema = z.object({
  from: z.string().email(),
  to: z.string().email(),
  region: z.string().min(1),
});

const WebSocketConfigSchema = z.object({
  endpoint: z.string().url(),
  apiEndpoint: z.string().url(),
});

const PublicTestsConfigSchema = z.object({
  url: z.string().url(),
  enabled: z.boolean(),
});

const EnvironmentConfigSchema = z.object({
  environment: EnvironmentSchema,
  stage: z.string().min(1),
  serviceName: z.string().min(1),
  region: z.string().min(1),
  nodeEnv: z.string().min(1),
  api: ApiConfigSchema,
  database: DatabaseConfigSchema,
  auth: AuthConfigSchema,
  storage: StorageConfigSchema,
  email: EmailConfigSchema,
  websocket: WebSocketConfigSchema,
  publicTests: PublicTestsConfigSchema,
});

// Custom error class for environment validation
export class EnvironmentValidationError extends Error {
  constructor(message: string, public readonly errors: string[]) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

// Environment variable parser
export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private config: EnvironmentConfig | null = null;

  private constructor() {}

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  /**
   * Get environment variable with fallback
   */
  private getEnvVar(key: string, fallback?: string): string {
    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';
    
    let value: string | undefined;
    
    if (isBrowser) {
      // In browser, only use import.meta.env
      value = import.meta.env[key];
    } else {
      // In Node.js, try both import.meta.env and process.env
      value = import.meta.env[key] || process.env[key];
    }
    
    // Use fallback if no value found
    value = value || fallback;
    
    if (!value) {
      throw new EnvironmentValidationError(
        `Missing required environment variable: ${key}`,
        [key]
      );
    }
    return value;
  }

  /**
   * Get boolean environment variable
   */
  private getBooleanEnvVar(key: string, fallback: boolean = false): boolean {
    const value = this.getEnvVar(key, fallback.toString());
    return value.toLowerCase() === 'true';
  }

  /**
   * Get number environment variable
   */
  private getNumberEnvVar(key: string, fallback: number): number {
    const value = this.getEnvVar(key, fallback.toString());
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new EnvironmentValidationError(
        `Invalid number for environment variable: ${key}`,
        [key]
      );
    }
    return parsed;
  }

  /**
   * Get array environment variable (comma-separated)
   */
  private getArrayEnvVar(key: string, fallback: string[]): string[] {
    const value = this.getEnvVar(key, fallback.join(','));
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }

  /**
   * Validate and parse environment variables
   */
  public validate(): EnvironmentConfig {
    if (this.config) {
      return this.config;
    }

    try {
      const rawConfig = {
        environment: this.getEnvVar('NODE_ENV', 'development') as Environment,
        stage: this.getEnvVar('STAGE', 'dev'),
        serviceName: this.getEnvVar('SERVICE_NAME', 'emotioxv2'),
        region: this.getEnvVar('APP_REGION', 'us-east-1'),
        nodeEnv: this.getEnvVar('NODE_ENV', 'development'),
        api: {
          baseUrl: this.getEnvVar('API_ENDPOINT', 'http://localhost:3000'),
          timeout: this.getNumberEnvVar('API_TIMEOUT', 30000),
          retries: this.getNumberEnvVar('API_RETRIES', 3),
        },
        database: {
          region: this.getEnvVar('APP_REGION', 'us-east-1'),
          tables: {
            users: this.getEnvVar('USER_TABLE', 'emotioxv2-users-dev'),
            participants: this.getEnvVar('PARTICIPANT_TABLE', 'emotioxv2-participants-dev'),
            moduleResponses: this.getEnvVar('MODULE_RESPONSES_TABLE', 'emotioxv2-module-responses-dev'),
            quotaRecords: this.getEnvVar('QUOTA_RECORDS_TABLE', 'emotioxv2-quota-records-dev'),
            educationalContent: this.getEnvVar('EDUCATIONAL_CONTENT_TABLE', 'emotioxv2-educational-content-dev'),
            iatTestConfigs: this.getEnvVar('IAT_TEST_CONFIG_TABLE', 'emotioxv2-iat-test-configs-dev'),
            iatSessions: this.getEnvVar('IAT_SESSION_TABLE', 'emotioxv2-iat-sessions-dev'),
            iatResults: this.getEnvVar('IAT_RESULTS_TABLE', 'emotioxv2-iat-results-dev'),
            iatAnalysis: this.getEnvVar('IAT_ANALYSIS_TABLE', 'emotioxv2-iat-analysis-dev'),
            iatIntegration: this.getEnvVar('IAT_INTEGRATION_TABLE', 'emotioxv2-iat-integration-dev'),
            eyeTrackingSessions: this.getEnvVar('EYE_TRACKING_SESSIONS_TABLE', 'emotioxv2-eye-tracking-sessions-dev'),
            eyeTrackingAnalyses: this.getEnvVar('EYE_TRACKING_ANALYSES_TABLE', 'emotioxv2-eye-tracking-analyses-dev'),
            iatEyeTrackingConfigs: this.getEnvVar('IAT_EYE_TRACKING_CONFIGS_TABLE', 'emotioxv2-iat-eye-tracking-configs-dev'),
            iatEyeTrackingResults: this.getEnvVar('IAT_EYE_TRACKING_RESULTS_TABLE', 'emotioxv2-iat-eye-tracking-results-dev'),
            locationTracking: this.getEnvVar('LOCATION_TRACKING_TABLE', 'location-tracking-table'),
            recruitmentLinks: this.getEnvVar('RECRUITMENT_LINK_TABLE', 'emotioxv2-recruitment-links-dev'),
            eyeTrackingRecruitConfig: this.getEnvVar('EYETRACKING_RECRUIT_CONFIG_TABLE', 'emotioxv2-eye-tracking-recruit-config-dev'),
            eyeTrackingRecruitParticipant: this.getEnvVar('EYETRACKING_RECRUIT_PARTICIPANT_TABLE', 'emotioxv2-eye-tracking-recruit-participant-dev'),
          },
        },
        auth: {
          jwtSecret: this.getEnvVar('JWT_SECRET', 'mi-clave-secreta-para-firmar-tokens'),
          tokenExpiration: this.getNumberEnvVar('TOKEN_EXPIRATION', 604800),
          allowedOrigins: this.getArrayEnvVar('ALLOWED_ORIGIN', ['*']),
        },
        storage: {
          s3Bucket: this.getEnvVar('S3_BUCKET_NAME', 'emotioxv2-storage-dev'),
          region: this.getEnvVar('APP_REGION', 'us-east-1'),
          maxFileSize: this.getNumberEnvVar('MAX_FILE_SIZE', 10485760),
          allowedFileTypes: this.getArrayEnvVar('ALLOWED_FILE_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']),
        },
        email: {
          from: this.getEnvVar('EMAIL_FROM', 'noreply@emotiox.com'),
          to: this.getEnvVar('EMAIL_TO', 'admin@emotiox.com'),
          region: this.getEnvVar('APP_REGION', 'us-east-1'),
        },
        websocket: {
          endpoint: this.getEnvVar('WEBSOCKET_ENDPOINT', 'ws://localhost:3001'),
          apiEndpoint: this.getEnvVar('WEBSOCKET_API_ENDPOINT', 'http://localhost:3001'),
        },
        publicTests: {
          url: this.getEnvVar('PUBLIC_TESTS_URL', 'http://localhost:4700'),
          enabled: this.getBooleanEnvVar('PUBLIC_TESTS_ENABLED', true),
        },
      };

      // Validate the configuration
      const validatedConfig = EnvironmentConfigSchema.parse(rawConfig);
      this.config = validatedConfig;
      return validatedConfig;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
        throw new EnvironmentValidationError(
          'Environment configuration validation failed',
          errors
        );
      }
      throw error;
    }
  }

  /**
   * Get current configuration (validates if not already done)
   */
  public getConfig(): EnvironmentConfig {
    return this.validate();
  }

  /**
   * Check if configuration is valid
   */
  public isValid(): boolean {
    try {
      this.validate();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get validation errors
   */
  public getValidationErrors(): string[] {
    try {
      this.validate();
      return [];
    } catch (error) {
      if (error instanceof EnvironmentValidationError) {
        return error.errors;
      }
      return ['Unknown validation error'];
    }
  }

  /**
   * Reset configuration (useful for testing)
   */
  public reset(): void {
    this.config = null;
  }
}

// Export singleton instance
export const envValidator = EnvironmentValidator.getInstance();
