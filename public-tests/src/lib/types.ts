// Tipos base para las respuestas de la API
export interface APIResponse<T> {
  data: T | null;
  error?: boolean;
  message?: string;
  notFound?: boolean;
  status?: number;
  apiStatus?: 'success' | 'error' | 'not_found' | 'loading' | 'network_error' | 'validation_error' | 'server_error' | 'unauthorized' | 'token_expired';
}

// Tipos para los datos de investigación
export interface Research {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
}

// Tipos para la configuración de WelcomeScreen
export interface WelcomeScreenConfig {
  id: string;
  researchId: string;
  title: string;
  description: string;
  buttonText: string;
  isEnabled: boolean;
  completedUrl: string;
  disqualifiedUrl: string;
  quotaFullUrl: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para las respuestas de los participantes
export interface ParticipantResponse {
  id: string;
  researchId: string;
  participantId: string;
  status: 'completed' | 'disqualified' | 'quota_full';
  responses: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Tipos para WelcomeScreen
export interface WelcomeScreenResponse {
  id: string;
  title: string;
  message: string;
  startButtonText: string;
  isEnabled: boolean;
}

// Tipos para SmartVOC
export interface SmartVOCFormData {
  id?: string;
  questions: unknown[];
  randomizeQuestions?: boolean;
  smartVocRequired?: boolean;
}

export interface SmartVOCQuestion {
  id: string;
  type: 'nps' | 'voc';
  title: string;
  description?: string;
  required: boolean;
  order: number;
}

export interface SmartVOCSettings {
  showProgress: boolean;
  allowSkip: boolean;
  showQuestionNumbers: boolean;
}

// Tipos para CognitiveTask
export interface CognitiveTaskFormData {
  id?: string;
  questions: unknown[];
  randomizeQuestions?: boolean;
}

export interface CognitiveTask {
  id: string;
  type: 'choice' | 'ranking';
  title: string;
  description?: string;
  required: boolean;
  order: number;
  options: string[];
}

export interface CognitiveTaskSettings {
  showProgress: boolean;
  allowSkip: boolean;
  showTaskNumbers: boolean;
  timeLimit?: number;
}

// Tipos para ThankYouScreen
export interface ThankYouScreenFormData {
  id?: string;
  title: string;
  message: string;
  redirectUrl?: string;
  isEnabled: boolean;
}

// Interfaz para un paso del flujo de investigación
export interface Step {
  id: string;
  type: string;
  config?: unknown;
}

// Ejemplo de uso en la respuesta del endpoint /flow
export interface ResearchFlowResponse {
  data: Step[];
}

// Interfaces para Eye Tracking
export interface EyeTrackingFormData {
  id?: string;
  researchId: string;
  config: EyeTrackingConfig;
  stimuli: EyeTrackingStimulus[];
  areasOfInterest: {
    enabled: boolean;
    areas: EyeTrackingArea[];
  };
}

export interface EyeTrackingConfig {
  enabled: boolean;
  trackingDevice: string;
  calibration: boolean;
  validation: boolean;
  recording: {
    audio: boolean;
    video: boolean;
  };
  visualization: {
    showGaze: boolean;
    showFixations: boolean;
    showSaccades: boolean;
    showHeatmap: boolean;
  };
}

export interface EyeTrackingStimulus {
  id: string;
  name: string;
  url: string;
  type: string;
  duration: number;
  order: number;
}

export interface EyeTrackingArea {
  id: string;
  name: string;
  color: string;
  region: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Mantener otras interfaces existentes
export interface WelcomeScreenResponse {
  id: string;
  title: string;
  message: string;
  startButtonText: string;
  isEnabled: boolean;
}

export interface SmartVOCFormData {
  id?: string;
  questions: unknown[];
  randomizeQuestions?: boolean;
  smartVocRequired?: boolean;
}

export interface CognitiveTaskFormData {
  id?: string;
  questions: unknown[];
  randomizeQuestions?: boolean;
}

export interface ThankYouScreenFormData {
  id?: string;
  title: string;
  message: string;
  redirectUrl?: string;
  isEnabled: boolean;
} 