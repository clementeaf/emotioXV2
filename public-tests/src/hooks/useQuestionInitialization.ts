import React from 'react';

// 🎯 TIPOS REUTILIZABLES
export interface QuestionConfig {
  maxSelections?: number;
  multiple?: boolean;
  min?: number;
  max?: number;
  startLabel?: string;
  endLabel?: string;
  leftLabel?: string;
  rightLabel?: string;
  instructions?: string;
  placeholder?: string;
  emojis?: string[];
  type?: string;
}

export interface Question {
  title: string;
  questionKey: string;
  type: string;
  config?: QuestionConfig;
  choices?: Array<{
    value: string;
    label: string;
    description?: string;
  }>;
  description: string;
}

export interface FormData {
  value?: unknown;
  selectedValue?: unknown;
}

interface UseQuestionInitializationProps {
  question: Question;
  currentStepKey: string;
  initialFormData?: FormData;
  formValues?: FormData;
  hasLoadedData?: boolean;
}

export const useQuestionInitialization = ({
  question,
  currentStepKey,
  initialFormData,
  formValues,
  hasLoadedData
}: UseQuestionInitializationProps) => {
  const [value, setValueInternal] = React.useState<unknown>(null);
  const hasUserInteractedRef = React.useRef(false);
  
  // Wrapper de setValue que marca interacción del usuario
  const setValue = React.useCallback((newValue: unknown) => {
    hasUserInteractedRef.current = true;
    setValueInternal(newValue);
  }, []);

  // 🎯 FUNCIÓN PARA OBTENER VALOR INICIAL SEGÚN TIPO DE PREGUNTA
  const getInitialValue = React.useCallback((questionType: string, config?: QuestionConfig): unknown => {
    if (questionType === 'emojis' && config?.maxSelections && config.maxSelections > 1) {
      return [];
    } else if (questionType === 'text' || questionType === 'cognitive_short_text' || questionType === 'cognitive_long_text') {
      return '';
    } else if (questionType === 'choice' && config?.multiple) {
      return [];
    } else {
      return null;
    }
  }, []);

  const convertBackendValue = React.useCallback((
    backendValue: unknown, 
    questionType: string, 
    config?: QuestionConfig
  ): unknown => {
    if ((questionType === 'emojis' || questionType === 'detailed') && 
        config?.maxSelections && 
        config.maxSelections > 1 && 
        typeof backendValue === 'string') {
      return backendValue.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return backendValue;
  }, []);

  React.useEffect(() => {
    const initialValue = getInitialValue(question.type, question.config);
    hasUserInteractedRef.current = false; // Reset en nueva pregunta
    setValueInternal(initialValue);
  }, [currentStepKey, question.type, question.config, getInitialValue]);

  React.useEffect(() => {
    if (hasUserInteractedRef.current) {
      return;
    }
    
    if (initialFormData && Object.keys(initialFormData).length > 0) {
      let backendValue = initialFormData.value || initialFormData.selectedValue;
      backendValue = convertBackendValue(backendValue, question.type, question.config);
      
      const isTextType = question.type === 'text' || 
                        question.type === 'cognitive_short_text' || 
                        question.type === 'cognitive_long_text';
      
      if (isTextType && (backendValue === null || backendValue === undefined)) {
        setValueInternal('');
      } else {
        setValueInternal(backendValue);
      }
      return;
    }

    if (hasLoadedData && formValues && Object.keys(formValues).length > 0) {
      const savedValue = formValues.value || formValues.selectedValue;
      
      const isTextType = question.type === 'text' || 
                        question.type === 'cognitive_short_text' || 
                        question.type === 'cognitive_long_text';
      
      if (isTextType && (savedValue === null || savedValue === undefined)) {
        setValueInternal('');
      } else {
        setValueInternal(savedValue);
      }
    }
  }, [currentStepKey, formValues, question.type, question.config, hasLoadedData, initialFormData, convertBackendValue]);

  return { 
    value, 
    setValue,
    getInitialValue,
    convertBackendValue 
  };
};