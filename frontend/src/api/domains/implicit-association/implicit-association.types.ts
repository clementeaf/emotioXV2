/**
 * Implicit Association Domain Types
 * Type definitions for implicit association functionality
 */

import type { HitZone } from 'shared/interfaces/cognitive-task.interface';

export interface Target {
  id: string;
  title: string;
  description: string;
  type: string;
  required: boolean;
  showConditionally: boolean;
  deviceFrame: boolean;
  files: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    s3Key: string;
  }>;
  hitZones: HitZone[];
}

export interface Attribute {
  id: string;
  order: number;
  name: string;
}

export interface ImplicitAssociationFormData {
  researchId: string;
  isRequired: boolean;
  targets: Target[];
  attributes: Attribute[];
  exerciseInstructions: string;
  testInstructions: string;
  testConfiguration: string;
  showResults: boolean;
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
    [key: string]: unknown;
  };
}

export interface ImplicitAssociationModel {
  id: string;
  researchId: string;
  isRequired: boolean;
  targets: Target[];
  attributes: Attribute[];
  exerciseInstructions: string;
  testInstructions: string;
  testConfiguration: string;
  showResults: boolean;
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

export interface CreateImplicitAssociationRequest {
  researchId: string;
  isRequired: boolean;
  targets: Target[];
  attributes: Attribute[];
  exerciseInstructions: string;
  testInstructions: string;
  testConfiguration: string;
  showResults: boolean;
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
    [key: string]: unknown;
  };
}

export interface UpdateImplicitAssociationRequest {
  isRequired?: boolean;
  targets?: Target[];
  attributes?: Attribute[];
  exerciseInstructions?: string;
  testInstructions?: string;
  testConfiguration?: string;
  showResults?: boolean;
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

