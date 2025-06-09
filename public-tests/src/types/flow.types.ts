import React from 'react';

// Tipos base para el flujo
export interface ExpandedStep {
  id: string;
  name: string;
  type: string;
  config: unknown;
  responseKey?: string;
  completed?: boolean;
  current?: boolean;
}

export interface Step {
  id: string;
  name: string;
  completed?: boolean;
  current?: boolean;
}

// Props para handlers de flujo
export interface CognitiveTaskHandlerProps {
  researchId: string;
  token: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

export interface CurrentStepProps {
  step: ExpandedStep;
  researchId: string;
  participantId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

export interface CurrentStepRendererProps {
  currentStep: ExpandedStep;
  researchId: string;
  participantId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

export interface FlowStepContentProps {
  currentStep: ExpandedStep;
  researchId: string;
  participantId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

export interface SmartVOCHandlerProps {
  researchId: string;
  token: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

export interface WelcomeStepConfig {
  title?: string;
  message?: string;
  showContinueButton?: boolean;
}

export interface WelcomeScreenHandlerProps {
  config: WelcomeStepConfig;
  onComplete: () => void;
  onError: (error: string) => void;
}

// Props para componente de mapeo de pasos
export interface MappedStepComponentProps {
  step: ExpandedStep;
  researchId: string;
  participantId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

// Tipos para preguntas específicas del flujo
export interface MultipleChoiceQuestionProps {
  stepConfig?: unknown;
  stepId?: string;
  stepName?: string;
  stepType: string;
  onStepComplete: (answer: unknown) => void;
  isMock: boolean;
}

export interface SingleChoiceQuestionProps {
  id: string;
  title?: string;
  description?: string;
  choices: Array<{ id: string; label: string; }>;
  value?: string;
  onChange: (id: string, value: string) => void;
  required?: boolean;
  error?: string;
  allowOther?: boolean;
}

export interface LongTextQuestionProps {
  config: unknown;
  stepName?: string;
  stepId?: string;
  stepType: string;
  onStepComplete: (answer: unknown) => void;
  isMock: boolean;
}

export interface ShortTextQuestionProps {
  id: string;
  title?: string;
  description?: string;
  value?: string;
  onChange: (id: string, value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  error?: string;
}

export interface LineaScaleQuestionProps {
  id: string;
  title?: string;
  description?: string;
  value?: number;
  onChange: (id: string, value: number) => void;
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  step?: number;
  required?: boolean;
  error?: string;
}

// Tipos para respuestas y datos del flujo
export interface ResponsesData {
  [moduleId: string]: {
    [questionId: string]: {
      id?: string;
      moduleId: string;
      questionId: string;
      questionType: string;
      questionName: string;
      answer: unknown;
      createdAt?: string;
      updatedAt?: string;
    };
  };
}

// Props para hooks del flujo
export interface UseFlowBuilderProps {
  researchFlowApiData: {
    data: Array<{
      id: string;
      config: unknown;
      originalSk?: string;
    }>;
  } | null;
  isLoading: boolean;
}

export interface UseFlowNavigationAndStateProps {
  researchId: string;
  participantId: string;
}

// Tipos demográficos específicos del flujo
export interface ApiDemographicQuestion {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
}

export interface ApiDemographicQuestions {
  questions: ApiDemographicQuestion[];
}

export interface DemographicStepProps {
  researchId: string;
  participantId: string;
  onComplete: () => void;
  onError: (error: string) => void;
  demographicQuestions?: ApiDemographicQuestions;
}

// Tipos extendidos para eye tracking en el flujo
export interface ExtendedEyeTrackingData {
  id?: string;
  moduleId: string;
  researchId: string;
  participantId: string;
  stimulusId?: string;
  stimulusUrl?: string;
  startTime: string;
  endTime?: string;
  gazeData?: Array<{
    x: number;
    y: number;
    timestamp: number;
    confidence?: number;
  }>;
  fixations?: Array<{
    x: number;
    y: number;
    duration: number;
    timestamp: number;
  }>;
  saccades?: Array<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    duration: number;
    timestamp: number;
  }>;
  metadata?: {
    screenWidth: number;
    screenHeight: number;
    deviceType: string;
    userAgent: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Respuestas del visualizador
export interface ResponsesViewerProps {
  data: ResponsesData;
  onClose?: () => void;
}

// Additional Flow Component Interfaces
export interface SmartVocFeedbackQuestionProps {
  id: string;
  title?: string;
  description?: string;
  value?: string;
  onChange: (id: string, value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  error?: string;
}

export interface StepComponentMap {
  [key: string]: React.ComponentType<any>;
}

export interface OldFlowStepContentProps {
  currentStep: any;
  [key: string]: any;
}

export interface FlowStepContentProps extends Omit<OldFlowStepContentProps, 'currentStep'> {
  currentStep: ExpandedStep;
  participantId: string;
  researchId: string;
  onStepComplete: (responseData?: any) => void;
  onError: (error: string) => void;
}

// Auth Component Interfaces
export interface AuthHeaderProps {
  title: string;
  emoji?: string;
}

export interface AuthSubmitButtonProps {
  isLoading: boolean;
  loadingText?: string;
  text?: string;
  className?: string;
}

export interface AuthLegalTextProps {
  termsUrl?: string;
  privacyUrl?: string;
}

// Demographics Interface
export interface GenericSelectQuestionProps {
  question: ApiDemographicQuestion;
  onAnswer: (questionId: string, answer: string) => void;
}

// Layout Interface
export interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  hasSubMenu?: boolean;
  onClick?: () => void;
}

// Research ThankYou Screen (diferente del ThankYouScreen común)
export interface ThankYouConfig {
  id: string;
  sk: string;
  title?: string;
  message?: string;
  showConfetti?: boolean;
}

export interface ResearchThankYouScreenProps {
  researchId: string;
  stepId: string;
  title?: string;
  stepConfig: ThankYouConfig;
  onError: (error: string) => void;
}

// Thank You Screen Interface
export interface ThankYouConfig {
  title?: string;
  message?: string;
  showProgress?: boolean;
  autoRedirect?: boolean;
  redirectDelay?: number;
  redirectUrl?: string;
  customActions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface ThankYouScreenProps {
  config?: ThankYouConfig;
  onComplete?: () => void;
  participantId?: string;
  researchId?: string;
} 