import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApiClient } from '../lib/api';
import { ModuleResponse, useParticipantStore } from '../stores/participantStore';
import { UseModuleResponsesProps, UseModuleResponsesReturn } from '../types/hooks.types';

const apiClient = new ApiClient();

export const useModuleResponses = ({
  researchId,
  participantId,
  autoFetch = true
}: UseModuleResponsesProps): UseModuleResponsesReturn => {

  const setLoadedResponses = useParticipantStore(state => state.setLoadedResponses);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['moduleResponses', researchId, participantId],
    queryFn: async () => {
      if (!researchId || !participantId) {
        return null;
      }
      return apiClient.getModuleResponses(researchId, participantId);
    },
    enabled: autoFetch && !!researchId && !!participantId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (cacheTime se llama ahora gcTime)
  });

  // Efecto para sincronizar los datos de la API con el store de Zustand
  useEffect(() => {
    if (data?.data) {
      // La estructura real es: { data: { responses: [...] } }
      const responseDataObject = data.data as { responses?: unknown[] };
      const responses = responseDataObject?.responses || [];
      if (responses.length > 0) {
        setLoadedResponses(responses as ModuleResponse[]);
      }
    }
  }, [data, setLoadedResponses]);

  // DEVOLVER SIEMPRE EL ARRAY DE RESPUESTAS
  return {
    data: data?.data && Array.isArray((data.data as { responses?: unknown[] }).responses)
      ? (data.data as { responses?: unknown[] }).responses
      : [],
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
};
