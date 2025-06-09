// Tipos específicos para SmartVOC

// Base interface for standardized form props
export interface StandardizedFormProps {
  stepName: string;
  stepType: string;
  stepId: string;
  onContinue?: (responseData?: any) => void;
  isSubmitting?: boolean;
}
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
  onComplete: (feedback: string) => void;
}

export interface CSATViewProps extends StandardizedFormProps {
  question?: string;
  value?: number;
  onChange?: (value: number) => void;
}

export interface DifficultyScaleData {
  difficulty: number;
  feedback?: string;
}

export interface DifficultyScaleViewProps extends Omit<StandardizedFormProps, 'stepName' | 'stepType' | 'stepId'> {
  onContinue: (responseData: DifficultyScaleData) => void;
  config?: {
    question?: string;
    minLabel?: string;
    maxLabel?: string;
    minValue?: number;
    maxValue?: number;
  };
}

export interface VOCTextData {
  text: string;
  additionalFeedback?: string;
}

export interface VOCTextQuestionProps extends Omit<StandardizedFormProps, 'stepName'> {
  onContinue: (data: VOCTextData) => void;
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