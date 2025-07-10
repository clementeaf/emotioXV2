import React from 'react';

interface QuestionKeyValidatorProps {
  questionKey: string;
  expectedStepId: string;
  expectedStepType: string;
  children: React.ReactNode;
  onValidationError?: (error: string) => void;
}

/**
 * Componente para validar questionKey en preguntas
 * Previene mezcla de respuestas entre preguntas similares
 */
export const QuestionKeyValidator: React.FC<QuestionKeyValidatorProps> = ({
  questionKey,
  expectedStepId,
  expectedStepType,
  children,
  onValidationError
}) => {
  const validateQuestionKey = (): boolean => {
    if (!questionKey) {
      const error = 'questionKey no proporcionado';
      console.error(`[QuestionKeyValidator] ❌ ${error}`);
      onValidationError?.(error);
      return false;
    }

    const parts = questionKey.split('_');
    if (parts.length < 2) {
      const error = `questionKey inválido: ${questionKey}`;
      console.error(`[QuestionKeyValidator] ❌ ${error}`);
      onValidationError?.(error);
      return false;
    }

    const stepId = parts[0];
    const stepType = parts[1];

    if (stepId !== expectedStepId) {
      const error = `stepId no coincide: esperado ${expectedStepId}, recibido ${stepId}`;
      console.error(`[QuestionKeyValidator] ❌ ${error}`);
      onValidationError?.(error);
      return false;
    }

    if (stepType !== expectedStepType) {
      const error = `stepType no coincide: esperado ${expectedStepType}, recibido ${stepType}`;
      console.error(`[QuestionKeyValidator] ❌ ${error}`);
      onValidationError?.(error);
      return false;
    }

    console.log(`[QuestionKeyValidator] ✅ questionKey válido: ${questionKey}`);
    return true;
  };

  const isValid = validateQuestionKey();

  if (!isValid) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-800 font-medium">Error de Validación</h3>
        <p className="text-red-600 text-sm">
          No se pudo validar el identificador de la pregunta. Por favor, recarga la página.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
