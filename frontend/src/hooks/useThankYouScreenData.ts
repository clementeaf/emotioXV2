/**
 * 🎯 THANK YOU SCREEN DATA HOOK - TanStack Query Implementation
 * Thank You Screen management migrated from Alova to TanStack Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/config/axios';
import type { ThankYouScreenModel, ThankYouScreenFormData } from '../../../shared/interfaces/thank-you-screen.interface';
import type { ApiResponse } from '../types/research';

interface UseThankYouScreenDataReturn {
  data: ThankYouScreenModel | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateThankYouScreen: (researchId: string, data: Partial<ThankYouScreenFormData>) => Promise<ThankYouScreenModel>;
  createThankYouScreen: (data: ThankYouScreenFormData) => Promise<ThankYouScreenModel>;
  deleteThankYouScreen: () => Promise<void>;
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
      const response = await apiClient.get<ApiResponse<ThankYouScreenModel>>(`/research/${researchId}/thank-you-screen`);
      return response.data.data || response.data;
    },
    enabled: !!researchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation para actualizar Thank You Screen
  const updateMutation = useMutation({
    mutationFn: async (updateData: Partial<ThankYouScreenFormData>) => {
      if (!researchId) throw new Error('Research ID is required');
      const response = await apiClient.put<ApiResponse<ThankYouScreenModel>>(
        `/research/${researchId}/thank-you-screen`,
        updateData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thankYouScreen', researchId] });
    },
  });

  const updateThankYouScreen = async (researchId: string, updateData: Partial<ThankYouScreenFormData>): Promise<ThankYouScreenModel> => {
    const result = await updateMutation.mutateAsync(updateData);
    return result.data || result;
  };

  const createThankYouScreen = async (createData: ThankYouScreenFormData) => {
    if (!researchId) throw new Error('Research ID is required');
    const response = await apiClient.post<ApiResponse<ThankYouScreenModel>>(
      `/research/${researchId}/thank-you-screen`,
      createData
    );
    queryClient.invalidateQueries({ queryKey: ['thankYouScreen', researchId] });
    return response.data.data || response.data;
  };

  const deleteThankYouScreen = async () => {
    if (!researchId) throw new Error('Research ID is required');
    await apiClient.delete(`/research/${researchId}/thank-you-screen`);
    queryClient.invalidateQueries({ queryKey: ['thankYouScreen', researchId] });
  };

  return {
    data: data || null,
    isLoading: isLoading || updateMutation.isPending,
    error: error as Error | null,
    refetch,
    updateThankYouScreen,
    createThankYouScreen,
    deleteThankYouScreen
  };
};

// Export por defecto para compatibilidad
export default useThankYouScreenData;