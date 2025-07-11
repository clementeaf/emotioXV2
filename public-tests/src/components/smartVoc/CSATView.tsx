import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { MappedStepComponentProps } from '../../types/flow.types';
import { SmartVOCQuestion } from '../../types/smart-voc.types';
import { formatQuestionText } from '../../utils/formHelpers';
import { StarRating } from './StarRating';

// Mapeo de tipos SmartVOC para asegurar consistencia
const smartVOCTypeMap: { [key: string]: string } = {
  'CSAT': 'smartvoc_csat',
  'CES': 'smartvoc_ces',
  'CV': 'smartvoc_cv',
  'NPS': 'smartvoc_nps',
  'NEV': 'smartvoc_nev',
  'VOC': 'smartvoc_feedback',
};

const CSATView: React.FC<MappedStepComponentProps> = ({
  stepConfig,
  onStepComplete,
  questionKey // NUEVO: questionKey para identificación única
}) => {
  // Convertir stepConfig a SmartVOCQuestion
  const question = stepConfig as SmartVOCQuestion;

  if (!question || !question.config) {
    return <div>Cargando configuración...</div>;
  }

  const questionText = question.title || 'Valora tu satisfacción';
  const instructions = question.instructions || question.config.instructions || '';
  const companyName = question.config.companyName || '';
  const useStars = question.config.type === 'stars';

  const satisfactionLevels = [
    { value: 1, label: 'Muy insatisfecho' },
    { value: 2, label: 'Insatisfecho' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Satisfecho' },
    { value: 5, label: 'Muy satisfecho' }
  ];

  // Aplicar mapeo correcto del stepType
  const mappedStepType = smartVOCTypeMap[question.type || 'CSAT'] || 'smartvoc_csat';

  console.log('[CSATView] 🔍 Debug info:', {
    questionType: question.type,
    mappedStepType,
    questionId: question.id,
    questionTitle: question.title,
    questionKey, // NUEVO: Log questionKey
    stepName: question.title || 'Valora tu satisfacción'
  });

  // NUEVO: Usar questionKey para el manejo de respuestas
  const {
    responseData,
    isSaving,
    error,
    saveCurrentStepResponse
  } = useStepResponseManager({
    stepId: question.id,
    stepType: 'csat',
    stepName: question.title || 'Valora tu satisfacción',
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
      return;
    }

    setIsSubmitting(true);

    try {
      const responseData = {
        value: selectedRating,
        questionKey, // NUEVO: Incluir questionKey en la respuesta
        timestamp: Date.now(),
        metadata: {
          questionType: question.type,
          questionId: question.id,
          companyName,
          useStars
        }
      };

      console.log(`[CSATView] 🔑 Enviando respuesta con questionKey: ${questionKey}`, {
        rating: selectedRating,
        questionKey,
        questionId: question.id
      });

      const result = await saveCurrentStepResponse(responseData);

      if (result.success) {
        console.log(`[CSATView] ✅ Respuesta guardada exitosamente con questionKey: ${questionKey}`);
        onStepComplete?.(responseData);
      } else {
        console.error(`[CSATView] ❌ Error guardando respuesta con questionKey: ${questionKey}`);
      }
    } catch (error) {
      console.error(`[CSATView] 💥 Exception guardando respuesta con questionKey: ${questionKey}`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
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
          {useStars ? (
            <StarRating
              rating={selectedRating || 0}
              onRatingChange={handleRatingChange}
              maxRating={5}
            />
          ) : (
            <div className="space-y-3">
              {satisfactionLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => handleRatingChange(level.value)}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    selectedRating === level.value
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{level.value}</span>
                    <span className="text-sm text-gray-600">{level.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
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
      </div>
    </div>
  );
};

export default CSATView;
