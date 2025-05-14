import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { ApiClient } from '../api';
import { APIResponse } from '../types';

// Crear una instancia de ApiClient
const apiClient = new ApiClient();

// Hook para obtener pantalla de bienvenida
export function useWelcomeScreen(
  researchId: string,
  options?: UseQueryOptions<APIResponse<any>, Error>
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
  options?: UseQueryOptions<APIResponse<any>, Error>
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
  options?: UseQueryOptions<APIResponse<any>, Error>
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
  options?: UseQueryOptions<APIResponse<any>, Error> // Idealmente, any sería Step[] o un tipo más específico
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
  options?: UseMutationOptions<APIResponse<{ token: string }>, Error, any>
) {
  return useMutation({
    mutationFn: (data) => apiClient.registerParticipant(data),
    ...options,
  });
} 