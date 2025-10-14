/**
 * Tipos TypeScript para Eye Tracking con Eyedid SDK
 * Interfaces compartidas entre frontend y backend
 * Compatible con mobile devices (iOS, Android, Web)
 */

/**
 * Coordenadas de mirada del ojo
 */
export interface GazePoint {
  x: number;
  y: number;
  timestamp: number;
  leftEye?: {
    x: number;
    y: number;
    pupilSize: number;
    validity: number;
  };
  rightEye?: {
    x: number;
    y: number;
    pupilSize: number;
    validity: number;
  };
}

/**
 * Estado de conexión del eye tracker
 */
export type EyeTrackerStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'calibrating'
  | 'tracking'
  | 'error';

/**
 * Configuración del eye tracker (Eyedid SDK)
 */
export interface EyeTrackerConfig {
  deviceId?: string;
  sampleRate: number;
  enableCalibration: boolean;
  calibrationPoints: number;
  trackingMode: 'screen' | 'world';
  smoothing: boolean;
  smoothingFactor: number;
  // Eyedid SDK específico
  platform: 'ios' | 'android' | 'web' | 'unity' | 'windows';
  sdkVersion: string;
  apiKey?: string;
  enableRemoteTesting: boolean;
  enableHeatmaps: boolean;
  enableRealTimeInsights: boolean;
}

/**
 * Datos de calibración
 */
export interface CalibrationData {
  points: Array<{
    x: number;
    y: number;
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
  }>;
  accuracy: number;
  timestamp: number;
}

/**
 * Sesión de eye tracking
 */
export interface EyeTrackingSession {
  sessionId: string;
  participantId: string;
  testId?: string;
  startTime: string;
  endTime?: string;
  status: EyeTrackerStatus;
  config: EyeTrackerConfig;
  gazeData: GazePoint[];
  calibrationData?: CalibrationData;
  metadata: {
    deviceInfo: {
      screenWidth: number;
      screenHeight: number;
      devicePixelRatio: number;
      userAgent: string;
    };
    sessionDuration: number;
    totalGazePoints: number;
    averageAccuracy: number;
  };
}

/**
 * Análisis de fijación
 */
export interface FixationData {
  startTime: number;
  endTime: number;
  duration: number;
  x: number;
  y: number;
  confidence: number;
  areaOfInterest?: string;
}

/**
 * Análisis de saccade
 */
export interface SaccadeData {
  startTime: number;
  endTime: number;
  duration: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  amplitude: number;
  velocity: number;
  direction: number;
}

/**
 * Área de interés (AOI)
 */
export interface AreaOfInterest {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rectangle' | 'circle' | 'polygon';
  points?: Array<{ x: number; y: number }>;
}

/**
 * Métricas de atención
 */
export interface AttentionMetrics {
  totalFixations: number;
  averageFixationDuration: number;
  totalSaccades: number;
  averageSaccadeVelocity: number;
  scanPathLength: number;
  areasOfInterest: Array<{
    aoi: AreaOfInterest;
    fixationCount: number;
    totalTime: number;
    firstFixationTime: number;
  }>;
  heatMapData: Array<{
    x: number;
    y: number;
    intensity: number;
  }>;
}

/**
 * Resultados de análisis de eye tracking
 */
export interface EyeTrackingAnalysis {
  sessionId: string;
  participantId: string;
  analysisId: string;
  createdAt: string;
  fixations: FixationData[];
  saccades: SaccadeData[];
  attentionMetrics: AttentionMetrics;
  areasOfInterest: AreaOfInterest[];
  qualityMetrics: {
    dataLossRate: number;
    averageAccuracy: number;
    trackingStability: number;
    calibrationQuality: number;
  };
  recommendations: string[];
}

/**
 * Configuración de prueba IAT + Eye Tracking
 */
export interface IATEyeTrackingConfig {
  testId: string;
  name: string;
  description: string;
  iatConfig: {
    categories: {
      left: string[];
      right: string[];
    };
    attributes: {
      left: string[];
      right: string[];
    };
    blocks: Array<{
      type: string;
      trials: number;
      isPractice: boolean;
    }>;
  };
  eyeTrackingConfig: EyeTrackerConfig;
  areasOfInterest: AreaOfInterest[];
  analysisSettings: {
    fixationThreshold: number;
    saccadeThreshold: number;
    smoothingEnabled: boolean;
  };
}

