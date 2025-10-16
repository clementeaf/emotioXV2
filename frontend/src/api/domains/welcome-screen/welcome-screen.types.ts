/**
 * Welcome Screen Domain Types
 * Type definitions for welcome screen functionality
 */

// Re-export from shared interfaces
export type {
  WelcomeScreenRecord,
  WelcomeScreenFormData,
  WelcomeScreenConfig,
  WelcomeScreenValidation,
  WelcomeScreenUpdate
} from '../../../../../shared/interfaces/welcome-screen.interface';

// API Response wrapper
export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

// Request types for API
export interface CreateWelcomeScreenRequest {
  researchId: string;
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText?: string;
  subtitle?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  theme?: string;
  disclaimer?: string;
  customCss?: string;
  metadata?: {
    version?: string;
    lastUpdated?: string;
    lastModifiedBy?: string;
  };
  questionKey: string;
}

export interface UpdateWelcomeScreenRequest {
  isEnabled?: boolean;
  title?: string;
  message?: string;
  startButtonText?: string;
  subtitle?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  theme?: string;
  disclaimer?: string;
  customCss?: string;
  metadata?: {
    version?: string;
    lastUpdated?: string;
    lastModifiedBy?: string;
  };
}

// Validation response
export interface ValidationResponse {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}