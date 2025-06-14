import { ExpandedStep, ResponsesData } from './flow.types';

// Tipos para hooks de respuestas
export interface UseResponseAPIProps {
  researchId: string;
  participantId: string;
}

export interface UseResponseAPIReturn {
  saveOrUpdateResponse: (
    questionId: string,
    questionType: string,
    questionName: string,
    answer: unknown,
    existingResponseId?: string
  ) => Promise<{ id: string } | null>;
  getResponses: () => Promise<unknown>;
  markAsCompleted: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

export interface UseStepResponseManagerProps<TResponseData> {
  stepId: string;
  stepType: string;
  stepName?: string;
  initialData?: TResponseData | null;
  researchId?: string;
  participantId?: string;
}

export interface UseStepResponseManagerReturn<TResponseData> {
  responseData: TResponseData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  responseSpecificId: string | null; 
  saveCurrentStepResponse: (dataToSave: TResponseData) => Promise<{ success: boolean; id?: string | null }>;
}

export interface UseResponseManagerProps {
  researchId: string;
  participantId?: string;
  expandedSteps: ExpandedStep[];
  currentStepIndex: number;
  responseAPI: UseResponseAPIReturn;
  storeSetLoadedResponses: (responses: unknown[]) => void;
}

export interface UseResponseManagerReturn {
  responsesData: ResponsesData;
  loadExistingResponses: () => Promise<void>;
  saveStepResponse: (
    stepId: string,
    responseData: unknown,
    stepType?: string,
    stepName?: string
  ) => Promise<void>;
  getStepResponse: (stepId: string) => unknown;
  hasStepBeenAnswered: (stepId: string) => boolean;
  getResponsesJson: () => string;
  markResponsesAsCompleted: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Tipos para hooks de almacenamiento
export interface ResponseData {
  stepId: string;
  stepType: string;
  answer: unknown;
  timestamp: number;
  partial?: boolean;
}

export interface UseResponseStorageReturn {
  saveResponse: (stepId: string, stepType: string, answer: unknown, isPartial?: boolean) => void;
  loadResponse: (stepId: string) => ResponseData | null;
  clearResponse: (stepId: string) => void;
  hasResponse: (stepId: string) => boolean;
}

// Tipos para hooks de módulos
export interface UseModuleResponsesProps {
  researchId?: string;
  participantId?: string;
  autoFetch?: boolean;
}

export interface UseModuleResponsesReturn {
  data: unknown | null;
  documentId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchResponses: (researchId: string, participantId: string) => void;
}

// Tipos para hooks de login de participante
export interface UseParticipantLoginProps {
  researchId: string;
  onLogin?: (participant: any) => void;
}

export interface UseParticipantLoginReturn {
  formData: {
    researchId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  errors: Record<string, string>;
  isLoading: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setFormData: (data: any) => void;
}

// Tipos para hooks de formularios estandarizados
export interface StandardizedFormProps {
  stepId: string;
  stepType: string;
  stepName?: string;
  researchId?: string;
  participantId?: string;
  savedResponse?: { id?: string; response?: unknown } | null;
  savedResponseId?: string | null;
  required?: boolean;
  isMock?: boolean;
}

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface StandardizedFormState<T> {
  value: T;
  isLoading: boolean;
  isSaving: boolean;
  isDataLoaded: boolean;
  error: string | null;
  responseId: string | null;
  hasExistingData: boolean;
}

export interface StandardizedFormActions<T> {
  setValue: (value: T, isUserInteraction?: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  saveResponse: (value?: T) => Promise<{ success: boolean; data?: unknown }>;
  validateAndSave: (value?: T) => Promise<{ success: boolean; data?: unknown }>;
  reset: () => void;
  forceRefresh: () => void;
}

export interface UseStandardizedFormOptions<T> {
  initialValue: T;
  extractValueFromResponse: (response: unknown) => T;
  validationRules?: ValidationRule<T>[];
  enableAutoSave?: boolean;
  moduleId?: string;
}

// Tipos para hooks de eye tracking
export interface UseEyeTrackingResult {
  data: any | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Tipos para hooks de investigación
export interface RawResearchModule {
  id?: string;
  sk: string;
  name?: string;
  type?: string;
  config?: any;
  order?: number;
  demographicQuestions?: unknown[];
  [key: string]: unknown;
}

export interface ProcessedResearchFormConfig {
  id: string;
  config: unknown;
  originalSk?: string;
}

export interface UseResearchFormsReturn {
  data: ProcessedResearchFormConfig[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseFlowNavigationAndStateProps {
  researchId: string;
  participantId: string;
}

export interface UseSmartVOCDataReturn {
  questions: any[];
  isLoading: boolean;
  error: string | null;
  fetchQuestions: () => Promise<void>;
} 