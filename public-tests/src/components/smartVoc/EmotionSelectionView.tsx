import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { useParticipantStore } from '../../stores/participantStore';
import { MappedStepComponentProps } from '../../types/flow.types';
import { SmartVOCQuestion } from '../../types/smart-voc.types';
import { formatQuestionText } from '../../utils/formHelpers';
import FormSubmitButton from '../common/FormSubmitButton';

const EmotionSelectionView: React.FC<MappedStepComponentProps> = ({
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
  const questionText = question.title || configTitle || configDescription || '¿Qué emoción describe mejor tu experiencia?';
  const instructions = question.instructions || question.config.instructions || '';
  const companyName = question.config.companyName || '';

  const emotions = [
    { value: 'joy', label: 'Alegría', emoji: '😊' },
    { value: 'satisfaction', label: 'Satisfacción', emoji: '😌' },
    { value: 'excitement', label: 'Emoción', emoji: '🤩' },
    { value: 'frustration', label: 'Frustración', emoji: '😤' },
    { value: 'confusion', label: 'Confusión', emoji: '😕' },
    { value: 'disappointment', label: 'Decepción', emoji: '😞' },
    { value: 'anger', label: 'Enojo', emoji: '😠' },
    { value: 'surprise', label: 'Sorpresa', emoji: '😲' },
    { value: 'neutral', label: 'Neutral', emoji: '😐' }
  ];

  // Buscar la respuesta persistida directamente en el store Zustand
  const allSteps = useParticipantStore(state => state.responsesData.modules.all_steps || []);
  const moduleResponse = allSteps.find(r => r.questionKey === questionKey) || null;
  const extractSelectedEmotion = (resp: any): string | null => {
    if (resp && typeof resp === 'object' && resp.response && typeof resp.response === 'object' && 'value' in resp.response) {
      return resp.response.value;
    }
    return null;
  };
  const persistedEmotion = extractSelectedEmotion(moduleResponse);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(persistedEmotion);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);

  // Sincroniza el estado local solo cuando cambia la respuesta persistida (ej: cambio de step)
  useEffect(() => {
    setSelectedEmotion(persistedEmotion);
  }, [persistedEmotion, questionKey]);

  const { isSaving, saveCurrentStepResponse } = useStepResponseManager({
    stepId: question.id,
    stepType: 'emotion-selection',
    stepName: question.title || 'Selección de Emoción',
    researchId: undefined,
    participantId: undefined,
    questionKey,
  });

  const handleEmotionChange = (emotion: string) => {
    setSelectedEmotion(emotion);
  };

  const handleSubmit = async () => {
    if (selectedEmotion === null) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const responseData = {
        value: selectedEmotion,
        questionKey,
        timestamp: Date.now(),
        stepTitle: question.title || '',
        metadata: {
          questionType: question.type,
          questionId: question.id,
          companyName,
          selectedEmotion,
          emotionCategory: selectedEmotion === 'neutral' ? 'Neutral' :
            ['joy', 'satisfaction', 'excitement'].includes(selectedEmotion) ? 'Positiva' : 'Negativa'
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

        <div className="mb-6">
          <div className="grid grid-cols-3 gap-3">
            {emotions.map((emotion) => (
              <button
                key={emotion.value}
                onClick={() => handleEmotionChange(emotion.value)}
                className={`p-4 rounded-lg border transition-colors text-center ${
                  selectedEmotion === emotion.value
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                aria-label={emotion.label}
                disabled={isSubmitting || isSaving}
              >
                <div className="text-2xl mb-2">{emotion.emoji}</div>
                <div className="text-sm font-medium">{emotion.label}</div>
              </button>
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
            hasExistingData={!!(persistedEmotion !== null)}
            onClick={handleSubmit}
            disabled={selectedEmotion === null || isSubmitting || isSaving}
            customCreateText="Guardar y continuar"
            customUpdateText="Actualizar y continuar"
          />
        </div>
      </div>
    </div>
  );
};

export default EmotionSelectionView;
