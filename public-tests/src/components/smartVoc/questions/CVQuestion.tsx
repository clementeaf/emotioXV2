import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../../hooks/useStepResponseManager';
import { MappedStepComponentProps } from '../../../types/flow.types';
import { SmartVOCQuestion } from '../../../types/smart-voc.types';
import { formatQuestionText } from '../../../utils/formHelpers';
import FormSubmitButton from '../../common/FormSubmitButton';

const CVQuestion: React.FC<MappedStepComponentProps> = ({
  stepConfig,
  onStepComplete,
  questionKey
}) => {
  const question = stepConfig as SmartVOCQuestion;

  if (!question || !question.config) {
    return <div>Cargando configuración...</div>;
  }

  const questionText = question.title || '¿Cómo calificarías el valor recibido?';
  const instructions = question.instructions || question.config.instructions || '';
  const companyName = question.config.companyName || '';

  // Escala dinámica según config.scaleRange
  const agreementLevels = (
    typeof question?.config?.scaleRange?.start === 'number' &&
    typeof question?.config?.scaleRange?.end === 'number'
  )
    ? Array.from(
        { length: (question.config!.scaleRange!.end as number) - (question.config!.scaleRange!.start as number) + 1 },
        (_, i) => (question.config!.scaleRange!.start as number) + i
      )
    : [1, 2, 3, 4, 5];

  const {
    responseData,
    isSaving,
    error,
    saveCurrentStepResponse
  } = useStepResponseManager({
    stepId: question.id,
    stepType: 'cv-question',
    stepName: question.title || 'Pregunta CV',
    researchId: undefined,
    participantId: undefined,
    questionKey,
  });

  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        questionKey,
        timestamp: Date.now(),
        metadata: {
          questionType: question.type,
          questionId: question.id,
          companyName,
          cvScore: selectedRating,
          agreementLevel: selectedRating <= 2 ? 'Desacuerdo' : selectedRating >= 4 ? 'Acuerdo' : 'Neutral'
        }
      };

      const result = await saveCurrentStepResponse(responseData);

      if (result.success) {
        console.log(`[CVQuestion] ✅ Respuesta guardada exitosamente con questionKey: ${questionKey}`);
        onStepComplete?.(responseData);
      } else {
        console.error(`[CVQuestion] ❌ Error guardando respuesta con questionKey: ${questionKey}`);
      }
    } catch (error) {
      console.error(`[CVQuestion] 💥 Exception guardando respuesta con questionKey: ${questionKey}`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasExistingData = !!(responseData && typeof responseData === 'object' && 'value' in responseData && responseData.value !== null && responseData.value !== undefined);

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
          {agreementLevels.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => handleRatingChange(level)}
              className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-colors text-lg font-semibold focus:outline-none
                ${selectedRating === level
                  ? 'bg-blue-600 border-blue-700 text-white shadow-lg'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'}
              `}
              aria-label={`Seleccionar ${level}`}
            >
              {level}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Botón de submit usando FormSubmitButton */}
        <div className="w-full flex justify-center mt-2">
          <FormSubmitButton
            isSaving={isSubmitting || isSaving}
            hasExistingData={hasExistingData}
            onClick={handleSubmit}
            disabled={selectedRating === null}
            customCreateText="Guardar y continuar"
            customUpdateText="Actualizar y continuar"
          />
        </div>
      </div>
    </div>
  );
};

export default CVQuestion;
