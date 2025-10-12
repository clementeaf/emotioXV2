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
  const [value, setValue] = React.useState<unknown>(null);

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

  // 🎯 FUNCIÓN PARA CONVERTIR VALORES DEL BACKEND
  const convertBackendValue = React.useCallback((
    backendValue: unknown, 
    questionType: string, 
    config?: QuestionConfig
  ): unknown => {
    if (questionType === 'emojis' && 
        config?.maxSelections && 
        config.maxSelections > 1 && 
        typeof backendValue === 'string') {
      return backendValue.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return backendValue;
  }, []);

  // 🎯 INICIALIZAR VALOR CUANDO CAMBIA LA PREGUNTA
  React.useEffect(() => {
    const initialValue = getInitialValue(question.type, question.config);
    setValue(initialValue);
  }, [currentStepKey, question.type, question.config, getInitialValue]);

  // 🎯 CARGAR DATOS DEL BACKEND O STORE LOCAL
  React.useEffect(() => {
    if (initialFormData && Object.keys(initialFormData).length > 0) {
      let backendValue = initialFormData.value || initialFormData.selectedValue;
      backendValue = convertBackendValue(backendValue, question.type, question.config);
      
      const isTextType = question.type === 'text' || 
                        question.type === 'cognitive_short_text' || 
                        question.type === 'cognitive_long_text';
      
      if (isTextType && (backendValue === null || backendValue === undefined)) {
        setValue('');
      } else {
        setValue(backendValue);
      }
      return;
    }

    if (hasLoadedData && formValues && Object.keys(formValues).length > 0) {
      const savedValue = formValues.value || formValues.selectedValue;
      
      const isTextType = question.type === 'text' || 
                        question.type === 'cognitive_short_text' || 
                        question.type === 'cognitive_long_text';
      
      if (isTextType && (savedValue === null || savedValue === undefined)) {
        setValue('');
      } else {
        setValue(savedValue);
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