/**
 * Resultados combinados IAT + Eye Tracking
 */
export interface IATEyeTrackingResults {
  sessionId: string;
  participantId: string;
  testId: string;
  iatResults: {
    dScore: number;
    interpretation: string;
    significance: boolean;
    effectSize: string;
  };
  eyeTrackingResults: EyeTrackingAnalysis;
  combinedAnalysis: {
    attentionBias: number;
    visualPreference: string;
    cognitiveLoad: number;
    engagementLevel: number;
  };
  createdAt: string;
}

/**
 * Eventos del eye tracker
 */
export interface EyeTrackerEvent {
  type: 'connection' | 'disconnection' | 'calibration' | 'tracking' | 'error';
  timestamp: number;
  data?: any;
  message?: string;
}

/**
 * Configuración de exportación de datos
 */
export interface ExportConfig {
  format: 'csv' | 'json' | 'xlsx';
  includeGazeData: boolean;
  includeFixations: boolean;
  includeSaccades: boolean;
  includeHeatMap: boolean;
  timeRange?: {
    start: number;
    end: number;
  };
}

/**
 * Respuesta de API para eye tracking
 */
export interface EyeTrackingAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Parámetros para iniciar eye tracking
 */
export interface StartEyeTrackingParams {
  participantId: string;
  testId?: string;
  config: EyeTrackerConfig;
  areasOfInterest?: AreaOfInterest[];
}

/**
 * Parámetros para detener eye tracking
 */
export interface StopEyeTrackingParams {
  sessionId: string;
  saveData: boolean;
  generateAnalysis: boolean;
}

/**
 * Parámetros para análisis de eye tracking
 */
export interface AnalyzeEyeTrackingParams {
  sessionId: string;
  analysisType: 'basic' | 'advanced' | 'custom';
  areasOfInterest?: AreaOfInterest[];
  customSettings?: {
    fixationThreshold?: number;
    saccadeThreshold?: number;
    smoothingFactor?: number;
  };
}

/**
 * Type guards para validación de tipos
 */
export function isGazePoint(obj: any): obj is GazePoint {
  return (
    typeof obj === 'object' &&
    typeof obj.x === 'number' &&
    typeof obj.y === 'number' &&
    typeof obj.timestamp === 'number'
  );
}

export function isEyeTrackingSession(obj: any): obj is EyeTrackingSession {
  return (
    typeof obj === 'object' &&
    typeof obj.sessionId === 'string' &&
    typeof obj.participantId === 'string' &&
    typeof obj.startTime === 'string' &&
    Array.isArray(obj.gazeData)
  );
}

export function isEyeTrackingAnalysis(obj: any): obj is EyeTrackingAnalysis {
  return (
    typeof obj === 'object' &&
    typeof obj.sessionId === 'string' &&
    typeof obj.analysisId === 'string' &&
    Array.isArray(obj.fixations) &&
    Array.isArray(obj.saccades)
  );
}

/**
 * Constantes para eye tracking
 */
export const EYE_TRACKING_CONSTANTS = {
  DEFAULT_SAMPLE_RATE: 60,
  DEFAULT_CALIBRATION_POINTS: 9,
  DEFAULT_SMOOTHING_FACTOR: 0.7,
  FIXATION_THRESHOLD: 100, // ms
  SACCADE_THRESHOLD: 30, // degrees/ms
  MAX_TRACKING_DURATION: 3600000, // 1 hour in ms
  MIN_ACCURACY_THRESHOLD: 0.5,
  MAX_ACCURACY_THRESHOLD: 2.0,
} as const;

/**
 * Códigos de error para eye tracking
 */
export const EYE_TRACKING_ERROR_CODES = {
  DEVICE_NOT_FOUND: 'EYE_TRACKER_DEVICE_NOT_FOUND',
  CONNECTION_FAILED: 'EYE_TRACKER_CONNECTION_FAILED',
  CALIBRATION_FAILED: 'EYE_TRACKER_CALIBRATION_FAILED',
  TRACKING_LOST: 'EYE_TRACKER_TRACKING_LOST',
  INVALID_CONFIG: 'EYE_TRACKER_INVALID_CONFIG',
  SESSION_NOT_FOUND: 'EYE_TRACKER_SESSION_NOT_FOUND',
  ANALYSIS_FAILED: 'EYE_TRACKER_ANALYSIS_FAILED',
} as const;
