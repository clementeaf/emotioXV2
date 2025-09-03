import { useMutation, UseMutationOptions, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
// ✅ NUEVO: Import AlovaJS para migración gradual
import { useRequest } from 'alova';
import { getApiUrl } from '../config/endpoints';
import {
  getModuleResponses,
  saveModuleResponse,
  updateModuleResponse
} from '../lib/routes';
// ✅ NUEVO: Import función AlovaJS
import { getAvailableFormsAlova } from '../lib/routes-alova';
import {
  AvailableFormsResponse,
  CreateModuleResponseDto,
  ParticipantResponsesDocument,
  UpdateModuleResponseDto,
} from '../lib/types';
import { useFormDataStore } from '../stores/useFormDataStore';

export function useAvailableFormsQuery(researchId: string, options?: UseQueryOptions<AvailableFormsResponse, Error>) {
  // ✅ MIGRADO A ALOVAJS - Manteniendo interfaz TanStack Query
  const { data, loading, error } = useRequest(
    () => getAvailableFormsAlova(researchId),
    {
      immediate: !!researchId && (options?.enabled !== false),
      initialData: null,
      // Mapeo de configuración TanStack Query -> AlovaJS
      force: ({ data: cachedData }: { data: any }) => {
        const staleTimeMs = typeof options?.staleTime === 'number' ? options.staleTime : (1000 * 60 * 5); // 5 min default
        if (cachedData && cachedData._timestamp) {
          return Date.now() - cachedData._timestamp > staleTimeMs;
        }
        return true;
      }
    }
  );

  // 🔍 LOG DETALLADO DE LA RESPUESTA DE FORMS (manteniendo logging original)
  if (data && !loading) {
    console.log('[useAvailableFormsQuery] 📊 Datos completos de forms (AlovaJS):', {
      researchId,
      steps: data.steps,
      stepsConfiguration: data.stepsConfiguration,
      count: data.count,
      allKeys: Object.keys(data),
      fullResponse: data
    });
  }

  if (error) {
    console.error('[useAvailableFormsQuery] ❌ Request falló (AlovaJS):', {
      researchId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }

  // 🔄 INTERFAZ COMPATIBLE: Mapear AlovaJS -> TanStack Query
  return {
    data,
    error,
    isLoading: loading,
    isSuccess: !!data && !loading && !error,
    isError: !!error,
    isPending: loading,
    // Funciones legacy para compatibilidad
    refetch: () => Promise.resolve({ data, error }),
    isFetching: loading,
    status: loading ? 'pending' : error ? 'error' : 'success'
  };
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

export function useSaveModuleResponseMutation(options?: UseMutationOptions<ParticipantResponsesDocument, Error, CreateModuleResponseDto>) {
  const queryClient = useQueryClient();
  return useMutation<ParticipantResponsesDocument, Error, CreateModuleResponseDto>({
    mutationFn: (data) => saveModuleResponse(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['moduleResponses', variables.researchId, variables.participantId],
      });

      // 🎯 GUARDAR RESULTADO DE CUOTA EN EL STORE SI EXISTE
      if (data.quotaResult && variables.questionKey === 'thank_you_screen') {
        const { setQuotaResult } = useFormDataStore.getState();
        setQuotaResult(data.quotaResult);
        console.log('[useSaveModuleResponseMutation] 🎯 Cuota verificada:', data.quotaResult);
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
