import { z } from 'zod';
import { Emotion } from './emotion.types';

// WebSocket Events
export enum WebSocketEvent {
  PING = 'PING',
  PONG = 'PONG',
  UNKNOWN = 'UNKNOWN',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
  ERROR = 'ERROR',

  // Authentication events
  TOKEN_UPDATE = 'token.update',

  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',

  // Emotion events
  EMOTION_CREATED = 'emotion.created',
  EMOTION_UPDATED = 'emotion.updated',
  EMOTION_DELETED = 'emotion.deleted',

  // 🎯 MONITORING EVENTS (from public-tests)
  MONITORING_CONNECT = 'MONITORING_CONNECT',
  PARTICIPANT_LOGIN = 'PARTICIPANT_LOGIN',
  PARTICIPANT_STEP = 'PARTICIPANT_STEP',
  PARTICIPANT_DISQUALIFIED = 'PARTICIPANT_DISQUALIFIED',
  PARTICIPANT_QUOTA_EXCEEDED = 'PARTICIPANT_QUOTA_EXCEEDED',
  PARTICIPANT_COMPLETED = 'PARTICIPANT_COMPLETED',
  PARTICIPANT_ERROR = 'PARTICIPANT_ERROR',
  PARTICIPANT_RESPONSE_SAVED = 'PARTICIPANT_RESPONSE_SAVED'
}

// Message Interfaces
export interface WebSocketMessage<T = unknown> {
  event: WebSocketEvent;
  data: T;
}

// Response Types
export interface TokenRefreshResponse {
  token: string;
}

export interface EmotionChangeMessage {
  emotion: Emotion;
}

export interface ErrorMessage {
  code: string;
  message: string;
}

// 🎯 MONITORING EVENT INTERFACES
export interface MonitoringConnectData {
  researchId: string;
  timestamp: string;
}

export interface ParticipantLoginData {
  researchId: string;
  participantId: string;
  email?: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ParticipantStepData {
  researchId: string;
  participantId: string;
  stepName: string;
  stepNumber: number;
  totalSteps: number;
  progress: number;
  timestamp: string;
  duration?: number;
}

export interface ParticipantResponseSavedData {
  researchId: string;
  participantId: string;
  questionKey: string;
  response: any;
  timestamp: string;
  stepNumber: number;
  totalSteps: number;
  progress: number;
}

// Configuration
export interface WebSocketConfig {
  url: string;
  token?: string;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  path?: string;
  reconnection?: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
  };
}

// Validation Schemas
export const webSocketConfigSchema = z.object({
  url: z.string(),
  token: z.string().optional(),
  cors: z.object({
    origin: z.array(z.string()),
    credentials: z.boolean()
  }),
  path: z.string().optional(),
  reconnection: z.object({
    maxAttempts: z.number().min(1).default(5),
    baseDelay: z.number().min(100).default(1000),
    maxDelay: z.number().min(1000).default(30000)
  }).optional()
});

export const tokenRefreshResponseSchema = z.object({
  token: z.string()
});

export const errorMessageSchema = z.object({
  code: z.string(),
  message: z.string()
});

// Type Guards
export const isWebSocketEvent = (value: unknown): value is WebSocketEvent =>
  typeof value === 'string' && Object.values(WebSocketEvent).includes(value as WebSocketEvent);

export const isWebSocketMessage = <T>(value: unknown): value is WebSocketMessage<T> =>
  typeof value === 'object' &&
  value !== null &&
  'event' in value &&
  'data' in value &&
  isWebSocketEvent((value as WebSocketMessage<T>).event);
