/**
 * 🚀 EmotioXV2 Shared - Tipos Centralizados del Backend
 * 
 * Tipos compartidos entre backend, frontend y public-tests
 * para asegurar consistencia y tipado estricto
 * 
 * ❌ PROHIBIDO usar tipos 'any' o 'unknown' 
 * ✅ OBLIGATORIO usar tipos específicos siempre
 */

// =====================================
// 🔐 TIPOS DE AUTENTICACIÓN
// =====================================
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'researcher' | 'user' | 'participant';
}

export interface AuthResult {
  user: AuthenticatedUser;
  token: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// =====================================
// 🏢 TIPOS DE EMPRESA
// =====================================
export interface Company {
  id?: string;
  name: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompanyRequest {
  name: string;
  status?: 'active' | 'inactive';
}

export interface UpdateCompanyRequest {
  name?: string;
  status?: 'active' | 'inactive';
}

// =====================================
// 🔬 TIPOS DE INVESTIGACIÓN
// =====================================
export enum ResearchType {
  EYE_TRACKING = 'eye-tracking',
  ATTENTION_PREDICTION = 'attention-prediction',
  COGNITIVE_ANALYSIS = 'cognitive-analysis',
  BEHAVIOURAL = 'behavioural'
}

export enum ResearchStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export interface Research {
  id?: string;
  name: string;
  companyId: string;
  enterprise?: string;
  type: ResearchType;
  technique: string;
  description?: string;
  targetParticipants?: number;
  objectives?: string[];
  tags?: string[];
  status?: ResearchStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateResearchRequest {
  name: string;
  companyId: string;
  enterprise?: string;
  type: ResearchType;
  technique: string;
  description?: string;
  targetParticipants?: number;
  objectives?: string[];
  tags?: string[];
}

// =====================================
// 👥 TIPOS DE PARTICIPANTE
// =====================================
export interface Participant {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateParticipantRequest {
  name: string;
  email: string;
}

// =====================================
// 📊 TIPOS DE PROGRESO
// =====================================
export type ParticipantStatus = 'Por iniciar' | 'En proceso' | 'Completado' | 'Abandonado';

export interface ParticipantWithStatus {
  id: string;
  name: string;
  email: string;
  status: ParticipantStatus;
  progress: number;
  duration: string;
  lastActivity: string;
}

export interface OverviewMetrics {
  totalParticipants: number;
  completedParticipants: number;
  inProgressParticipants: number;
  pendingParticipants: number;
  averageDuration: {
    minutes: number;
    seconds: number;
    formatted: string;
  };
  lastActivity: string;
  completionRate: number;
}

// =====================================
// 📋 TIPOS DE FORMULARIOS
// =====================================
export interface FormQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  isRequired: boolean;
  order: number;
}

export enum QuestionType {
  TEXT = 'text',
  NUMBER = 'number',
  EMAIL = 'email',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  TEXTAREA = 'textarea',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime'
}

export interface Form {
  id: string;
  name: string;
  researchId: string;
  questions: FormQuestion[];
  order: number;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

// =====================================
// 📊 TIPOS DE RESPUESTAS
// =====================================
export interface ModuleResponseData {
  questionId: string;
  questionText: string;
  answer: string | number | boolean | string[];
  timestamp: string;
}

export interface ModuleResponse {
  id: string;
  researchId: string;
  participantId: string;
  moduleType: string;
  responses: ModuleResponseData[];
  createdAt: string;
  updatedAt: string;
}

// =====================================
// 👁️ TIPOS DE EYE TRACKING
// =====================================
export enum EyeTrackingStatus {
  PENDING = 'pending',
  CALIBRATING = 'calibrating',
  RECORDING = 'recording',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface GazePoint {
  timestamp: string;
  x: number;
  y: number;
  confidence: number;
  leftPupilSize?: number;
  rightPupilSize?: number;
}

export interface CalibrationPoint {
  x: number;
  y: number;
  accuracy: number;
}

export interface CalibrationData {
  points: CalibrationPoint[];
  accuracy: number;
  precision: number;
  timestamp: string;
}

export interface EyeTrackingSession {
  id: string;
  participantId: string;
  researchId: string;
  status: EyeTrackingStatus;
  startTime?: string;
  endTime?: string;
  calibrationData?: CalibrationData;
  gazeData: GazePoint[];
  createdAt: string;
  updatedAt: string;
}

// =====================================
// 🎯 TIPOS DE TAREAS COGNITIVAS
// =====================================
export enum CognitiveTaskType {
  ATTENTION = 'attention',
  MEMORY = 'memory',
  REACTION_TIME = 'reaction-time',
  VISUAL_SEARCH = 'visual-search',
  STROOP = 'stroop',
  N_BACK = 'n-back'
}

export interface CognitiveQuestion {
  id: string;
  stimulus: string;
  correctAnswer: string | number;
  distractors?: string[];
  timeLimit?: number;
  order: number;
}

export interface CognitiveTaskConfig {
  timeLimit?: number;
  randomizeOrder: boolean;
  showFeedback: boolean;
  maxAttempts?: number;
}

export interface CognitiveTask {
  id: string;
  name: string;
  type: CognitiveTaskType;
  questions: CognitiveQuestion[];
  config: CognitiveTaskConfig;
  createdAt: string;
  updatedAt: string;
}

// =====================================
// 📄 TIPOS DE PANTALLAS
// =====================================
export interface WelcomeScreen {
  id: string;
  researchId: string;
  title: string;
  content: string;
  showContinueButton: boolean;
  autoAdvanceTime?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ThankYouScreen {
  id: string;
  researchId: string;
  title: string;
  content: string;
  showBackButton: boolean;
  redirectUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// =====================================
// 🛠️ TIPOS DE API
// =====================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  name: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// =====================================
// 🔍 TIPOS DE FILTROS
// =====================================
export interface SearchFilters {
  query?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  companyId?: string;
  userId?: string;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

// =====================================
// 📊 TIPOS DE MÉTRICAS
// =====================================
export interface ResearchMetrics {
  totalParticipants: number;
  completedSessions: number;
  averageCompletionTime: number;
  completionRate: number;
  lastActivity: string;
}

export interface ParticipantMetrics {
  totalSessions: number;
  completedTasks: number;
  averageScore: number;
  totalTimeSpent: number;
  lastSession: string;
}

// =====================================
// 🔄 TIPOS DE ESTADO DEL SISTEMA
// =====================================
export enum SystemStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export interface HealthCheck {
  status: SystemStatus;
  timestamp: string;
  services: {
    database: SystemStatus;
    storage: SystemStatus;
    websocket: SystemStatus;
    authentication: SystemStatus;
  };
  version: string;
  uptime: number;
}

// =====================================
// 🗂️ TIPOS DE ARCHIVOS
// =====================================
export interface StoredFile {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  bucket: string;
  key: string;
  uploadedBy: string;
  createdAt: string;
}

// =====================================
// 🔗 TIPOS DE RELACIONES
// =====================================
export interface ResearchWithCompany extends Research {
  company: Company;
}

export interface ParticipantWithSessions extends Participant {
  sessions: EyeTrackingSession[];
  totalSessions: number;
  completedSessions: number;
}

export interface ResearchWithMetrics extends Research {
  metrics: ResearchMetrics;
  participants: Participant[];
  forms: Form[];
}

// =====================================
// ✅ GUARD TYPES - Para validación de tipos
// =====================================
export const isValidResearchType = (type: string): type is ResearchType => {
  return Object.values(ResearchType).includes(type as ResearchType);
};

export const isValidResearchStatus = (status: string): status is ResearchStatus => {
  return Object.values(ResearchStatus).includes(status as ResearchStatus);
};

export const isValidQuestionType = (type: string): type is QuestionType => {
  return Object.values(QuestionType).includes(type as QuestionType);
};

export const isValidSystemStatus = (status: string): status is SystemStatus => {
  return Object.values(SystemStatus).includes(status as SystemStatus);
};

export const isValidParticipantStatus = (status: string): status is ParticipantStatus => {
  return ['Por iniciar', 'En proceso', 'Completado', 'Abandonado'].includes(status);
};