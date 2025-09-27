/**
 * 🎯 THANK YOU SCREEN DATA HOOK - TanStack Query Implementation
 * Thank You Screen management migrated from Alova to TanStack Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/config/axios';
import type { ThankYouScreenFormData as ThankYouScreenData } from '../../../shared/interfaces/thank-you-screen.interface';
import type { ApiResponse } from '../types/research';

interface UseThankYouScreenDataReturn {
  data: ThankYouScreenData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateThankYouScreen: (data: Partial<ThankYouScreenData>) => Promise<void>;
}

/**
 * Hook para gestionar datos de Thank You Screen
 */
export const useThankYouScreenData = (researchId: string | null): UseThankYouScreenDataReturn => {
  const queryClient = useQueryClient();

  // Query para obtener datos de Thank You Screen
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['thankYouScreen', researchId],
    queryFn: async () => {
      if (!researchId) return null;
      const response = await apiClient.get<ApiResponse<ThankYouScreenData>>(`/research/${researchId}/thank-you-screen`);
      return response.data.data || response.data;
    },
    enabled: !!researchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation para actualizar Thank You Screen
  const updateMutation = useMutation({
    mutationFn: async (updateData: Partial<ThankYouScreenData>) => {
      if (!researchId) throw new Error('Research ID is required');
      const response = await apiClient.put<ApiResponse<ThankYouScreenData>>(
        `/research/${researchId}/thank-you-screen`,
        updateData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thankYouScreen', researchId] });
    },
  });

  const updateThankYouScreen = async (updateData: Partial<ThankYouScreenData>) => {
    await updateMutation.mutateAsync(updateData);
  };

  return {
    data: data || null,
    isLoading: isLoading || updateMutation.isPending,
    error: error as Error | null,
    refetch,
    updateThankYouScreen
  };
};

// Export por defecto para compatibilidad
export default useThankYouScreenData;