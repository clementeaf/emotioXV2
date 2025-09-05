/**
 * 🚀 EmotioXV2 Backend - Tipos para Research In Progress
 * 
 * Tipos específicos para monitoreo y progreso de investigaciones
 * 
 * ❌ PROHIBIDO usar tipos 'any' o 'unknown' 
 * ✅ OBLIGATORIO usar tipos específicos siempre
 */

// =====================================
// 🎯 TIPOS DE ESTADO DE PARTICIPANTE
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

// =====================================
// 📊 TIPOS DE MÉTRICAS DE OVERVIEW
// =====================================
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
// 📈 TIPOS DE PROGRESO
// =====================================
export interface ProgressCalculation {
  responseTypes: string[];
  calculatedProgress: number;
  hasCompleted: boolean;
}

export const PROGRESS_MAP: Record<string, number> = {
  'demographics': 20,      // 20% por demográficos
  'welcome_screen': 40,    // 40% por pantalla de bienvenida
  'eye_tracking': 60,      // 60% por eye tracking
  'smart_voc': 80,         // 80% por smart VOC
  'cognitive_task': 90,    // 90% por tarea cognitiva
  'thank_you_screen': 100  // 100% por pantalla de agradecimiento
} as const;

// =====================================
// 🔍 TIPOS DE RESPUESTA DEL MÓDULO
// =====================================
export interface ModuleResponseItem {
  questionKey: string;
  timestamp: string;
  answer: string | number | boolean | string[];
  metadata?: Record<string, string | number | boolean>;
}

export interface ParticipantModuleResponse {
  participantId: string;
  researchId: string;
  responses: ModuleResponseItem[];
  createdAt: string;
  updatedAt: string;
}

// =====================================
// 📋 TIPOS DE DETALLE DE PARTICIPANTE
// =====================================
export interface DetailedParticipantProgress {
  participant: ParticipantWithStatus;
  moduleResponses: ModuleResponseItem[];
  timeline: ProgressTimelineEntry[];
  analytics: ParticipantAnalytics;
}

export interface ProgressTimelineEntry {
  timestamp: string;
  action: string;
  module: string;
  details: string;
  duration?: number;
}

export interface ParticipantAnalytics {
  totalTimeSpent: number; // en minutos
  modulesCompleted: string[];
  averageResponseTime: number; // en segundos
  engagementScore: number; // 0-100
}

// =====================================
// 🎯 TIPOS DE FILTROS Y BÚSQUEDA
// =====================================
export interface ProgressFilters {
  status?: ParticipantStatus[];
  progressMin?: number;
  progressMax?: number;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

export interface ProgressSortOptions {
  field: 'name' | 'email' | 'status' | 'progress' | 'lastActivity' | 'duration';
  order: 'asc' | 'desc';
}

// =====================================
// 📊 TIPOS DE ANALYTICS Y ESTADÍSTICAS
// =====================================
export interface ResearchAnalytics {
  participantFlow: {
    started: number;
    abandoned: number;
    completed: number;
    conversionRate: number;
  };
  modulePerformance: {
    [moduleName: string]: {
      completionRate: number;
      averageTime: number;
      abandonmentRate: number;
    };
  };
  timeAnalysis: {
    peakHours: number[];
    averageSessionDuration: number;
    fastestCompletion: number;
    slowestCompletion: number;
  };
}

// =====================================
// 🚨 TIPOS DE ERRORES ESPECÍFICOS
// =====================================
export interface ResearchProgressError extends Error {
  name: 'ResearchProgressError';
  message: string;
  code: 'RESEARCH_NOT_FOUND' | 'INVALID_FILTERS' | 'NO_DATA_AVAILABLE' | 'CALCULATION_ERROR';
  statusCode: number;
  details?: Record<string, string | number>;
}

// =====================================
// 🔧 TIPOS DE UTILIDADES
// =====================================
export interface DurationInfo {
  milliseconds: number;
  seconds: number;
  minutes: number;
  formatted: string;
}

export interface ActivityInfo {
  timestamp: string;
  formatted: string;
  isRecent: boolean;
  relativeTime: string;
}