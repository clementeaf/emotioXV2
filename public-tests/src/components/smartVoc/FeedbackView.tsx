import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { MappedStepComponentProps } from '../../types/flow.types';
import { SmartVOCQuestion } from '../../types/smart-voc.types';
import { formatQuestionText } from '../../utils/formHelpers';

const FeedbackView: React.FC<MappedStepComponentProps> = ({
  stepConfig,
  onStepComplete,
  questionKey // NUEVO: questionKey para identificación única
}) => {
  // Convertir stepConfig a SmartVOCQuestion
  const question = stepConfig as SmartVOCQuestion;

  if (!question || !question.config) {
    return <div>Cargando configuración...</div>;
  }

  const questionText = question.title || '¿Tienes algún comentario o sugerencia?';
  const instructions = question.instructions || question.config.instructions || '';
  const companyName = question.config.companyName || '';
  const placeholder = question.config.placeholder || 'Escribe tu comentario aquí...';
  const maxLength = question.config.maxLength || 500;

  console.log('[FeedbackView] 🔍 Debug info:', {
    questionType: question.type,
    questionId: question.id,
    questionTitle: question.title,
    questionKey, // NUEVO: Log questionKey
    stepName: question.title || 'Feedback Question'
  });

  // NUEVO: Usar questionKey para el manejo de respuestas
  const {
    responseData,
    isSaving,
    error,
    saveCurrentStepResponse
  } = useStepResponseManager({
    stepId: question.id,
    stepType: 'feedback',
    stepName: question.title || 'Comentarios',
    researchId: undefined,
    participantId: undefined,
    questionKey, // NUEVO: Pasar questionKey del backend
  });

  const [feedback, setFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar respuesta previa si existe
  useEffect(() => {
    if (responseData && typeof responseData === 'object' && 'value' in responseData) {
      const prevFeedback = (responseData as { value: string }).value;
      setFeedback(prevFeedback);
    }
  }, [responseData]);

  const handleFeedbackChange = (value: string) => {
    setFeedback(value);
  };

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      // actions.setError('Por favor escribe un comentario'); // This line was removed as per the new_code
      return;
    }

    setIsSubmitting(true);
    // actions.setError(null); // This line was removed as per the new_code

    try {
      const responseData = {
        value: feedback.trim(),
        questionKey, // NUEVO: Incluir questionKey en la respuesta
        timestamp: Date.now(),
        metadata: {
          questionType: question.type,
          questionId: question.id,
          companyName,
          feedbackLength: feedback.length,
          hasFeedback: feedback.trim().length > 0
        }
      };

      console.log(`[FeedbackView] 🔑 Enviando respuesta con questionKey: ${questionKey}`, {
        feedbackLength: feedback.length,
        questionKey,
        questionId: question.id,
        hasFeedback: responseData.metadata.hasFeedback
      });

      const result = await saveCurrentStepResponse(responseData);

      if (result.success) {
        console.log(`[FeedbackView] ✅ Respuesta guardada exitosamente con questionKey: ${questionKey}`);
        onStepComplete?.(responseData);
      } else {
        console.error(`[FeedbackView] ❌ Error guardando respuesta con questionKey: ${questionKey}`);
        // actions.setError('Error al guardar la respuesta'); // This line was removed as per the new_code
      }
    } catch (error) {
      console.error(`[FeedbackView] 💥 Exception guardando respuesta con questionKey: ${questionKey}`, error);
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
          <textarea
            value={feedback}
            onChange={(e) => handleFeedbackChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Comentario opcional</span>
            <span>{feedback.length}/{maxLength}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!feedback.trim() || isSubmitting || isSaving}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            !feedback.trim() || isSubmitting || isSaving
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

export default FeedbackView;
