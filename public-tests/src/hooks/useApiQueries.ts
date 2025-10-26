import { useMutation, UseMutationOptions, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  deleteAllResponses,
  getAvailableForms,
  getModuleResponses,
  saveModuleResponse,
  updateModuleResponse
} from '../lib/routes';
import {
  AvailableFormsResponse,
  CreateModuleResponseDto,
  ParticipantResponsesDocument,
  UpdateModuleResponseDto,
} from '../lib/types';
import { useFormDataStore } from '../stores/useFormDataStore';

export function useAvailableFormsQuery(researchId: string, options?: UseQueryOptions<AvailableFormsResponse, Error>) {
  return useQuery<AvailableFormsResponse, Error>({
    queryKey: ['availableForms', researchId],
    queryFn: async () => {
      const data = await getAvailableForms(researchId);

      // 🔍 LOG DETALLADO DE LA RESPUESTA DE FORMS - REMOVIDO

      return data;
    },
    enabled: !!researchId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 2,
    ...options,
  });
}

export function useModuleResponsesQuery(researchId: string, participantId: string, options?: UseQueryOptions<ParticipantResponsesDocument, Error>) {
  return useQuery<ParticipantResponsesDocument, Error>({
    queryKey: ['moduleResponses', researchId, participantId],
    queryFn: async () => {
      const result = await getModuleResponses(researchId, participantId);

      const actualData = (result as { data?: ParticipantResponsesDocument }).data || result;

      return actualData;
    },
    enabled: !!researchId && !!participantId,
    staleTime: 0, // 🎯 NO cachear datos entre participantes
    gcTime: 1000 * 30, // 30 segundos solamente
    refetchOnWindowFocus: false,
    refetchOnMount: true, // 🎯 SIEMPRE refetch para nuevos participantes
    refetchOnReconnect: false,
    retry: 1,
    ...options,
  });
}

export function useSaveModuleResponseMutation(options?: UseMutationOptions<ParticipantResponsesDocument, Error, CreateModuleResponseDto>) {
  const queryClient = useQueryClient();
  return useMutation<ParticipantResponsesDocument, Error, CreateModuleResponseDto>({
    mutationFn: async (data) => {
      // 🎯 SIMPLIFICADO: Siempre guardar respuestas
      return saveModuleResponse(data);
    },
    onSuccess: (data, variables) => {
      // 🎯 SIMPLIFICADO: Sin modo preview

      // 🎯 SIMPLIFICADO: Siempre invalidar queries
      queryClient.invalidateQueries({
        queryKey: ['moduleResponses', variables.researchId, variables.participantId],
      });

      // 🎯 GUARDAR RESULTADO DE CUOTA EN EL STORE SI EXISTE
      if (data.quotaResult && variables.questionKey === 'thank_you_screen') {
        const { setQuotaResult } = useFormDataStore.getState();
        setQuotaResult(data.quotaResult);
        // Quota verification logging removido
      }
    },
    ...options,
  });
}

export function useUpdateModuleResponseMutation(options?: UseMutationOptions<ParticipantResponsesDocument, Error, { responseId: string; data: UpdateModuleResponseDto }>) {
  const queryClient = useQueryClient();
  return useMutation<ParticipantResponsesDocument, Error, { responseId: string; data: UpdateModuleResponseDto }>({
    mutationFn: ({ responseId, data }) => updateModuleResponse(responseId, data),
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas con las respuestas del módulo
      queryClient.invalidateQueries({
        queryKey: ['moduleResponses'],
      });
      options?.onSuccess?.(data, variables, undefined);
    },
    ...options,
  });
}

export function useDeleteAllResponsesMutation(options?: UseMutationOptions<{ message: string; status: number }, Error, { researchId: string; participantId: string }>) {
  const queryClient = useQueryClient();
  return useMutation<{ message: string; status: number }, Error, { researchId: string; participantId: string }>({
    mutationFn: async ({ researchId, participantId }) => {
      return deleteAllResponses(researchId, participantId);
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas con las respuestas del módulo
      queryClient.invalidateQueries({
        queryKey: ['moduleResponses', variables.researchId, variables.participantId],
      });
      options?.onSuccess?.(data, variables, undefined);
    },
    onError: (error, variables, context) => {
      // Error logging removido
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}
