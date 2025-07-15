export interface UseQuestionResponseProps {
  currentStepKey: string;
  previousResponse?: Record<string, unknown>;
  questionType: string;
}

export interface UseQuestionResponseReturn {
  selectedValue: string;
  textValue: string;
  setSelectedValue: (value: string) => void;
  setTextValue: (value: string) => void;
  hasPreviousResponse: boolean;
}

export interface UseNavigationStateProps {
  onContinue?: () => void;
  buttonText?: string;
}

export interface UseNavigationStateReturn {
  isNavigating: boolean;
  isSuccess: boolean;
  buttonText: string;
  isButtonDisabled: boolean;
  handleContinue: () => Promise<void>;
}

export interface UseSubmitStateProps {
  onSuccess?: () => void;
  buttonText?: string;
  hasPreviousResponse?: boolean;
}

export interface UseSubmitStateReturn {
  isSubmitting: boolean;
  isSuccess: boolean;
  buttonText: string;
  isButtonDisabled: boolean;
  handleSubmit: (submitFn: () => Promise<void>) => Promise<void>;
}

export interface UseDeleteStateProps {
  onSuccess?: () => void;
  buttonText?: string;
}

export interface UseDeleteStateReturn {
  isDeleting: boolean;
  buttonText: string;
  isButtonDisabled: boolean;
  handleDelete: (deleteFn: () => Promise<void>) => Promise<void>;
}
