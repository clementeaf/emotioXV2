import { useMutation, UseMutationOptions, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { getApiUrl } from '../config/endpoints.js';
import {
  getAvailableForms,
  getModuleResponses,
  saveModuleResponse,
  updateModuleResponse
} from '../lib/routes';
import {
  AvailableFormsResponse,
  CreateModuleResponseDto,
  ModuleResponse,
  ParticipantResponsesDocument,
  UpdateModuleResponseDto,
} from '../lib/types';

export function useAvailableFormsQuery(researchId: string, options?: UseQueryOptions<AvailableFormsResponse, Error>) {

  return useQuery<AvailableFormsResponse, Error>({
    queryKey: ['availableForms', researchId],
    queryFn: async () => {

      try {
        const result = await getAvailableForms(researchId);

        // 🔍 LOG DETALLADO DE LA RESPUESTA DE FORMS
        console.log('[useAvailableFormsQuery] 📊 Datos completos de forms:', {
          researchId,
          steps: result.steps,
          stepsConfiguration: result.stepsConfiguration,
          count: result.count,
          // Verificar si hay campos adicionales no tipados
          allKeys: Object.keys(result),
          fullResponse: result
        });

        return result;
      } catch (error) {
        console.error('[useAvailableFormsQuery] ❌ Request falló:', {
          researchId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    },
    enabled: !!researchId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos (antes cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
    ...options,
  });
}

export function useModuleResponsesQuery(researchId: string, participantId: string, options?: UseQueryOptions<ParticipantResponsesDocument, Error>) {
  return useQuery<ParticipantResponsesDocument, Error>({
    queryKey: ['moduleResponses', researchId, participantId],
    queryFn: async () => {
      try {
        const result = await getModuleResponses(researchId, participantId);

        const actualData = (result as { data?: ParticipantResponsesDocument }).data || result;

        return actualData;
      } catch (error) {
        console.error('❌ Error al obtener module responses:', error);
        throw error;
      }
    },
    enabled: !!researchId && !!participantId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    ...options,
  });
}

export function useSaveModuleResponseMutation(options?: UseMutationOptions<ModuleResponse, Error, CreateModuleResponseDto>) {
  const queryClient = useQueryClient();
  return useMutation<ModuleResponse, Error, CreateModuleResponseDto>({
    mutationFn: (data) => saveModuleResponse(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['moduleResponses', variables.researchId, variables.participantId],
      });
    },
    ...options,
  });
}

export function useUpdateModuleResponseMutation(options?: UseMutationOptions<ModuleResponse, Error, { responseId: string; data: UpdateModuleResponseDto }>) {
  const queryClient = useQueryClient();
  return useMutation<ModuleResponse, Error, { responseId: string; data: UpdateModuleResponseDto }>({
    mutationFn: ({ responseId, data }) => updateModuleResponse(responseId, data),
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas con las respuestas del módulo
      queryClient.invalidateQueries({
        queryKey: ['moduleResponses'],
      });
      options?.onSuccess?.(data, variables, undefined as any);
    },
    ...options,
  });
}

export function useDeleteAllResponsesMutation(options?: UseMutationOptions<{ message: string; status: number }, Error, { researchId: string; participantId: string }>) {
  const queryClient = useQueryClient();
  return useMutation<{ message: string; status: number }, Error, { researchId: string; participantId: string }>({
    mutationFn: async ({ researchId, participantId }) => {
      const response = await fetch(`${getApiUrl('module-responses')}?researchId=${researchId}&participantId=${participantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas con las respuestas del módulo
      queryClient.invalidateQueries({
        queryKey: ['moduleResponses', variables.researchId, variables.participantId],
      });
      options?.onSuccess?.(data, variables, undefined as any);
    },
    onError: (error, variables, context) => {
      console.error('[useDeleteAllResponsesMutation] ❌ Error:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}
