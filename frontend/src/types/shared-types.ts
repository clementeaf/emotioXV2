// Tipos compartidos extraídos de @emotiox/shared para resolver dependencia local
// Este archivo reemplaza la dependencia que causaba fallos de build en AWS Amplify

// Tipos de emociones
export enum EmotionIntensity {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum EmotionCategory {
  JOY = 'joy',
  SADNESS = 'sadness',
  ANGER = 'anger',
  FEAR = 'fear',
  SURPRISE = 'surprise',
  DISGUST = 'disgust',
  NEUTRAL = 'neutral'
}

export interface Emotion {
  id: string;
  name: string;
  description: string;
  category: EmotionCategory;
  intensity: EmotionIntensity;
  tags: string[];
  timestamp: string;
  participantId: string;
  researchId: string;
}

// Tipos de WebSocket
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface WebSocketConnection {
  id: string;
  participantId?: string;
  researchId?: string;
  connectedAt: string;
  lastActivity: string;
}

// Tipos de autenticación
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'researcher' | 'participant';
  createdAt: string;
  updatedAt: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Tipos de investigación
export interface ResearchConfig {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  maxParticipants?: number;
  currentParticipants: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchRecord {
  id: string;
  config: ResearchConfig;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface ResearchFormData {
  name: string;
  description?: string;
  maxParticipants?: number;
}

export interface ResearchCreationResponse {
  success: boolean;
  researchId?: string;
  error?: string;
}

export interface ResearchUpdate {
  name?: string;
  description?: string;
  maxParticipants?: number;
  isActive?: boolean;
}

export const DEFAULT_RESEARCH_CONFIG: Partial<ResearchConfig> = {
  isActive: false,
  currentParticipants: 0
};

// Tipos de pantalla de bienvenida - Importados desde shared/
export {
  DEFAULT_WELCOME_SCREEN_CONFIG,
  DEFAULT_WELCOME_SCREEN_VALIDATION
} from '../../../shared/interfaces/welcome-screen.interface';

export type {
  WelcomeScreenConfig, WelcomeScreenFormData, WelcomeScreenRecord, WelcomeScreenValidation
} from '../../../shared/interfaces/welcome-screen.interface';
