import { useCallback } from 'react';

interface UseQuestionKeyProps {
  stepId: string;
  stepType: string;
  questionIndex?: number;
}

interface UseQuestionKeyReturn {
  questionKey: string;
  validateQuestionKey: (expectedStepId: string, expectedStepType: string) => boolean;
  generateQuestionKey: (stepId: string, stepType: string, questionIndex?: number) => string;
}

/**
 * Hook para manejar questionKey en componentes de preguntas
 * Previene mezcla de respuestas entre preguntas similares
 */
export const useQuestionKey = ({ stepId, stepType, questionIndex }: UseQuestionKeyProps): UseQuestionKeyReturn => {

  const generateQuestionKey = useCallback((stepId: string, stepType: string, questionIndex?: number): string => {
    const baseKey = `${stepId}_${stepType}`;
    return questionIndex !== undefined ? `${baseKey}_q${questionIndex}` : baseKey;
  }, []);

  const validateQuestionKey = useCallback((expectedStepId: string, expectedStepType: string): boolean => {
    const parts = stepId.split('_');
    if (parts.length < 2) return false;

    const actualStepId = parts[0];
    const actualStepType = parts[1];

    return actualStepId === expectedStepId && actualStepType === expectedStepType;
  }, [stepId]);

  const questionKey = generateQuestionKey(stepId, stepType, questionIndex);

  return {
    questionKey,
    validateQuestionKey,
    generateQuestionKey
  };
};
