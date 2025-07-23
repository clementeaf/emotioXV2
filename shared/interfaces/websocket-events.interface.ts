/**
 * Interfaces para eventos de monitoreo en tiempo real
 * Comunicación entre public-tests y dashboard
 */

// 🎯 EVENTOS DE CONEXIÓN
export interface MonitoringConnectEvent {
  type: 'MONITORING_CONNECT';
  data: {
    researchId: string;
    timestamp: string;
  };
}

// 🎯 EVENTOS DE PARTICIPANTES
export interface ParticipantLoginEvent {
  type: 'PARTICIPANT_LOGIN';
  data: {
    researchId: string;
    participantId: string;
    email?: string;
    timestamp: string;
    userAgent?: string;
    ipAddress?: string;
  };
}

export interface ParticipantStepEvent {
  type: 'PARTICIPANT_STEP';
  data: {
    researchId: string;
    participantId: string;
    stepName: string;
    stepNumber: number;
    totalSteps: number;
    progress: number; // 0-100
    timestamp: string;
    duration?: number; // tiempo en el step anterior
  };
}

export interface ParticipantDisqualifiedEvent {
  type: 'PARTICIPANT_DISQUALIFIED';
  data: {
    researchId: string;
    participantId: string;
    reason: string;
    demographicData: Record<string, string>;
    timestamp: string;
    disqualificationType: 'demographics' | 'quota' | 'manual';
  };
}

export interface ParticipantQuotaExceededEvent {
  type: 'PARTICIPANT_QUOTA_EXCEEDED';
  data: {
    researchId: string;
    participantId: string;
    quotaType: 'age' | 'country' | 'gender' | 'educationLevel' | 'householdIncome' | 'employmentStatus' | 'dailyHoursOnline' | 'technicalProficiency';
    quotaValue: string;
    currentCount: number;
    maxQuota: number;
    demographicData: Record<string, string>;
    timestamp: string;
  };
}

export interface ParticipantCompletedEvent {
  type: 'PARTICIPANT_COMPLETED';
  data: {
    researchId: string;
    participantId: string;
    totalDuration: number;
    timestamp: string;
    responsesCount: number;
  };
}

export interface ParticipantErrorEvent {
  type: 'PARTICIPANT_ERROR';
  data: {
    researchId: string;
    participantId: string;
    error: string;
    stepName?: string;
    timestamp: string;
  };
}

// 🎯 EVENTO PARA RESPUESTAS GUARDADAS
export interface ParticipantResponseSavedEvent {
  type: 'PARTICIPANT_RESPONSE_SAVED';
  data: {
    researchId: string;
    participantId: string;
    questionKey: string;
    response: any;
    timestamp: string;
    stepNumber: number;
    totalSteps: number;
    progress: number;
  };
}

// 🎯 UNION DE TODOS LOS EVENTOS
export type MonitoringEvent =
  | MonitoringConnectEvent
  | ParticipantLoginEvent
  | ParticipantStepEvent
  | ParticipantDisqualifiedEvent
  | ParticipantQuotaExceededEvent
  | ParticipantCompletedEvent
  | ParticipantErrorEvent
  | ParticipantResponseSavedEvent;

// 🎯 INTERFACES PARA ESTADO DEL DASHBOARD
export interface ParticipantStatus {
  participantId: string;
  email?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'disqualified' | 'error';
  currentStep?: string;
  progress: number;
  lastActivity: string;
  duration?: number;
  disqualificationReason?: string;
  quotaExceeded?: {
    type: string;
    value: string;
  };
}

export interface ResearchMonitoringData {
  researchId: string;
  participants: ParticipantStatus[];
  totalParticipants: number;
  activeParticipants: number;
  completedParticipants: number;
  disqualifiedParticipants: number;
  averageProgress: number;
  lastUpdate: string;
}

// 🎯 CONFIGURACIÓN DE WEBSOCKET
export interface WebSocketMonitoringConfig {
  researchId: string;
  enabled: boolean;
  events: {
    login: boolean;
    step: boolean;
    disqualification: boolean;
    quotaExceeded: boolean;
    completion: boolean;
    errors: boolean;
  };
}
