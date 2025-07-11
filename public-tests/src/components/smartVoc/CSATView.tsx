import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { useParticipantStore } from '../../stores/participantStore';
import { MappedStepComponentProps } from '../../types/flow.types';
import { formatQuestionText } from '../../utils/formHelpers';
import FormSubmitButton from '../common/FormSubmitButton';
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

interface CSATViewProps extends MappedStepComponentProps {
  savedResponse?: any;
}

const CSATView: React.FC<CSATViewProps> = (props) => {
  const { stepConfig, onStepComplete, savedResponse } = props;
  const question = stepConfig as any;

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
    questionKey: question.questionKey, // NUEVO: Log questionKey
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
    questionKey: question.questionKey, // NUEVO: Pasar questionKey del backend
  });

  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);

  // Sincronizar selectedRating con savedResponse y responseData
  useEffect(() => {
    // Función auxiliar para extraer el valor de la respuesta
    const extractRatingValue = (response: any): number | null => {
      if (!response) return null;

      // Si es un objeto ModuleResponse (del store), extraer de response.response
      if (typeof response === 'object' && response !== null) {
        // Caso 1: Es un ModuleResponse con response.response
        if ('response' in response && typeof response.response === 'object' && response.response !== null) {
          if ('value' in response.response) {
            return response.response.value;
          }
        }

        // Caso 2: Es directamente el objeto de respuesta con value
        if ('value' in response) {
          return response.value;
        }

        // Caso 3: Es un número directo
        if (typeof response === 'number') {
          return response;
        }
      }

      // Caso 4: Es un número directo
      if (typeof response === 'number') {
        return response;
      }

      return null;
    };

    // Prioridad: savedResponse (prop) > responseData (hook)
    let rating = extractRatingValue(savedResponse) || extractRatingValue(responseData);

    console.log('[CSATView] 🔍 Extrayendo rating:', {
      savedResponse,
      responseData,
      extractedRating: rating
    });

    setSelectedRating(rating);
  }, [savedResponse, responseData]);

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
        questionKey: question.questionKey, // Usar SIEMPRE el de la pregunta
        timestamp: Date.now(),
        stepTitle: question.title || '', // Asegurar string
        metadata: {
          questionType: question.type,
          questionId: question.id,
          companyName,
          useStars
        }
      };

      const result = await saveCurrentStepResponse(responseData);

      if (result.success) {
        setSelectedRating(selectedRating); // Actualiza el estado local inmediatamente

        // NUEVO: Actualizar el store usando el setter de Zustand
        const store = useParticipantStore.getState();
        const setParticipantStore = useParticipantStore.setState;
        const currentResponses = store.responsesData.modules.all_steps || [];

        // Buscar si ya existe una respuesta con este questionKey
        const existingIndex = currentResponses.findIndex(r => r.questionKey === question.questionKey);

        const newResponse = {
          id: question.id || question.questionKey || 'unknown',
          stepTitle: question.title || '',
          stepType: question.type || 'smartvoc_csat',
          questionKey: question.questionKey || 'unknown',
          response: responseData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          participantId: store.participantId || undefined,
          researchId: store.researchId || undefined
        };

        let updatedResponses;
        if (existingIndex >= 0) {
          // Actualizar respuesta existente
          updatedResponses = [...currentResponses];
          updatedResponses[existingIndex] = newResponse;
        } else {
          // Agregar nueva respuesta
          updatedResponses = [...currentResponses, newResponse];
        }

        setParticipantStore(state => ({
          responsesData: {
            ...state.responsesData,
            modules: {
              ...state.responsesData.modules,
              all_steps: updatedResponses
            }
          }
        }));

        onStepComplete?.(responseData);
      } else {
        console.error(`[CSATView] ❌ Error guardando respuesta con questionKey: ${question.questionKey}`);
      }
    } catch (error) {
      console.error('[CSATView] Error guardando respuesta:', error);
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

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className='w-full flex justify-center'>
          <FormSubmitButton
          isSaving={isSubmitting || isSaving}
          hasExistingData={!!(responseData && typeof responseData === 'object' && 'value' in responseData)}
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

export default CSATView;
