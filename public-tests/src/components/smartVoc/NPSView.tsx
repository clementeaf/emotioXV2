import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { useParticipantStore } from '../../stores/participantStore';
import { MappedStepComponentProps } from '../../types/flow.types';
import { SmartVOCQuestion } from '../../types/smart-voc.types';
import { formatQuestionText } from '../../utils/formHelpers';
import FormSubmitButton from '../common/FormSubmitButton';
import { SatisfactionButton } from './SatisfactionButton'; // Reutilizado de CSATView

const NPSView: React.FC<MappedStepComponentProps> = ({
  stepConfig,
  onStepComplete,
  questionKey
}) => {
  const question = stepConfig as SmartVOCQuestion;

  if (!question || !question.config) {
    return <div>Cargando configuración...</div>;
  }

  const configTitle = ('title' in question.config && typeof question.config.title === 'string') ? question.config.title : '';
  const configDescription = ('description' in question.config && typeof question.config.description === 'string') ? question.config.description : '';
  const questionText = question.title || configTitle || configDescription || '¿Qué tan probable es que recomiendes nuestro producto?';
  const instructions = question.instructions || question.config.instructions || '';
  const companyName = question.config.companyName || '';

  // Escala NPS 0-10
  const npsValues = Array.from({ length: 11 }, (_, i) => i);
  const startLabel = 'Muy improbable';
  const endLabel = 'Muy probable';

  // Buscar la respuesta persistida directamente en el store Zustand
  const allSteps = useParticipantStore(state => state.responsesData.modules.all_steps || []);
  const moduleResponse = allSteps.find(r => r.questionKey === questionKey) || null;
  const extractSelectedRating = (resp: any): number | null => {
    if (resp && typeof resp === 'object' && resp.response && typeof resp.response === 'object' && 'value' in resp.response) {
      return resp.response.value;
    }
    return null;
  };
  const persistedRating = extractSelectedRating(moduleResponse);
  const [selectedRating, setSelectedRating] = useState<number | null>(persistedRating);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);

  // Sincroniza el estado local solo cuando cambia la respuesta persistida (ej: cambio de step)
  useEffect(() => {
    setSelectedRating(persistedRating);
  }, [persistedRating, questionKey]);

  const { isSaving, saveCurrentStepResponse } = useStepResponseManager({
    stepId: question.id,
    stepType: 'nps',
    stepName: question.title || 'Net Promoter Score',
    researchId: undefined,
    participantId: undefined,
    questionKey,
  });

  const handleRatingChange = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleSubmit = async () => {
    if (selectedRating === null) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const responseData = {
        value: selectedRating,
        questionKey,
        timestamp: Date.now(),
        stepTitle: question.title || '',
        metadata: {
          questionType: question.type,
          questionId: question.id,
          companyName,
          npsScore: selectedRating,
          npsCategory: selectedRating >= 9 ? 'Promoters' : selectedRating >= 7 ? 'Passives' : 'Detractors'
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
            {formatQuestionText(questionText, companyName)}
          </h2>
          {instructions && (
            <p className="text-sm text-gray-600 mb-4">{instructions}</p>
          )}
        </div>

        <div className="mb-6">
          <div className="flex flex-row justify-center items-end gap-4 w-full">
            {npsValues.map((value) => (
              <div key={value} className="flex flex-col items-center">
                <SatisfactionButton
                  value={value}
                  label=""
                  selected={selectedRating === value}
                  onClick={isSubmitting || isSaving ? () => {} : handleRatingChange}
                />
              </div>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="w-full flex justify-center mt-2">
          <FormSubmitButton
            isSaving={isSubmitting || isSaving}
            hasExistingData={!!(persistedRating !== null)}
            onClick={handleSubmit}
            disabled={selectedRating === null || isSubmitting || isSaving}
            customCreateText="Guardar y continuar"
            customUpdateText="Actualizar y continuar"
          />
        </div>
      </div>
    </div>
  );
};

export default NPSView;
