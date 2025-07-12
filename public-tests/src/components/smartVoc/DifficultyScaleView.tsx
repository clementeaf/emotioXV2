import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { useParticipantStore } from '../../stores/participantStore';
import { MappedStepComponentProps } from '../../types/flow.types';
import { SmartVOCQuestion } from '../../types/smart-voc.types';
import { formatQuestionText } from '../../utils/formHelpers';
import FormSubmitButton from '../common/FormSubmitButton';

const DifficultyScaleView: React.FC<MappedStepComponentProps> = ({
  stepConfig,
  onStepComplete,
  questionKey
}) => {
  const question = stepConfig as SmartVOCQuestion;

  if (!question || !question.config) {
    return <div>Cargando configuración...</div>;
  }

  // Definir questionText e instructions igual que CSATView/AgreementScaleView
  const configTitle = ('title' in question.config && typeof question.config.title === 'string') ? question.config.title : '';
  const configDescription = ('description' in question.config && typeof question.config.description === 'string') ? question.config.description : '';
  const questionText = question.title || configTitle || configDescription || '¿Qué tan fácil fue completar esta tarea?';
  const instructions = question.instructions || question.config.instructions || '';
  const companyName = question.config.companyName || '';
  const difficultyLevels = [
    { value: 1, label: 'Muy difícil' },
    { value: 2, label: 'Difícil' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Fácil' },
    { value: 5, label: 'Muy fácil' }
  ];

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
    stepType: 'difficulty-scale',
    stepName: question.title || 'Escala de Dificultad',
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
          cesScore: selectedRating,
          difficultyLevel: selectedRating <= 2 ? 'Difícil' : selectedRating >= 4 ? 'Fácil' : 'Neutral'
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
      <div className="max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {formatQuestionText(questionText, companyName)}
          </h2>
          {instructions && (
            <p className="text-sm text-gray-600 mb-4">{instructions}</p>
          )}
        </div>

        <div className="mb-6 flex flex-row items-center justify-center gap-4">
          {difficultyLevels.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => handleRatingChange(level.value)}
              className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-colors text-lg font-semibold focus:outline-none
                ${selectedRating === level.value
                  ? 'bg-blue-600 border-blue-700 text-white shadow-lg'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'}
              `}
              aria-label={`Seleccionar ${level.value} - ${level.label}`}
              title={level.label}
            >
              {level.value}
            </button>
          ))}
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
            disabled={selectedRating === null || isSubmitting}
            customCreateText="Guardar y continuar"
            customUpdateText="Actualizar y continuar"
          />
        </div>
      </div>
    </div>
  );
};

export default DifficultyScaleView;
