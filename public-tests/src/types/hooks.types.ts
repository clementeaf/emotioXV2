import { ResponsesData } from '../hooks/types';
import { ParticipantFlowStep } from './flow';
import { ExpandedStep } from './flow.types';

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
  hasExistingData: boolean;
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
  questionKey: string; // NUEVO: Identificador único de pregunta
  stepId: string;
  stepType: string;
  response: unknown; // NUEVO: Cambiar 'answer' por 'response' para coincidir con el uso
  timestamp: number;
  partial?: boolean;
  version: string; // NUEVO: Versión para compatibilidad
}

export interface UseResponseStorageReturn {
  saveResponse: (questionKey: string, responseData: unknown) => void;
  loadResponse: (questionKey: string) => ResponseData | null;
  clearResponse: (questionKey: string) => void;
  hasResponse: (questionKey: string) => boolean;
  clearAllResponses: () => void; // NUEVO: Limpiar todas las respuestas
}

// Tipos para hooks de módulos
export interface UseModuleResponsesProps {
  researchId?: string;
  participantId?: string;
  autoFetch?: boolean;
}

export interface UseModuleResponsesReturn {
  data: any;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<any>;
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
  questionKey?: string; // NUEVO: Soporte universal para recuperación por questionKey
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
  setValue: (newValue: T, isUserInteraction?: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  saveResponse: (value?: T) => Promise<{ success: boolean; error: string | null; data: unknown | null }>;
  validateAndSave: (dataToSave?: T) => Promise<{ success: boolean; error: string | null; data: unknown | null }>;
  reset: () => void;
  refetch: () => void;
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
  expandedSteps: ExpandedStep[];
  initialResearchDataLoading: boolean;
  researchId: string | undefined;
  participantId: string | undefined;
  maxVisitedIndexFromStore: number | undefined;
  saveStepResponse: (answer?: unknown) => Promise<void>;
  markResponsesAsCompleted: () => Promise<void>;
  getStepResponse: (stepIndex: number) => unknown;
  loadExistingResponses: () => Promise<void>;
  handleErrorProp: (errorMessage: string, step: ParticipantFlowStep | string) => void;
  setExternalExpandedSteps?: (updater: (prevSteps: ExpandedStep[]) => ExpandedStep[]) => void;
  currentStepIndexState: number;
  setCurrentStepIndexFunc: React.Dispatch<React.SetStateAction<number>>;
}

export interface UseSmartVOCDataReturn {
  questions: any[];
  isLoading: boolean;
  error: string | null;
  fetchQuestions: () => Promise<void>;
}
