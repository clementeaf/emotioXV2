import React, { useEffect, useState } from 'react';
import { useModuleResponses } from '../../../hooks/useModuleResponses';
import { useStepResponseManager } from '../../../hooks/useStepResponseManager';
import { useParticipantStore } from '../../../stores/participantStore';
import { ComponentSmartVocFeedbackQuestionProps } from '../../../types/flow.types';
import { getStandardButtonText } from '../../../utils/formHelpers';
import { createComponentLogger } from '../../../utils/logger';

const logger = createComponentLogger('SmartVocFeedbackQuestion');

export const SmartVocFeedbackQuestion: React.FC<ComponentSmartVocFeedbackQuestionProps> = ({
  config,
  stepName,
  onStepComplete
  // isMock
}) => {

  const cfg = (typeof config === 'object' && config !== null)
    ? config as {
        title?: string;
        description?: string;
        questionText?: string;
        answerPlaceholder?: string;
        required?: boolean;
        isHardcoded?: boolean;
        savedResponses?: string;
        savedResponseId?: string;
      }
    : {};

  const [currentResponse, setCurrentResponse] = useState(() => {
    return cfg.savedResponses || '';
  });
  const [isSubmittingToServer, setIsSubmittingToServer] = useState(false);

  const researchId = useParticipantStore(state => state.researchId);
  const participantId = useParticipantStore(state => state.participantId);

  // Hook para poder invalidar cache después de guardar
  const { fetchResponses } = useModuleResponses({ autoFetch: false });

  const {
    responseData,
    isLoading,
    isSaving,
    error: stepResponseError,
    saveCurrentStepResponse,
    responseSpecificId
  } = useStepResponseManager<string>({
    stepId: 'smartvoc_feedback',
    stepType: 'smartvoc_feedback',
    stepName: stepName || cfg.title || 'Voice of Customer (VOC)',
    initialData: ''
  });

    // useEffect para respuestas del useStepResponseManager
  useEffect(() => {
    if (responseData && typeof responseData === 'string') {
      setCurrentResponse(responseData);
    } else if (responseData) {
      if (typeof responseData === 'object' && responseData !== null && 'value' in responseData) {
        const extractedValue = (responseData as { value?: unknown }).value;
        if (typeof extractedValue === 'string') {
          setCurrentResponse(extractedValue);
        }
      }
    }
  }, [responseData]);

  // useEffect para respuestas guardadas desde CurrentStepRenderer
  useEffect(() => {
    console.log(`🔍 [SmartVocFeedbackQuestion] useEffect savedResponses:`, {
      savedResponses: cfg.savedResponses,
      savedResponsesType: typeof cfg.savedResponses,
      willUpdate: cfg.savedResponses !== undefined
    });
    if (cfg.savedResponses !== undefined) {
      console.log(`✅ [SmartVocFeedbackQuestion] Actualizando currentResponse a:`, cfg.savedResponses);
      setCurrentResponse(cfg.savedResponses);
    }
  }, [cfg.savedResponses]);


  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCurrentResponse(newValue);
  };

  // ✅ SIMPLIFICADO: Enviar respuesta usando useStepResponseManager
  const handleSaveAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!config) {
      logger.error('Missing config');
      return;
    }

    if (!currentResponse.trim() && cfg.required) {
      logger.warn('Respuesta requerida pero vacía');
      return;
    }

    setIsSubmittingToServer(true);

    try {
      const { success } = await saveCurrentStepResponse(currentResponse);

      if (success) {
        console.log(`🔄 [SmartVocFeedbackQuestion] Invalidando cache después de guardar exitosamente`);

        // Invalidar cache de module responses para obtener datos frescos
        if (researchId && participantId) {
          try {
            fetchResponses(researchId, participantId);
          } catch (error) {
            console.warn(`⚠️ [SmartVocFeedbackQuestion] Error invalidando cache:`, error);
          }
        }

        onStepComplete(currentResponse);
      } else {
        console.error("[SmartVocFeedbackQuestion] Falló saveCurrentStepResponse. Error debería estar en stepResponseError.");
      }
    } catch (error) {
      logger.error('Error guardando respuesta', error);
    } finally {
      setIsSubmittingToServer(false);
    }
  };

  const buttonText = getStandardButtonText({
    isSaving: isSaving,
    isLoading: isSubmittingToServer,
    hasExistingData: !!responseSpecificId || !!cfg.savedResponses || currentResponse !== '',
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

      {cfg.description && (
        <p className="text-neutral-600 mb-6">
          {cfg.description}
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
            disabled={isSaving || isLoading || isSubmittingToServer || (!currentResponse.trim() && cfg.required)}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {buttonText}
          </button>
        </div>
      </form>
    </div>
  );
};
