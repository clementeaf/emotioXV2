import React from 'react';
import { ChoiceOption } from './common.types';
import { ExpandedStep } from './flow.types';

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
  onComplete?: () => void;
  title?: string;
  message?: string;
  imageSrc?: string;
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

export interface PrioritizationTaskComponentProps {
  onContinue: () => void;
  question?: string;
  options?: string[];
}

export interface PasswordResetTaskProps {
  onContinue: () => void;
}

export interface CognitiveQuestionRendererProps {
  question: CognitiveQuestion;
  answer: unknown;
  onChange: (questionId: string, value: unknown) => void;
}

export interface CognitiveNavigationFlowStepProps {
  onContinue: (responseData?: unknown) => void;
  config?: {
    questions: any[]; // CognitiveQuestion desde shared interfaces
  };
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
  cognitiveQuestion: ExpandedStep;
  onComplete: (answer: unknown) => void;
  isAnswered?: boolean;
}

// Task View Components (non-conflicting)
export interface LongTextInputViewProps {
  description: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export interface TextOnlyInputViewProps {
  description: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
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
  buttons: number[];
  selectedValue: number | undefined;
  onSelect: (value: number) => void;
  buttonClassName?: string;
  activeButtonClassName?: string;
  inactiveButtonClassName?: string;
}

export interface ScaleLabelsProps {
  minLabel: string;
  maxLabel: string;
  className?: string;
}

// ImageViewWithSelection Component Props
export interface ImageViewWithSelectionComponentProps {
  imageType: 'desktop' | 'mobile';
  options: ChoiceOption[];
  selectedOption: string | null;
  onOptionSelect: (optionId: string) => void;
}

export interface TransactionAuthTaskComponentProps {
  onContinue: () => void;
  viewFormat?: 'text-only' | 'desktop-image' | 'mobile-image' | 'long-text';
}

export interface LinearScaleViewComponentProps {
  config: CognitiveQuestion & {
    minValue?: number;
    maxValue?: number;
    minLabel?: string;
    maxLabel?: string;
  };
  value: number | undefined;
  onChange: (questionId: string, selectedValue: number) => void;
}

export interface SingleChoiceViewComponentProps {
  config: CognitiveQuestion & { options?: ChoiceOption[] };
  value: string | undefined;
  onChange: (questionId: string, selectedOptionId: string) => void;
}

export interface MultiChoiceViewComponentProps {
  config: CognitiveQuestion & { options?: ChoiceOption[] };
  value?: string[];
  onChange: (questionId: string, selectedOptionIds: string[]) => void;
}

export interface LongTextViewComponentProps {
  config: CognitiveQuestion;
  value?: string;
  onChange: (questionId: string, value: string) => void;
  onStepComplete?: (answer?: unknown) => void;
  savedResponse?: { id?: string; response?: unknown } | null;
  savedResponseId?: string | null;
} 