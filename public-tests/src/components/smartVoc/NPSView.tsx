import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { MappedStepComponentProps } from '../../types/flow.types';
import { SmartVOCQuestion } from '../../types/smart-voc.types';
import { formatQuestionText } from '../../utils/formHelpers';

const NPSView: React.FC<MappedStepComponentProps> = ({
  stepConfig,
  onStepComplete,
  questionKey // NUEVO: questionKey para identificación única
}) => {
  // Convertir stepConfig a SmartVOCQuestion
  const question = stepConfig as SmartVOCQuestion;

  if (!question || !question.config) {
    return <div>Cargando configuración...</div>;
  }

  const questionText = question.title || '¿Qué tan probable es que recomiendes nuestro producto?';
  const instructions = question.instructions || question.config.instructions || '';
  const companyName = question.config.companyName || '';

  const npsLevels = [
    { value: 0, label: '0 - Muy improbable' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
    { value: 6, label: '6' },
    { value: 7, label: '7' },
    { value: 8, label: '8' },
    { value: 9, label: '9' },
    { value: 10, label: '10 - Muy probable' }
  ];

  console.log('[NPSView] 🔍 Debug info:', {
    questionType: question.type,
    questionId: question.id,
    questionTitle: question.title,
    questionKey, // NUEVO: Log questionKey
    stepName: question.title || 'NPS Question'
  });

  // NUEVO: Usar questionKey para el manejo de respuestas
  const {
    responseData,
    isSaving,
    error,
    saveCurrentStepResponse
  } = useStepResponseManager({
    stepId: question.id,
    stepType: 'nps',
    stepName: question.title || 'Net Promoter Score',
    researchId: undefined,
    participantId: undefined,
    questionKey, // NUEVO: Pasar questionKey del backend
  });

  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar respuesta previa si existe
  useEffect(() => {
    if (responseData && typeof responseData === 'object' && 'value' in responseData) {
      const prevRating = (responseData as { value: number }).value;
      setSelectedRating(prevRating);
    }
  }, [responseData]);

  const handleRatingChange = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleSubmit = async () => {
    if (selectedRating === null) {
      // actions.setError('Por favor selecciona una calificación'); // This line was removed as per the new_code
      return;
    }

    setIsSubmitting(true);
    // actions.setError(null); // This line was removed as per the new_code

    try {
      const responseData = {
        value: selectedRating,
        questionKey, // NUEVO: Incluir questionKey en la respuesta
        timestamp: Date.now(),
        metadata: {
          questionType: question.type,
          questionId: question.id,
          companyName,
          npsScore: selectedRating,
          npsCategory: selectedRating >= 9 ? 'Promoters' : selectedRating >= 7 ? 'Passives' : 'Detractors'
        }
      };

      console.log(`[NPSView] 🔑 Enviando respuesta con questionKey: ${questionKey}`, {
        rating: selectedRating,
        questionKey,
        questionId: question.id,
        npsCategory: responseData.metadata.npsCategory
      });

      const result = await saveCurrentStepResponse(responseData);

      if (result.success) {
        console.log(`[NPSView] ✅ Respuesta guardada exitosamente con questionKey: ${questionKey}`);
        onStepComplete?.(responseData);
      } else {
        console.error(`[NPSView] ❌ Error guardando respuesta con questionKey: ${questionKey}`);
        // actions.setError('Error al guardar la respuesta'); // This line was removed as per the new_code
      }
    } catch (error) {
      console.error(`[NPSView] 💥 Exception guardando respuesta con questionKey: ${questionKey}`, error);
      // actions.setError('Error inesperado al guardar la respuesta'); // This line was removed as per the new_code
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {formatQuestionText(questionText, companyName)}
          </h2>
          {instructions && (
            <p className="text-sm text-gray-600 mb-4">{instructions}</p>
          )}
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-11 gap-1">
            {npsLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => handleRatingChange(level.value)}
                className={`p-2 text-xs rounded transition-colors ${
                  selectedRating === level.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${level.value === 0 || level.value === 10 ? 'col-span-2' : ''}`}
              >
                <div className="text-center">
                  <div className="font-medium">{level.value}</div>
                  {(level.value === 0 || level.value === 10) && (
                    <div className="text-xs mt-1">{level.label.split(' - ')[1]}</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Muy improbable</span>
            <span>Muy probable</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={selectedRating === null || isSubmitting || isSaving}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            selectedRating === null || isSubmitting || isSaving
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSubmitting || isSaving ? 'Guardando...' : 'Continuar'}
        </button>

        {questionKey && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-500">
            <p>ID: {questionKey}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NPSView;
