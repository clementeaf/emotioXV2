import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { MappedStepComponentProps } from '../../types/flow.types';
import { SmartVOCQuestion } from '../../types/smart-voc.types';
import { formatQuestionText } from '../../utils/formHelpers';

const EmotionSelectionView: React.FC<MappedStepComponentProps> = ({
  stepConfig,
  onStepComplete,
  questionKey // NUEVO: questionKey para identificación única
}) => {
  // Convertir stepConfig a SmartVOCQuestion
  const question = stepConfig as SmartVOCQuestion;

  if (!question || !question.config) {
    return <div>Cargando configuración...</div>;
  }

  const questionText = question.title || '¿Qué emoción describes mejor tu experiencia?';
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

  console.log('[EmotionSelectionView] 🔍 Debug info:', {
    questionType: question.type,
    questionId: question.id,
    questionTitle: question.title,
    questionKey, // NUEVO: Log questionKey
    stepName: question.title || 'Emotion Selection Question'
  });

  // NUEVO: Usar questionKey para el manejo de respuestas
  const {
    responseData,
    isSaving,
    error,
    saveCurrentStepResponse
  } = useStepResponseManager({
    stepId: question.id,
    stepType: 'emotion-selection',
    stepName: question.title || 'Selección de Emoción',
    researchId: undefined,
    participantId: undefined,
    questionKey, // NUEVO: Pasar questionKey del backend
  });

  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar respuesta previa si existe
  useEffect(() => {
    if (responseData && typeof responseData === 'object' && 'value' in responseData) {
      const prevEmotion = (responseData as { value: string }).value;
      setSelectedEmotion(prevEmotion);
    }
  }, [responseData]);

  const handleEmotionChange = (emotion: string) => {
    setSelectedEmotion(emotion);
  };

  const handleSubmit = async () => {
    if (selectedEmotion === null) {
      // actions.setError('Por favor selecciona una emoción'); // This line was removed as per the new_code
      return;
    }

    setIsSubmitting(true);
    // actions.setError(null); // This line was removed as per the new_code

    try {
      const responseData = {
        value: selectedEmotion,
        questionKey, // NUEVO: Incluir questionKey en la respuesta
        timestamp: Date.now(),
        metadata: {
          questionType: question.type,
          questionId: question.id,
          companyName,
          selectedEmotion,
          emotionCategory: selectedEmotion === 'neutral' ? 'Neutral' :
                          ['joy', 'satisfaction', 'excitement'].includes(selectedEmotion) ? 'Positiva' : 'Negativa'
        }
      };

      console.log(`[EmotionSelectionView] 🔑 Enviando respuesta con questionKey: ${questionKey}`, {
        emotion: selectedEmotion,
        questionKey,
        questionId: question.id,
        emotionCategory: responseData.metadata.emotionCategory
      });

      const result = await saveCurrentStepResponse(responseData);

      if (result.success) {
        console.log(`[EmotionSelectionView] ✅ Respuesta guardada exitosamente con questionKey: ${questionKey}`);
        onStepComplete?.(responseData);
      } else {
        console.error(`[EmotionSelectionView] ❌ Error guardando respuesta con questionKey: ${questionKey}`);
        // actions.setError('Error al guardar la respuesta'); // This line was removed as per the new_code
      }
    } catch (error) {
      console.error(`[EmotionSelectionView] 💥 Exception guardando respuesta con questionKey: ${questionKey}`, error);
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
              >
                <div className="text-2xl mb-2">{emotion.emoji}</div>
                <div className="text-sm font-medium">{emotion.label}</div>
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
          disabled={selectedEmotion === null || isSubmitting || isSaving}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            selectedEmotion === null || isSubmitting || isSaving
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

export default EmotionSelectionView;
