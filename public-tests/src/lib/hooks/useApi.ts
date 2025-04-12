import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '../api';
import { APIResponse } from '../types';

// Hook para peticiones GET
export function useApiQuery<T>(
  endpoint: string,
  options?: UseQueryOptions<APIResponse<T>, Error>
) {
  return useQuery({
    queryKey: [endpoint],
    queryFn: () => apiClient.get<T>(endpoint),
    ...options,
  });
}

// Hook para peticiones POST
export function useApiMutation<T, V>(
  endpoint: string,
  options?: UseMutationOptions<APIResponse<T>, Error, V>
) {
  return useMutation({
    mutationFn: (variables: V) => apiClient.post<T>(endpoint, variables),
    ...options,
  });
}

// Hook para peticiones PUT
export function useApiPut<T, V>(
  endpoint: string,
  options?: UseMutationOptions<APIResponse<T>, Error, V>
) {
  return useMutation({
    mutationFn: (variables: V) => apiClient.put<T>(endpoint, variables),
    ...options,
  });
}

// Hook para peticiones DELETE
export function useApiDelete<T>(
  endpoint: string,
  options?: UseMutationOptions<APIResponse<T>, Error, void>
) {
  return useMutation({
    mutationFn: () => apiClient.delete<T>(endpoint),
    ...options,
  });
} 