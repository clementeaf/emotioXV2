/**
 * Research Types - Centralized type definitions for research functionality
 * Re-exports from shared interfaces and defines frontend-specific types
 */

// Simple re-exports to avoid conflicts
export * from '../../../shared/interfaces/research.interface';
export * from '../../../shared/interfaces/research.model';

// Type alias for extended research (non-conflicting)
export type ResearchWithExtensions = ResearchRecord & {
  title?: string;
  technique?: string;
}

// Additional frontend-specific types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  success: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Research list and pagination types
export interface ResearchListResponse {
  researches: ResearchRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilterParams {
  status?: ResearchStatus;
  type?: ResearchType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UpdateResearchRequest {
  id: string;
  updates: Partial<CreateResearchRequest>;
}

// SmartVOC types
export interface SmartVOCFormData {
  questions: Array<{
    id: string;
    text: string;
    type: string;
    required?: boolean;
    options?: string[];
  }>;
  enabled: boolean;
}

export interface SmartVOCResponse {
  questionKey: string;
  response: string | number | string[];
  participantId: string;
  participantName: string;
  timestamp: string;
}

export interface VOCResponse {
  text: string;
  participantId: string;
  participantName: string;
  timestamp?: string;
}

export interface QuestionWithResponses {
  questionKey: string;
  questionText: string;
  questionType: string;
  responses: QuestionResponse[];
}

export interface QuestionResponse {
  participantId: string;
  response: any;
  value: string | number | string[] | Record<string, unknown>;
  timestamp?: string;
  metadata?: any;
}

export interface GroupedResponsesResponse {
  researchId: string;
  questions: QuestionWithResponses[];
  total: number;
  participantCount: number;
}

// Emotion and sentiment types
export type EmotionType = 'positive' | 'negative' | 'neutral';

export type PositiveEmotion = 
  | 'Feliz' 
  | 'Satisfecho' 
  | 'Confiado' 
  | 'Valorado' 
  | 'Cuidado' 
  | 'Seguro'
  | 'Enfocado' 
  | 'Indulgente' 
  | 'Estimulado' 
  | 'Exploratorio' 
  | 'Interesado' 
  | 'Enérgico';

export type NegativeEmotion = 
  | 'Descontento' 
  | 'Frustrado' 
  | 'Irritado' 
  | 'Decepción' 
  | 'Estresado' 
  | 'Infeliz' 
  | 'Desatendido' 
  | 'Apresurado';

export type ImpactLevel = 'Alto' | 'Medio' | 'Bajo';
export type TrendDirection = 'Positiva' | 'Neutral' | 'Negativa';

// Data processing result types
export interface SmartVOCResults {
  totalResponses: number;
  uniqueParticipants: number;
  npsScore: number;
  csatScores: number[];
  cesScores: number[];
  nevScores: number[];
  cvScores: number[];
  vocResponses: VOCResponse[];
  smartVOCResponses: SmartVOCResponse[];
}

export interface CPVData {
  cpvValue: number;
  satisfaction: number;
  retention: number;
  impact: ImpactLevel;
  trend: TrendDirection;
  csatPercentage: number;
  cesPercentage: number;
  cvValue: number;
  nevValue: number;
  npsValue: number;
  peakValue: number;
}

export interface TrustFlowData {
  stage: string;
  nps: number;
  nev: number;
  timestamp: string;
}