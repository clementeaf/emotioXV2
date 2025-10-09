import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFormDataStore } from '../stores/useFormDataStore';
import { useStepStore } from '../stores/useStepStore';
import { useTestStore } from '../stores/useTestStore';
import { useModuleResponsesQuery } from './useApiQueries';

export const useStepStoreWithBackend = () => {
  const { researchId, participantId } = useTestStore();
  const { updateBackendResponses } = useStepStore();
  const queryClient = useQueryClient();

  // 🎯 LIMPIAR CACHE DE REACT QUERY CUANDO CAMBIE EL PARTICIPANTE
  useEffect(() => {
    if (participantId) {
      console.log('[useStepStoreWithBackend] 🧹 Clearing React Query cache for new participant:', participantId);
      queryClient.removeQueries({ queryKey: ['moduleResponses'] });
    }
  }, [participantId, queryClient]);

  // Query para obtener respuestas del backend
  const { data: moduleResponses, isLoading, error } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  // 🎯 SINGLE RESPONSIBILITY: Solo sincronizar backend → store
  useEffect(() => {
    console.log('[useStepStoreWithBackend] 🔍 Evaluating sync conditions:', {
      hasModuleResponses: !!moduleResponses,
      hasResponses: !!moduleResponses?.responses,
      responsesType: typeof moduleResponses?.responses,
      responsesIsArray: Array.isArray(moduleResponses?.responses),
      responsesLength: moduleResponses?.responses?.length,
      researchId,
      participantId,
      moduleResponses
    });

    if (moduleResponses?.responses && researchId && participantId) {
      console.log('[useStepStoreWithBackend] 🔄 Sincronizando con backend:', {
        responsesCount: moduleResponses.responses.length,
        questionKeys: moduleResponses.responses.map((r: { questionKey: string }) => r.questionKey)
      });

      const backendResponses = moduleResponses.responses.map((response: { questionKey: string; response: unknown }) => {
        return {
          questionKey: response.questionKey,
          response: response.response || {}
        };
      });

      updateBackendResponses(backendResponses);

      // 🎯 SINCRONIZAR CON FORM DATA STORE
      // 🎯 SOLO BACKEND - NO STORE LOCAL
      // Los datos se manejan directamente desde el backend
      // No se guardan en store local
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleResponses?.responses, researchId, participantId, updateBackendResponses]);

  return {
    isLoading,
    error
  };
};
