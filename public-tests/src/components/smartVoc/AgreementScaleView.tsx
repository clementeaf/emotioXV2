import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { MappedStepComponentProps } from '../../types/flow.types';
import { SmartVOCQuestion } from '../../types/smart-voc.types';
import { formatQuestionText } from '../../utils/formHelpers';

const AgreementScaleView: React.FC<MappedStepComponentProps> = ({
  stepConfig,
  onStepComplete,
  questionKey // NUEVO: questionKey para identificación única
}) => {
  // Convertir stepConfig a SmartVOCQuestion
  const question = stepConfig as SmartVOCQuestion;

  if (!question || !question.config) {
    return <div>Cargando configuración...</div>;
  }

  const questionText = question.title || '¿Qué tan de acuerdo estás con esta afirmación?';
  const instructions = question.instructions || question.config.instructions || '';
  const companyName = question.config.companyName || '';

  const agreementLevels = [
    { value: 1, label: 'Totalmente en desacuerdo' },
    { value: 2, label: 'En desacuerdo' },
    { value: 3, label: 'Ni de acuerdo ni en desacuerdo' },
    { value: 4, label: 'De acuerdo' },
    { value: 5, label: 'Totalmente de acuerdo' }
  ];

  console.log('[AgreementScaleView] 🔍 Debug info:', {
    questionType: question.type,
    questionId: question.id,
    questionTitle: question.title,
    questionKey, // NUEVO: Log questionKey
    stepName: question.title || 'Agreement Scale Question'
  });

  // NUEVO: Usar questionKey para el manejo de respuestas
  const {
    responseData,
    isSaving,
    error,
    saveCurrentStepResponse
  } = useStepResponseManager({
    stepId: question.id,
    stepType: 'agreement-scale',
    stepName: question.title || 'Escala de Acuerdo',
    researchId: undefined,
    participantId: undefined,
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
      // actions.setError('Por favor selecciona una opción'); // This line was removed as per the new_code
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
          cvScore: selectedRating,
          agreementLevel: selectedRating <= 2 ? 'Desacuerdo' : selectedRating >= 4 ? 'Acuerdo' : 'Neutral'
        }
      };

      console.log(`[AgreementScaleView] 🔑 Enviando respuesta con questionKey: ${questionKey}`, {
        rating: selectedRating,
        questionKey,
        questionId: question.id,
        agreementLevel: responseData.metadata.agreementLevel
      });

      const result = await saveCurrentStepResponse(responseData);

      if (result.success) {
        console.log(`[AgreementScaleView] ✅ Respuesta guardada exitosamente con questionKey: ${questionKey}`);
        onStepComplete?.(responseData);
      } else {
        console.error(`[AgreementScaleView] ❌ Error guardando respuesta con questionKey: ${questionKey}`);
        // actions.setError('Error al guardar la respuesta'); // This line was removed as per the new_code
      }
    } catch (error) {
      console.error(`[AgreementScaleView] 💥 Exception guardando respuesta con questionKey: ${questionKey}`, error);
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
          <div className="space-y-3">
            {agreementLevels.map((level) => (
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

export default AgreementScaleView;
