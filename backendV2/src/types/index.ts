/**
 * 🚀 EmotioXV2 Backend - Tipos Centralizados
 * 
 * Este archivo centraliza todos los tipos y interfaces del backend
 * para asegurar tipado estricto y consistencia entre módulos.
 * 
 * ❌ PROHIBIDO usar tipos 'any' o 'unknown' 
 * ✅ OBLIGATORIO usar tipos específicos siempre
 */

// =====================================
// 🔐 TIPOS DE AUTENTICACIÓN Y ADMIN
// =====================================
export * from './auth.types';

// =====================================
// 🌐 TIPOS DE WEBSOCKET
// =====================================
export * from './websocket';

// =====================================
// 📈 TIPOS DE PROGRESO DE INVESTIGACIÓN
// =====================================
export * from './research-progress.types';

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

export interface CompanyDynamoItem {
  id: string;
  sk: string;
  userId: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  EntityType: string;
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

export interface NewResearch {
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
}

export interface NewResearchDynamoItem {
  id: string;
  sk: string;
  userId: string;
  name: string;
  companyId: string;
  type: string;
  technique: string;
  description: string;
  targetParticipants: number;
  objectives: string;
  tags: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  EntityType: string;
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

export interface UpdateResearchRequest {
  name?: string;
  companyId?: string;
  enterprise?: string;
  type?: ResearchType;
  technique?: string;
  description?: string;
  targetParticipants?: number;
  objectives?: string[];
  tags?: string[];
  status?: ResearchStatus;
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

export interface ParticipantResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// =====================================
// 📊 TIPOS DE RESPUESTAS DE MÓDULOS
// =====================================
export interface ModuleResponse {
  id: string;
  researchId: string;
  participantId: string;
  moduleType: string;
  responses: ModuleResponseData[];
  createdAt: string;
  updatedAt: string;
}

export interface ModuleResponseData {
  questionId: string;
  questionText: string;
  answer: string | number | boolean | string[];
  timestamp: string;
}

export interface CreateModuleResponseRequest {
  researchId: string;
  participantId: string;
  moduleType: string;
  responses: ModuleResponseData[];
}

// =====================================
// 📝 TIPOS DE FORMULARIOS
// =====================================
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

// =====================================
// 🎯 TIPOS DE TAREAS COGNITIVAS
// =====================================
export interface CognitiveTask {
  id: string;
  name: string;
  type: CognitiveTaskType;
  questions: CognitiveQuestion[];
  config: CognitiveTaskConfig;
  createdAt: string;
  updatedAt: string;
}

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

// =====================================
// 👁️ TIPOS DE EYE TRACKING
// =====================================
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

export enum EyeTrackingStatus {
  PENDING = 'pending',
  CALIBRATING = 'calibrating',
  RECORDING = 'recording',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface CalibrationData {
  points: CalibrationPoint[];
  accuracy: number;
  precision: number;
  timestamp: string;
}

export interface CalibrationPoint {
  x: number;
  y: number;
  accuracy: number;
}

export interface GazePoint {
  timestamp: string;
  x: number;
  y: number;
  confidence: number;
  leftPupilSize?: number;
  rightPupilSize?: number;
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
// 🛠️ TIPOS DE UTILIDADES
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
// 🔍 TIPOS DE FILTROS Y BÚSQUEDA
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
// 📊 TIPOS DE MÉTRICAS Y ANALÍTICAS
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
// 🔄 TIPOS DE ESTADOS DE SISTEMA
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
// 🗂️ TIPOS DE ARCHIVOS Y STORAGE
// =====================================
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

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
export interface ResearchWithCompany extends NewResearch {
  company: Company;
}

export interface ParticipantWithSessions extends Participant {
  sessions: EyeTrackingSession[];
  totalSessions: number;
  completedSessions: number;
}

export interface ResearchWithMetrics extends NewResearch {
  metrics: ResearchMetrics;
  participants: Participant[];
  forms: Form[];
}

// =====================================
// 🏗️ TIPOS DE CONFIGURACIÓN
// =====================================
export interface DatabaseConfig {
  tableName: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
}

export interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  port: number;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  aws: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  database: DatabaseConfig;
}

// =====================================
// 🔒 TIPOS DE SEGURIDAD
// =====================================
export interface SecurityContext {
  userId: string;
  userRole: string;
  permissions: string[];
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
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