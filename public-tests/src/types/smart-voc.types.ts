import { StandardizedFormProps } from './hooks.types';

// Tipos específicos para SmartVOC

export interface SmartVOCQuestion {
  id: string;
  type: 'csat' | 'ces' | 'cv' | 'nev' | 'nps' | 'voc' | 'trust';
  title?: string;
  description?: string;
  required?: boolean;
  showConditionally?: boolean;
  config?: {
    scale?: {
      min: number;
      max: number;
      minLabel?: string;
      maxLabel?: string;
    };
    options?: Array<{
      id: string;
      label: string;
      emoji?: string;
    }>;
    placeholder?: string;
    maxLength?: number;
  };
}

export interface SmartVOCFormData {
  id?: string;
  questions: SmartVOCQuestion[];
  randomizeQuestions?: boolean;
}

export interface SmartVOCConfig {
  questions: SmartVOCQuestion[];
}

export interface SmartVOCSettings {
  randomizeQuestions: boolean;
  allowSkip: boolean;
}

export interface Answers {
  [questionId: string]: unknown;
}

// Props para componentes SmartVOC
export interface SmartVOCHandlerProps {
  researchId: string;
  token: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

export interface NPSViewProps extends StandardizedFormProps {
  questionText: string;
  instructions?: string;
  companyName?: string;
  leftLabel?: string;
  rightLabel?: string;
  onNext: (selectedValue: number) => void;
  config?: unknown;
}

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

export interface UseSmartVOCDataReturn {
  questions: SmartVOCQuestion[];
  answers: Answers;
  currentQuestionIndex: number;
  currentQuestion: SmartVOCQuestion | null;
  isLoading: boolean;
  error: string | null;
  handleAnswerChange: (questionId: string, value: unknown) => void;
  goToNextQuestion: () => void;
  goToPrevQuestion: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  submitResponses: () => Promise<void>;
}

// Additional SmartVOC Component Interfaces
export interface AgreementScaleViewProps {
  question: string;
  value?: number;
  onChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
}

export interface ThankYouViewProps {
  title?: string;
  message?: string;
  onComplete?: () => void;
  showButton?: boolean;
}

export interface EmotionSelectionViewProps {
  question: string;
  selectedEmotions: string[];
  onChange: (emotions: string[]) => void;
  disabled?: boolean;
}

export interface FeedbackViewProps {
  question: SmartVOCQuestion;
  initialValue?: string;
  onChange?: (value: string) => void;
  onNext: (feedback: string) => void;
}

export interface CSATViewProps extends StandardizedFormProps {
  questionText: string;
  instructions?: string;
  companyName?: string;
  config?: unknown;
  scaleSize?: number;
  onNext?: (selectedValue: number) => void;
  onStepComplete?: (data?: unknown) => void;
}

export interface DifficultyScaleData {
  value: number | null;
}

export interface DifficultyScaleViewProps extends Omit<StandardizedFormProps, 'stepName' | 'stepType' | 'stepId'> {
  questionConfig: SmartVOCQuestion;
  moduleId: string;
  onNext: (responsePayload: { value: number, feedback?: string, moduleResponseId?: string | null }) => void;
}

export interface VOCTextQuestionProps extends Omit<StandardizedFormProps, 'stepName'> {
  onContinue: (data: { text: string; additionalFeedback?: string; }) => void;
  config?: {
    question?: string;
    placeholder?: string;
    maxLength?: number;
    showAdditionalFeedback?: boolean;
  };
}

// SmartVOC Question Interfaces
export interface NEVQuestionConfig {
  question: string;
  emotions: Array<{ id: string; label: string; emoji: string; }>;
  allowMultiple?: boolean;
}

export interface NEVQuestionProps {
  config: NEVQuestionConfig;
  onComplete: (selectedEmotions: string[]) => void;
  disabled?: boolean;
}

export interface NPSConfig {
  question: string;
  followUpQuestion?: string;
}

export interface NPSQuestionProps {
  config: NPSConfig;
  onComplete: (data: { score: number; feedback?: string; }) => void;
  disabled?: boolean;
}

export interface CVConfig {
  question: string;
  options: Array<{ id: string; label: string; }>;
}

export interface CVQuestionConfig {
  question: string;
  minValue: number;
  maxValue: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface CVQuestionProps {
  config: CVQuestionConfig;
  onComplete: (value: number) => void;
  disabled?: boolean;
}

// Interfaces adicionales para componentes SmartVOC
export interface BasicEmoji {
  emoji: string;
  label: string;
}

export interface EmotionSelectionViewComponentProps {
  questionText: string;
  instructions?: string;
  companyName?: string;
  onNext: (selectedEmoji: string) => void;
}

export interface AgreementScaleViewComponentProps {
  questionText: string;
  instructions?: string;
  scaleSize?: number;
  leftLabel?: string;
  rightLabel?: string;
  researchId: string;
  stepId: string;
  stepName: string;
  stepType: string;
  onStepComplete: (data?: unknown) => void;
}

export interface SmartVocThankYouViewComponentProps {
  message?: string;
  onContinue?: () => void;
  responsesData?: any; // ResponsesData from hooks
}

// Interfaces para preguntas específicas de SmartVOC
export interface VOCTextQuestionComponentProps extends Omit<StandardizedFormProps, 'stepName'> {
  questionConfig: SmartVOCQuestion;
  moduleId: string;
  onSaveSuccess: (questionId: string, value: string, moduleResponseId: string | null) => void;
}

export interface NEVQuestionComponentProps {
  questionConfig: {
    id: string;
    title?: string;
    description?: string;
    required?: boolean;
    type?: string;
  };
  researchId: string;
  moduleId: string;
  onSaveSuccess: (questionId: string, value: number, moduleResponseId: string | null) => void;
}

export interface NPSQuestionComponentProps {
  questionConfig: {
    id: string;
    description?: string;
    type: string;
    title?: string;
    config: {
      scaleRange?: { start: number; end: number };
      startLabel?: string;
      endLabel?: string;
    };
  };
  researchId: string;
  moduleId: string;
  onSaveSuccess: (questionId: string, responseValue: number, moduleResponseId: string | null) => void;
}

// CV Question Props
export interface CVQuestionComponentProps {
  questionConfig: CVQuestionConfig;
  researchId: string;
  moduleId: string;
  onSaveSuccess: (questionId: string, responseValue: number, moduleResponseId: string | null) => void;
}

// Tipo de datos para respuesta de texto VOC
export interface VOCTextData {
  value: string;
}

// Interface para useSmartVOCData hook (diferente de UseSmartVOCDataReturn)
export interface UseSmartVOCConfigReturn {
  isLoading: boolean;
  questions: SmartVOCQuestion[];
  error: string | null;
  config: SmartVOCConfig | null;
}
