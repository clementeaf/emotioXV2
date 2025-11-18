/**
 * Screener Domain Types
 * Type definitions for screener functionality
 */

export interface ScreenerOption {
  id: string;
  label: string;
  value: string;
  eligibility: 'qualify' | 'disqualify';
}

export interface ScreenerQuestion {
  id: string;
  questionText: string;
  questionType: 'single_choice' | 'multiple_choice' | 'short_text' | 'long_text' | 'linear_scale' | 'ranking' | 'navigation_flow' | 'preference_test';
  required: boolean;
  options?: ScreenerOption[];
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  order: number;
  description?: string;
  answerPlaceholder?: string;
  scaleConfig?: {
    startValue: number;
    endValue: number;
    startLabel?: string;
    endLabel?: string;
  };
}

export interface ScreenerFormData {
  researchId: string;
  isEnabled: boolean;
  title: string;
  description: string;
  questions: ScreenerQuestion[];
  randomizeQuestions: boolean;
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
  randomizeQuestions: boolean;
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
  randomizeQuestions: boolean;
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
  randomizeQuestions?: boolean;
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

