import { z } from 'zod';
import { User } from './user.types';

// Interfaces
export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RequestOTPDto {
  email: string;
}

export interface ValidateOTPDto {
  email: string;
  code: string;
}

// Zod schemas
export const requestOTPSchema = z.object({
  email: z.string().email('Invalid email format')
});

export const validateOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().length(6, 'Code must be exactly 6 digits').regex(/^\d+$/, 'Code must contain only numbers')
});

export const authResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email()
  })
});

// Type guards
export const isUser = (value: unknown): value is User => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    'createdAt' in value &&
    'updatedAt' in value
  );
}; 