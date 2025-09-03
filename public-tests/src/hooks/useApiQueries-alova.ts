/**
 * Hooks AlovaJS - PARALELO al sistema actual
 * NO REEMPLAZA useApiQueries.ts - Solo para testing paralelo
 */

import { useRequest, useWatcher } from 'alova/react';
import { 
  getAvailableFormsAlova,
  saveModuleResponseAlova,
  updateModuleResponseAlova,
  getModuleResponsesAlova,
  deleteAllResponsesAlova
} from '../lib/routes-alova';
import { 
  AvailableFormsResponse, 
  CreateModuleResponseDto, 
  ParticipantResponsesDocument, 
  UpdateModuleResponseDto 
} from '../lib/types';

// ✅ HOOK PARALELO - No reemplaza useAvailableFormsQuery
export function useAvailableFormsQueryAlova(researchId: string, options?: {
  enabled?: boolean;
  staleTime?: number;
}) {
  return useRequest(getAvailableFormsAlova(researchId), {
    immediate: options?.enabled !== false && !!researchId,
    // Configuración similar a TanStack Query
    initialData: null,
    force: ({ data }) => {
      if (options?.staleTime) {
        const now = Date.now();
        const lastUpdate = data?._lastUpdate || 0;
        return now - lastUpdate > options.staleTime;
      }
      return false;
    }
  });
}

// ✅ HOOK PARALELO - No reemplaza useModuleResponsesQuery
export function useModuleResponsesQueryAlova(
  researchId: string, 
  participantId: string,
  options?: { enabled?: boolean }
) {
  return useRequest(getModuleResponsesAlova(researchId, participantId), {
    immediate: options?.enabled !== false && !!researchId && !!participantId,
    initialData: null
  });
}

// ✅ HOOK PARALELO - No reemplaza useSaveModuleResponseMutation
export function useSaveModuleResponseMutationAlova(options?: {
  onSuccess?: (data: ParticipantResponsesDocument, variables: CreateModuleResponseDto) => void;
  onError?: (error: Error, variables: CreateModuleResponseDto) => void;
}) {
  const { loading, error, send, data } = useRequest(
    saveModuleResponseAlova({}), // Placeholder, se sobrescribe en send()
    { immediate: false }
  );

  const mutateAsync = async (variables: CreateModuleResponseDto): Promise<ParticipantResponsesDocument> => {
    try {
      const result = await send(saveModuleResponseAlova(variables));
      options?.onSuccess?.(result, variables);
      return result;
    } catch (err) {
      options?.onError?.(err as Error, variables);
      throw err;
    }
  };

  return {
    mutateAsync,
    loading,
    error,
    data
  };
}

// ✅ HOOK PARALELO - No reemplaza useUpdateModuleResponseMutation
export function useUpdateModuleResponseMutationAlova(options?: {
  onSuccess?: (data: ParticipantResponsesDocument, variables: { responseId: string; data: UpdateModuleResponseDto }) => void;
  onError?: (error: Error, variables: { responseId: string; data: UpdateModuleResponseDto }) => void;
}) {
  const { loading, error, send, data } = useRequest(
    updateModuleResponseAlova('', {}), // Placeholder
    { immediate: false }
  );

  const mutateAsync = async (variables: { responseId: string; data: UpdateModuleResponseDto }) => {
    try {
      const result = await send(updateModuleResponseAlova(variables.responseId, variables.data));
      options?.onSuccess?.(result, variables);
      return result;
    } catch (err) {
      options?.onError?.(err as Error, variables);
      throw err;
    }
  };

  return {
    mutateAsync,
    loading,
    error,
    data
  };
}

// ✅ HOOK PARALELO - No reemplaza useDeleteAllResponsesMutation
export function useDeleteAllResponsesMutationAlova(options?: {
  onSuccess?: (data: any, variables: { researchId: string; participantId: string }) => void;
  onError?: (error: Error, variables: { researchId: string; participantId: string }) => void;
}) {
  const { loading, error, send, data } = useRequest(
    deleteAllResponsesAlova('', ''), // Placeholder
    { immediate: false }
  );

  const mutateAsync = async (variables: { researchId: string; participantId: string }) => {
    try {
      const result = await send(deleteAllResponsesAlova(variables.researchId, variables.participantId));
      options?.onSuccess?.(result, variables);
      return result;
    } catch (err) {
      options?.onError?.(err as Error, variables);
      throw err;
    }
  };

  return {
    mutateAsync,
    loading,
    error,
    data
  };
}

// Debug para desarrollo
if (import.meta.env.DEV) {
  console.log('[AlovaJS Hooks] Hooks paralelos creados:', {
    hooks: [
      'useAvailableFormsQueryAlova',
      'useModuleResponsesQueryAlova',
      'useSaveModuleResponseMutationAlova',
      'useUpdateModuleResponseMutationAlova', 
      'useDeleteAllResponsesMutationAlova'
    ]
  });
}