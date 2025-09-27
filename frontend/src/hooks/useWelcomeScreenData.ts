/**
 * 🎯 WELCOME SCREEN DATA HOOK - TanStack Query Implementation
 * Welcome Screen management migrated from Alova to TanStack Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/config/axios';
import type { WelcomeScreenFormData as WelcomeScreenData } from '../../../shared/interfaces/welcome-screen.interface';
import type { ApiResponse } from '../types/research';

interface UseWelcomeScreenDataReturn {
  data: WelcomeScreenData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateWelcomeScreen: (data: Partial<WelcomeScreenData>) => Promise<void>;
}

/**
 * Hook para gestionar datos de Welcome Screen
 */
export const useWelcomeScreenData = (researchId: string | null): UseWelcomeScreenDataReturn => {
  const queryClient = useQueryClient();

  // Query para obtener datos de Welcome Screen
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['welcomeScreen', researchId],
    queryFn: async () => {
      if (!researchId) return null;
      const response = await apiClient.get<ApiResponse<WelcomeScreenData>>(`/research/${researchId}/welcome-screen`);
      return response.data.data || response.data;
    },
    enabled: !!researchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation para actualizar Welcome Screen
  const updateMutation = useMutation({
    mutationFn: async (updateData: Partial<WelcomeScreenData>) => {
      if (!researchId) throw new Error('Research ID is required');
      const response = await apiClient.put<ApiResponse<WelcomeScreenData>>(
        `/research/${researchId}/welcome-screen`,
        updateData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welcomeScreen', researchId] });
    },
  });

  const updateWelcomeScreen = async (updateData: Partial<WelcomeScreenData>) => {
    await updateMutation.mutateAsync(updateData);
  };

  return {
    data: data || null,
    isLoading: isLoading || updateMutation.isPending,
    error: error as Error | null,
    refetch,
    updateWelcomeScreen
  };
};

// Export por defecto para compatibilidad
export default useWelcomeScreenData;