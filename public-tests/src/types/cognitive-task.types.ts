import React from 'react';
import { ChoiceOption } from './common.types';

// Interfaz principal para una pregunta cognitiva
export interface CognitiveQuestion {
  id: string; 
  type: string; 
  title?: string;
  description?: string;
  answerPlaceholder?: string;
  required?: boolean;
  showConditionally?: boolean;
  deviceFrame?: boolean;
  choices?: Array<{ id: string; label: string; }>;
  scaleConfig?: {
    startValue: number;
    endValue: number;
    startLabel?: string;
    endLabel?: string;
  };
  files?: Array<{
    id: string;
    name: string;
    url: string;
    hitZones?: Array<{
      id: string;
      name: string;
      region: { x: number; y: number; width: number; height: number; };
      fileId: string;
    }>;
  }>;
  moduleResponseId?: string;
  props?: Record<string, unknown>;
}

// Interfaz para definición de tareas
export interface TaskDefinition {
  id: string;
  component: React.ComponentType<unknown>;
  title: string;
  description?: string;
  props?: Record<string, unknown>;
  questionType?: string;
}

// Props para vistas de preguntas específicas
export interface ShortTextViewProps {
  config: CognitiveQuestion;
  value?: string;
  onChange: (questionId: string, value: string) => void;
  onContinue?: (responseData?: unknown) => void;
  isSubmitting?: boolean;
  question?: CognitiveQuestion;
  stepConfig?: unknown;
  questionId?: string;
  questionType?: string;
}

export interface LongTextViewProps {
  config: CognitiveQuestion;
  value?: string;
  onChange: (questionId: string, value: string) => void;
  onContinue?: (responseData?: unknown) => void;
  isSubmitting?: boolean;
  question?: CognitiveQuestion;
  stepConfig?: unknown;
  questionId?: string;
  questionType?: string;
}

export interface SingleChoiceViewProps {
  config: CognitiveQuestion;
  value?: string;
  onChange: (questionId: string, value: string) => void;
  onContinue?: (responseData?: unknown) => void;
  isSubmitting?: boolean;
  question?: CognitiveQuestion;
  stepConfig?: unknown;
  questionId?: string;
  questionType?: string;
}

export interface MultiChoiceViewProps {
  config: CognitiveQuestion;
  value?: string[];
  onChange: (questionId: string, value: string[]) => void;
  onContinue?: (responseData?: unknown) => void;
  isSubmitting?: boolean;
  question?: CognitiveQuestion;
  stepConfig?: unknown;
  questionId?: string;
  questionType?: string;
}

export interface LinearScaleViewProps {
  config: CognitiveQuestion;
  value?: number;
  onChange: (questionId: string, value: number) => void;
  onContinue?: (responseData?: unknown) => void;
  isSubmitting?: boolean;
  question?: CognitiveQuestion;
  stepConfig?: unknown;
  questionId?: string;
  questionType?: string;
}

export interface NavigationFlowTaskProps {
  onContinue: (responseData?: unknown) => void;
  config?: {
    questions: CognitiveQuestion[];
  };
  isSubmitting?: boolean;
  question?: CognitiveQuestion;
  stepConfig?: unknown;
  questionId?: string;
  questionType?: string;
}

export interface TransactionAuthTaskProps {
  onContinue: (responseData?: unknown) => void;
  config?: {
    questions: CognitiveQuestion[];
  };
  isSubmitting?: boolean;
  question?: CognitiveQuestion;
  stepConfig?: unknown;
  questionId?: string;
  questionType?: string;
}

export interface PrioritizationTaskProps {
  onContinue: (responseData?: unknown) => void;
  question?: string;
  options?: Array<{ id: string; label: string; }>;
  config?: {
    questions: CognitiveQuestion[];
  };
  isSubmitting?: boolean;
  stepConfig?: unknown;
  questionId?: string;
  questionType?: string;
}

// Props para CognitiveTaskView
export interface CognitiveTaskViewProps {
  researchId: string;
  participantId: string;
  stepConfig: {
    id?: string;
    questions: CognitiveQuestion[];
    randomizeQuestions?: boolean;
  };
  onComplete: () => void;
  onError: (error: string) => void;
}

// Props para ThankYouView
export interface ThankYouViewProps {
  onComplete: () => void;
  title?: string;
  message?: string;
}

// Props para TaskProgressBar
export interface TaskProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showProgressText?: boolean;
  className?: string;
  progressTextClassName?: string;
  progressBarContainerClassName?: string;
  progressBarClassName?: string;
}

// Props para QuestionHeader
export interface QuestionHeaderProps {
  title?: string;
  description?: string;
  required?: boolean;
}

// Respuestas de cognitive tasks
export interface CognitiveAnswers {
  [questionId: string]: unknown;
}

// Props para hooks
export interface UseCognitiveTaskProps {
  researchId: string;
  token: string | null; // Permitir null para la comprobación inicial
  onComplete: () => void;
  onError: (message: string) => void;
}

// Additional Cognitive Task Components (non-conflicting)
export interface GenderSelectionTaskProps {
  onContinue: () => void;
}

export interface SocialMediaTaskProps {
  onContinue: () => void;
}

export interface CitySelectionTaskProps {
  onContinue: () => void;
}

export interface InstructionsTaskProps {
  onContinue: () => void;
}

export interface PasswordResetTaskProps {
  onComplete: (response: any) => void;
}

export interface CognitiveNavigationFlowStepProps {
  onComplete: (response: any) => void;
}

export interface CognitiveQuestionRendererProps {
  question: CognitiveQuestion;
  onResponse: (response: any) => void;
  disabled?: boolean;
  currentIndex?: number;
  totalQuestions?: number;
}

export interface CognitiveTaskQuestionProps {
  question: CognitiveQuestion;
  onResponse: (response: any) => void;
  disabled?: boolean;
}

// Task View Components (non-conflicting)
export interface LongTextInputViewProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export interface TextOnlyInputViewProps {
  question: string;
  onComplete: () => void;
}

export interface ImageViewWithSelectionProps {
  imageUrl: string;
  question: string;
  choices: ChoiceOption[];
  onSelect: (choice: string) => void;
  disabled?: boolean;
}

// Common Task Components (non-conflicting)
export interface TaskFooterProps {
  className?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
  caPrivacyNoticeUrl?: string;
}

export interface ScaleButtonGroupProps {
  min: number;
  max: number;
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export interface ScaleLabelsProps {
  minLabel: string;
  maxLabel: string;
  className?: string;
} 