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
import { usePreviewModeStore } from '../stores/usePreviewModeStore';

export function useAvailableFormsQuery(researchId: string, options?: UseQueryOptions<AvailableFormsResponse, Error>) {
  return useQuery<AvailableFormsResponse, Error>({
    queryKey: ['availableForms', researchId],
    queryFn: async () => {
      const data = await getAvailableForms(researchId);

      // 🔍 LOG DETALLADO DE LA RESPUESTA DE FORMS
      console.log('[useAvailableFormsQuery] 📊 Datos completos de forms:', {
        researchId,
        steps: data.steps,
        stepsConfiguration: data.stepsConfiguration,
        count: data.count,
        allKeys: Object.keys(data),
        fullResponse: data
      });

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
      // 🎯 MODO PREVIEW: NO GUARDAR RESPUESTAS
      const { isPreviewMode } = usePreviewModeStore.getState();

      if (isPreviewMode) {
        console.log('[useSaveModuleResponseMutation] 👁️ MODO PREVIEW - Omitiendo guardado:', data.questionKey);

        // Retornar un mock response para que el flujo continúe
        return {
          id: 'preview-mock-id',
          researchId: data.researchId,
          participantId: data.participantId,
          questionKey: data.questionKey,
          responses: data.responses,
          quotaResult: undefined, // No hay validación de cuotas en preview
          metadata: data.metadata || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isCompleted: false,
        } as ParticipantResponsesDocument;
      }

      // Modo producción: guardar normalmente
      console.log('[useSaveModuleResponseMutation] 💾 MODO PRODUCCIÓN - Guardando:', data.questionKey);
      return saveModuleResponse(data);
    },
    onSuccess: (data, variables) => {
      const { isPreviewMode } = usePreviewModeStore.getState();

      // Solo invalidar queries si NO es modo preview
      if (!isPreviewMode) {
        queryClient.invalidateQueries({
          queryKey: ['moduleResponses', variables.researchId, variables.participantId],
        });
      }

      // 🎯 GUARDAR RESULTADO DE CUOTA EN EL STORE SI EXISTE (solo en producción)
      if (!isPreviewMode && data.quotaResult && variables.questionKey === 'thank_you_screen') {
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
      console.error('[useDeleteAllResponsesMutation] ❌ Error:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}
