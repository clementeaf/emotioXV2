import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../../hooks/useStepResponseManager';
import { useParticipantStore } from '../../../stores/participantStore';
import { MappedStepComponentProps } from '../../../types/flow.types';
import { formatQuestionText } from '../../../utils/formHelpers';
import FormSubmitButton from '../../common/FormSubmitButton';

export const SmartVocFeedbackQuestion: React.FC<MappedStepComponentProps> = ({
  stepConfig,
  onStepComplete,
  questionKey
}) => {
  const question = stepConfig as any;

  if (!question) {
    return <div>Cargando configuración...</div>;
  }

  const configTitle = ('title' in question && typeof question.title === 'string') ? question.title : '';
  const configDescription = ('description' in question && typeof question.description === 'string') ? question.description : '';
  const questionText = configTitle || configDescription || 'Comparte tu experiencia, comentarios y sugerencias aquí...';
  const instructions = question.instructions || '';
  const answerPlaceholder = question.answerPlaceholder || question.questionText || 'Comparte tu experiencia, comentarios y sugerencias aquí...';
  const required = question.required;

  // Buscar la respuesta persistida directamente en el store Zustand
  const allSteps = useParticipantStore(state => state.responsesData.modules.all_steps || []);
  const moduleResponse = allSteps.find(r => r.questionKey === questionKey) || null;
  const extractStringResponse = (resp: any): string => {
    if (typeof resp === 'string') return resp;
    if (resp && typeof resp === 'object') {
      if ('value' in resp && typeof resp.value === 'string') return resp.value;
      if ('response' in resp && typeof resp.response === 'string') return resp.response;
    }
    return '';
  };
  const persistedResponse = extractStringResponse(moduleResponse?.response ?? moduleResponse);
  // Log para depuración
  console.log('[VOC] moduleResponse:', moduleResponse);
  console.log('[VOC] persistedResponse:', persistedResponse);
  const [currentResponse, setCurrentResponse] = useState<string>(persistedResponse);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);

  // Sincroniza el estado local solo cuando cambia la respuesta persistida (ej: cambio de step)
  useEffect(() => {
    setCurrentResponse(persistedResponse);
  }, [persistedResponse, moduleResponse, questionKey]);

  const { isSaving, saveCurrentStepResponse } = useStepResponseManager({
    stepId: question.id || questionKey,
    stepType: 'feedback',
    stepName: question.title || 'Comentarios',
    researchId: undefined,
    participantId: undefined,
    questionKey,
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentResponse(e.target.value);
  };

  const handleSubmit = async () => {
    if (required && !currentResponse.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const responseData = {
        value: currentResponse,
        questionKey,
        timestamp: Date.now(),
        stepTitle: question.title || '',
        metadata: {
          questionType: question.type,
          questionId: question.id
        }
      };
      await saveCurrentStepResponse(responseData);
      onStepComplete?.(responseData);
    } catch (e) {
      setError('Error guardando la respuesta. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="max-w-md w-full p-6 mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {formatQuestionText(questionText, '')}
          </h2>
          {instructions && (
            <p className="text-sm text-gray-600 mb-4">{instructions}</p>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{errorMessage}</p>
          </div>
        )}

        <textarea
          value={currentResponse}
          onChange={handleTextChange}
          placeholder={answerPlaceholder}
          rows={6}
          className="w-full p-4 border border-neutral-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          disabled={isSaving || isSubmitting}
          required={required}
        />

        <div className="w-full flex justify-center mt-2">
          <FormSubmitButton
            isSaving={isSubmitting || isSaving}
            hasExistingData={!!(persistedResponse && persistedResponse.trim())}
            onClick={handleSubmit}
            disabled={required ? !currentResponse.trim() || isSubmitting || isSaving : isSubmitting || isSaving}
            customCreateText="Guardar y continuar"
            customUpdateText="Actualizar y continuar"
          />
        </div>
      </div>
    </div>
  );
};
