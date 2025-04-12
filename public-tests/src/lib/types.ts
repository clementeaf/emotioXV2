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
  responses: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Tipos para WelcomeScreen
export interface WelcomeScreenResponse {
  title: string;
  description: string;
  duration: number;
  showDuration: boolean;
  showProgress: boolean;
}

// Tipos para SmartVOC
export interface SmartVOCFormData {
  questions: SmartVOCQuestion[];
  settings: SmartVOCSettings;
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
  tasks: CognitiveTask[];
  settings: CognitiveTaskSettings;
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
  title: string;
  message: string;
  showSocialShare: boolean;
  redirectUrl?: string;
  redirectDelay?: number;
} 