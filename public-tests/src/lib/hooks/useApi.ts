import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { ApiClient } from '../api';
import { APIResponse } from '../types';
import type { ParticipantRegistration } from '../types';

const apiClient = new ApiClient();

export function useWelcomeScreen(
  researchId: string,
  options?: UseQueryOptions<APIResponse<unknown>, Error>
) {
  return useQuery({
    queryKey: ['welcomeScreen', researchId],
    queryFn: () => apiClient.getWelcomeScreen(researchId),
    ...options,
  });
}

// Hook para obtener SmartVOC
export function useSmartVOC(
  researchId: string,
  options?: UseQueryOptions<APIResponse<unknown>, Error>
) {
  return useQuery({
    queryKey: ['smartVOC', researchId],
    queryFn: () => 
      apiClient.getSmartVOC(researchId).then(response => {
        return response; // Importante retornar la respuesta original para React Query
      }),
    ...options,
  });
}

// Hook para obtener tareas cognitivas
export function useCognitiveTask(
  researchId: string,
  options?: UseQueryOptions<APIResponse<unknown>, Error>
) {
  return useQuery({
    queryKey: ['cognitiveTask', researchId],
    queryFn: () => 
      apiClient.getCognitiveTask(researchId).then(response => {
        return response; // Importante retornar la respuesta original para React Query
      }),
    ...options,
  });
}

// Hook para obtener el flujo completo de una investigación (todos los formularios/pasos)
export function useResearchFlow(
  researchId: string,
  options?: UseQueryOptions<APIResponse<unknown>, Error>
) {
  return useQuery({
    queryKey: ['researchFlow', researchId],
    queryFn: () => 
      apiClient.getResearchFlow(researchId).then(response => {
        return response; // Importante retornar la respuesta original para React Query
      }),
    ...options,
  });
}

// Hook para registrar participante
export function useRegisterParticipant(
  options?: UseMutationOptions<APIResponse<{ token: string }>, Error, unknown>
) {
  return useMutation({
    mutationFn: (data: unknown) => apiClient.registerParticipant(data as ParticipantRegistration),
    ...options,
  });
}

// Hook para eliminar todas las respuestas
export function useDeleteAllResponses(
  options?: UseMutationOptions<APIResponse<unknown>, Error, { researchId: string; participantId: string }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ researchId, participantId }) => apiClient.deleteAllResponses(researchId, participantId),
    onSuccess: (data, variables) => {
      // Invalidar todas las queries relacionadas con respuestas
      queryClient.invalidateQueries({ queryKey: ['moduleResponses'] });
      queryClient.invalidateQueries({ queryKey: ['researchFlow'] });
      
      // Limpiar cache específico del participante
      queryClient.removeQueries({ 
        queryKey: ['moduleResponses', variables.researchId, variables.participantId] 
      });
      
      // Ejecutar callback personalizado si existe
      options?.onSuccess?.(data, variables, undefined);
    },
    onError: options?.onError,
  });
} 