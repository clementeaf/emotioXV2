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
  researchId: string;
  participantId: string;
  stepId: string;
  stepType: string;
  stepName: string;
  initialData?: TResponseData;
}

export interface UseStepResponseManagerReturn<TResponseData> {
  responseData: TResponseData | null;
  isLoading: boolean;
  error: string | null;
  saveResponse: (data: TResponseData) => Promise<void>;
  updateResponse: (data: Partial<TResponseData>) => Promise<void>;
  clearResponse: () => void;
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
  onLoginSuccess: (participantId: string, researchId: string) => void;
  onLoginError: (error: string) => void;
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
  questionId: string;
  questionType: string;
  title?: string;
  description?: string;
  required?: boolean;
  config?: Record<string, unknown>;
}

export interface ValidationRule<T> {
  validate: (value: T) => boolean | string;
  message?: string;
}

export interface StandardizedFormState<T> {
  value: T;
  error: string | null;
  touched: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export interface StandardizedFormActions<T> {
  setValue: (value: T) => void;
  setError: (error: string | null) => void;
  setTouched: (touched: boolean) => void;
  reset: () => void;
  validate: () => boolean;
}

export interface UseStandardizedFormOptions<T> {
  initialValue: T;
  validationRules?: ValidationRule<T>[];
  required?: boolean;
}

export interface UseStandardizedFormReturn<T> extends StandardizedFormState<T>, StandardizedFormActions<T> {}

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