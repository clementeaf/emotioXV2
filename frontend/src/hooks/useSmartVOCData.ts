/**
 * 🎯 SMART VOC DATA HOOK - TanStack Query Implementation
 * Smart VOC management migrated from Alova to TanStack Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/config/axios';
import type { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';
import type { ApiResponse } from '../types/research';

interface UseSmartVOCDataReturn {
  data: SmartVOCFormData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateSmartVOC: (data: Partial<SmartVOCFormData>) => Promise<void>;
}

/**
 * Hook para gestionar datos de SmartVOC
 */
export const useSmartVOCData = (researchId: string | null): UseSmartVOCDataReturn => {
  const queryClient = useQueryClient();

  // Query para obtener datos de SmartVOC
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['smartVOC', researchId],
    queryFn: async () => {
      if (!researchId) return null;
      const response = await apiClient.get<ApiResponse<SmartVOCFormData>>(`/research/${researchId}/smart-voc`);
      return response.data.data || response.data;
    },
    enabled: !!researchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation para actualizar SmartVOC
  const updateMutation = useMutation({
    mutationFn: async (updateData: Partial<SmartVOCFormData>) => {
      if (!researchId) throw new Error('Research ID is required');
      const response = await apiClient.put<ApiResponse<SmartVOCFormData>>(
        `/research/${researchId}/smart-voc`,
        updateData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smartVOC', researchId] });
    },
  });

  const updateSmartVOC = async (updateData: Partial<SmartVOCFormData>) => {
    await updateMutation.mutateAsync(updateData);
  };

  return {
    data: data || null,
    isLoading: isLoading || updateMutation.isPending,
    error: error as Error | null,
    refetch,
    updateSmartVOC
  };
};

// Export por defecto para compatibilidad
export default useSmartVOCData;