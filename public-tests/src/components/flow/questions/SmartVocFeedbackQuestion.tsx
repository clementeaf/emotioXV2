import React, { useEffect, useState } from 'react';
import { useModuleResponses } from '../../../hooks/useModuleResponses';
import { useStepResponseManager } from '../../../hooks/useStepResponseManager';
import { useParticipantStore } from '../../../stores/participantStore';
import { MappedStepComponentProps } from '../../../types/flow.types';
import { getStandardButtonText } from '../../../utils/formHelpers';
import { createComponentLogger } from '../../../utils/logger';

const logger = createComponentLogger('SmartVocFeedbackQuestion');

export const SmartVocFeedbackQuestion: React.FC<MappedStepComponentProps> = ({
  stepConfig,
  stepName,
  onStepComplete,
  instructions,
  questionKey, // NUEVO: questionKey del backend
  stepId, // NUEVO: stepId del backend
  stepType, // NUEVO: stepType del backend
}) => {

  const cfg = (typeof stepConfig === 'object' && stepConfig !== null)
    ? stepConfig as {
        title?: string;
        description?: string;
        instructions?: string;
        questionText?: string;
        answerPlaceholder?: string;
        required?: boolean;
        isHardcoded?: boolean;
        savedResponses?: string;
        savedResponseId?: string;
        questionKey?: string; // NUEVO: questionKey del backend
      }
    : {};

  const finalInstructions = cfg.instructions || instructions;

  // NUEVO: Usar questionKey del backend si está disponible
  const backendQuestionKey = questionKey || cfg.questionKey || stepId || 'smartvoc-feedback';

  // NUEVO: Usar stepType del backend en lugar de hardcodear
  const backendStepType = stepType || 'smart-voc-feedback';

  // Utilidad para extraer el string de la respuesta
  function extractStringResponse(resp: any): string {
    if (typeof resp === 'string') return resp;
    if (resp && typeof resp === 'object') {
      if ('value' in resp && typeof resp.value === 'string') return resp.value;
      if ('response' in resp && typeof resp.response === 'string') return resp.response;
    }
    return '';
  }

  const [currentResponse, setCurrentResponse] = useState(() => {
    return extractStringResponse(cfg.savedResponses);
  });
  const [isSubmittingToServer, setIsSubmittingToServer] = useState(false);

  const researchId = useParticipantStore(state => state.researchId);
  const participantId = useParticipantStore(state => state.participantId);

  // Hook para poder invalidar cache después de guardar
  const { refetch } = useModuleResponses({ autoFetch: false });

  const {
    responseData,
    isLoading,
    isSaving,
    error: stepResponseError,
    saveCurrentStepResponse,
    responseSpecificId
  } = useStepResponseManager<string>({
    stepId: backendQuestionKey, // NUEVO: Usar questionKey del backend
    stepType: backendStepType, // NUEVO: Usar stepType del backend
    stepName: 'Comentarios',
    researchId: undefined,
    participantId: undefined,
  });

  // NUEVO: Log para debugging
  console.log(`[SmartVocFeedbackQuestion] 🔑 Usando questionKey: ${backendQuestionKey}, stepType: ${backendStepType}`, {
    questionKey,
    cfgQuestionKey: cfg.questionKey,
    stepId,
    backendQuestionKey,
    stepType,
    backendStepType
  });

    // useEffect para respuestas del useStepResponseManager
  useEffect(() => {
    setCurrentResponse(extractStringResponse(responseData));
  }, [responseData]);

  // useEffect para respuestas guardadas desde CurrentStepRenderer
  useEffect(() => {
    setCurrentResponse(extractStringResponse(cfg.savedResponses));
  }, [cfg.savedResponses]);


  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCurrentResponse(newValue);
  };

  // ✅ SIMPLIFICADO: Enviar respuesta usando useStepResponseManager
  const handleSaveAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stepConfig) {
      logger.error('Missing config');
      return;
    }

    if (!extractStringResponse(currentResponse).trim() && cfg.required) {
      logger.warn('Respuesta requerida pero vacía');
      return;
    }

    setIsSubmittingToServer(true);

    try {
      const { success } = await saveCurrentStepResponse(currentResponse);

      if (success) {
        // Invalidar cache de module responses para obtener datos frescos
        if (researchId && participantId) {
          try {
            await refetch();
          } catch (error) {
            logger.warn('Error invalidando cache', error);
          }
        }

        // Verificamos si onStepComplete existe antes de llamarlo
        if (onStepComplete) {
          onStepComplete(currentResponse);
        }
      } else {
        logger.error('Falló saveCurrentStepResponse');
      }
    } catch (error) {
      logger.error('Error guardando respuesta', error);
    } finally {
      setIsSubmittingToServer(false);
    }
  };

  const hasExistingData = !!responseSpecificId || !!cfg.savedResponses;

  const buttonText = getStandardButtonText({
    isSaving: isSaving,
    isLoading: isSubmittingToServer,
    hasExistingData,
    isNavigating: isSubmittingToServer,
    customCreateText: 'Guardar y continuar',
    customUpdateText: 'Actualizar y continuar'
  });

  if (isLoading && !responseData) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-medium text-neutral-800 mb-4">
          {cfg.title || stepName || 'Voice of Customer (VOC)'}
        </h2>
        <p className="text-center text-gray-500">Cargando respuestas previas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      {cfg.isHardcoded && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-800">
                <strong>Configuración por defecto:</strong> Esta pregunta está usando contenido predeterminado.
                Para personalizar el contenido, configúralo en el backend del research.
              </p>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-medium text-neutral-800 mb-4">
        {cfg.title || stepName || 'Voice of Customer (VOC)'}
      </h2>

      {(finalInstructions || cfg.description) && (
        <p className="text-neutral-600 mb-6">
          {finalInstructions || cfg.description}
        </p>
      )}

      {stepResponseError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="text-sm">Error: {stepResponseError}</p>
        </div>
      )}

      <form onSubmit={handleSaveAndProceed}>
        <div className="mb-6">
          <textarea
            value={currentResponse}
            onChange={handleTextChange}
            placeholder={cfg.answerPlaceholder || cfg.questionText || "Comparte tu experiencia, comentarios y sugerencias aquí..."}
            rows={6}
            className="w-full p-4 border border-neutral-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSaving || isLoading || isSubmittingToServer}
            required={cfg.required}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || isLoading || isSubmittingToServer || (!extractStringResponse(currentResponse).trim() && cfg.required)}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {buttonText}
          </button>
        </div>
      </form>
    </div>
  );
};
