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
      const responseDataObject = data.data as { data?: { responses?: unknown[] } };
      const responses = responseDataObject?.data?.responses || [];
      if (responses.length > 0) {
        setLoadedResponses(responses as ModuleResponse[]);
      }
    }
  }, [data, setLoadedResponses]);

  return {
    data: data?.data ? (data.data as { data?: { responses?: unknown[] } })?.data?.responses : [],
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
};
