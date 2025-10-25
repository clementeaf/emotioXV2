/**
 * Screen Forms Domain Types
 * Type definitions for welcome screen and thank you screen functionality
 */

// Re-export from shared interfaces
export type {
  ThankYouScreenModel,
  ThankYouScreenFormData,
  ThankYouScreenConfig
} from '../../../../../shared/interfaces/thank-you-screen.interface';

// API Response wrapper
export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

// Request types for API (works for both welcome and thank you screens)
export interface CreateScreenFormRequest {
  researchId: string;
  isEnabled: boolean;
  title: string;
  message: string;
  redirectUrl?: string; // For thank you screen
  buttonText?: string;  // For welcome screen
  metadata?: {
    version?: string;
    [key: string]: any;
  };
}

export interface UpdateScreenFormRequest {
  isEnabled?: boolean;
  title?: string;
  message?: string;
  redirectUrl?: string; // For thank you screen
  buttonText?: string;  // For welcome screen
  metadata?: {
    version?: string;
    [key: string]: any;
  };
}

// Validation response
export interface ValidationResponse {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}
