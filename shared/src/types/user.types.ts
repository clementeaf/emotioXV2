import { z } from 'zod';

export interface User {
  id: string;
  name: string;
  email: string;
}

// Esquemas de validación
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email('Invalid email format')
});

// Type guard
export const isUser = (value: unknown): value is User => {
  return userSchema.safeParse(value).success;
}; 