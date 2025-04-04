// Interfaces para EyeTracking en la sección Build
export interface EyeTrackingConfig {
  active: boolean;
  device: string;
  sampleRate: number;
  options: {
    calibration: boolean;
    validation: boolean;
    recordAudio: boolean;
    recordVideo: boolean;
    realTimeVisualization: boolean;
  };
}

// Interfaces para EyeTracking en la sección Recruit
export interface EyeTrackingRecruitConfig {
  // Información básica
  researchId: string;
  
  // Preguntas demográficas para calificar participantes
  demographicQuestions: {
    age: boolean;
    country: boolean;
    gender: boolean;
    educationLevel: boolean;
    householdIncome: boolean;
    employmentStatus: boolean;
    dailyHoursOnline: boolean;
    technicalProficiency: boolean;
  };
  
  // Configuración del enlace
  linkConfig: {
    allowMobileDevices: boolean;
    trackLocation: boolean;
    multipleAttempts: boolean;
  };
  
  // Límite de participantes
  participantLimit: {
    enabled: boolean;
    limit: number;
  };
  
  // Enlaces de retorno
  backlinks: {
    complete: string;
    disqualified: string;
    overquota: string;
  };
  
  // URL de investigación para compartir
  researchUrl: string;
  
  // Parámetros a guardar
  parameterOptions: {
    parameters: boolean;
    separated: boolean;
    with: boolean;
    comma: boolean;
    keys: boolean;
  };
}

// Interfaces para las estadísticas de reclutamiento
export interface EyeTrackingRecruitStats {
  complete: {
    count: number;
    percentage: number;
    label: string;
    description: string;
  };
  disqualified: {
    count: number;
    percentage: number;
    label: string;
    description: string;
  };
  overquota: {
    count: number;
    percentage: number;
    label: string;
    description: string;
  };
}

// Interfaces para respuestas de la API
export interface EyeTrackingRecruitResponse {
  success: boolean;
  data?: EyeTrackingRecruitConfig;
  stats?: EyeTrackingRecruitStats;
  error?: string;
}

// Interfaces para las solicitudes de la API
export interface EyeTrackingRecruitRequest {
  researchId: string;
  config: Omit<EyeTrackingRecruitConfig, 'researchId'>;
}

// Tipos para las opciones del formulario
export type DemographicQuestionKey = 
  | 'age' 
  | 'country' 
  | 'gender' 
  | 'educationLevel' 
  | 'householdIncome' 
  | 'employmentStatus' 
  | 'dailyHoursOnline' 
  | 'technicalProficiency';

export type LinkConfigKey = 
  | 'allowMobileDevices' 
  | 'trackLocation' 
  | 'multipleAttempts';

export type ParameterOptionKey = 
  | 'parameters' 
  | 'separated' 
  | 'with' 
  | 'comma' 
  | 'keys';

export type BacklinkKey = 
  | 'complete' 
  | 'disqualified' 
  | 'overquota'; 