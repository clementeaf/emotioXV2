import { useEffect } from 'react';
import { useStepStore } from '../stores/useStepStore';
import { useTestStore } from '../stores/useTestStore';
import { useModuleResponsesQuery } from './useApiQueries';

export const useStepStoreWithBackend = () => {
  const { researchId, participantId } = useTestStore();
  const { updateBackendResponses, currentQuestionKey, getSteps } = useStepStore();

  // Query para obtener respuestas del backend
  const { data: moduleResponses, isLoading, error } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  // Actualizar el store cuando cambien las respuestas del backend
  useEffect(() => {
    if (moduleResponses?.responses) {
      const responses = moduleResponses.responses.filter(response => response != null);
      updateBackendResponses(responses);
    }
  }, [moduleResponses, updateBackendResponses, researchId, participantId, currentQuestionKey]);

  return {
    isLoading,
    error
  };
};
