/**
 * Screener Domain Types
 * Type definitions for screener functionality
 */

export interface ScreenerQuestion {
  id: string;
  questionText: string;
  questionType: 'single_choice' | 'multiple_choice' | 'short_text' | 'long_text' | 'linear_scale';
  required: boolean;
  options?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  order: number;
}

export interface ScreenerFormData {
  researchId: string;
  isEnabled: boolean;
  title: string;
  description: string;
  questions: ScreenerQuestion[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
    [key: string]: unknown;
  };
}

export interface ScreenerModel {
  id: string;
  researchId: string;
  isEnabled: boolean;
  title: string;
  description: string;
  questions: ScreenerQuestion[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
    [key: string]: unknown;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

export interface CreateScreenerRequest {
  researchId: string;
  isEnabled: boolean;
  title: string;
  description: string;
  questions: ScreenerQuestion[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
    [key: string]: unknown;
  };
}

export interface UpdateScreenerRequest {
  isEnabled?: boolean;
  title?: string;
  description?: string;
  questions?: ScreenerQuestion[];
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
    [key: string]: unknown;
  };
}

export interface ValidationResponse {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

