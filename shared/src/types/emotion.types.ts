import { z } from 'zod';

// Enums
export enum EmotionIntensity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum EmotionCategory {
  BASIC = 'BASIC',
  COMPLEX = 'COMPLEX',
  SOCIAL = 'SOCIAL'
}

// Base interfaces
export interface EmotionBase {
  name: string;
  description: string;
  intensity: EmotionIntensity;
  category: EmotionCategory;
  tags: string[];
}

export interface Emotion extends EmotionBase {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface CreateEmotionDto extends EmotionBase {}
export interface UpdateEmotionDto extends Partial<EmotionBase> {}

// Validation schemas
export const emotionBaseSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().min(10).max(500),
  intensity: z.nativeEnum(EmotionIntensity),
  category: z.nativeEnum(EmotionCategory),
  tags: z.array(z.string().min(2).max(20)).min(1).max(5)
});

export const createEmotionSchema = emotionBaseSchema;
export const updateEmotionSchema = emotionBaseSchema.partial();

// Type guards
export const isEmotionIntensity = (value: unknown): value is EmotionIntensity =>
  typeof value === 'string' && Object.values(EmotionIntensity).includes(value as EmotionIntensity);

export const isEmotionCategory = (value: unknown): value is EmotionCategory =>
  typeof value === 'string' && Object.values(EmotionCategory).includes(value as EmotionCategory); 