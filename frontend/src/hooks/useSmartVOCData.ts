/**
 * 🎯 SMART VOC DATA HOOK - AlovaJS Clean Implementation
 * Smart VOC management with strict typing following WelcomeScreen pattern
 */

import { useRequest } from 'alova/client';
import { alovaInstance } from '../config/alova.config';
import type { SmartVOCFormData } from '../../../shared/interfaces/smart-voc.interface';
import type { ApiResponse } from '../types/research';

interface UseSmartVOCDataReturn {
  data: SmartVOCFormData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for Smart VOC data management
 */
export function useSmartVOCData(researchId: string): UseSmartVOCDataReturn {
  const shouldFetch = researchId && researchId !== 'current';

  const query = useRequest(
    () => alovaInstance.Get<ApiResponse<SmartVOCFormData>>(`/research/${researchId}/smart-voc`),
    {
      initialData: undefined,
      immediate: !!shouldFetch,
    }
  );

  if (!shouldFetch) {
    return {
      data: null,
      isLoading: false,
      error: null,
      refetch: async () => {}
    };
  }

  const handleRefetch = async (): Promise<void> => {
    try {
      // Clear localStorage cache if exists
      clearSmartVOCCache(researchId);

      await query.send();
    } catch (error) {
      console.error('Failed to refetch Smart VOC data:', error);
      throw error;
    }
  };

  return {
    data: query.data?.data || query.data || null,
    isLoading: query.loading,
    error: query.error || null,
    refetch: handleRefetch,
  };
}

/**
 * Hook for creating Smart VOC
 */
export function useCreateSmartVOC() {
  const mutation = useRequest(
    (data: Partial<SmartVOCFormData>) =>
      alovaInstance.Post<ApiResponse<SmartVOCFormData>>(`/research/${data.researchId}/smart-voc`, data),
    {
      immediate: false,
    }
  );

  const handleCreate = async (data: Partial<SmartVOCFormData>): Promise<SmartVOCFormData> => {
    try {
      const response = await mutation.send(data);

      if (!response) {
        throw new Error('Invalid create response');
      }

      return response.data || response;
    } catch (error) {
      console.error('Failed to create Smart VOC:', error);
      throw error;
    }
  };

  return {
    create: handleCreate,
    isLoading: mutation.loading,
    error: mutation.error,
  };
}

/**
 * Hook for updating Smart VOC
 */
export function useUpdateSmartVOC() {
  const mutation = useRequest(
    ({ researchId, data }: { researchId: string; data: Partial<SmartVOCFormData> }) =>
      alovaInstance.Post<ApiResponse<SmartVOCFormData>>(`/research/${researchId}/smart-voc`, data),
    {
      immediate: false,
    }
  );

  const handleUpdate = async (
    researchId: string,
    data: Partial<SmartVOCFormData>
  ): Promise<SmartVOCFormData> => {
    if (!researchId) {
      throw new Error('Research ID is required for update');
    }

    try {
      const response = await mutation.send({ researchId, data });

      if (!response) {
        throw new Error('Invalid update response');
      }

      // Clear cache after update
      clearSmartVOCCache(researchId);

      return response.data || response;
    } catch (error) {
      console.error('Failed to update Smart VOC:', error);
      throw error;
    }
  };

  return {
    update: handleUpdate,
    isLoading: mutation.loading,
    error: mutation.error,
  };
}

/**
 * Hook for deleting Smart VOC
 */
export function useDeleteSmartVOC() {
  const mutation = useRequest(
    (researchId: string) =>
      alovaInstance.Delete<ApiResponse<{ message: string }>>(`/research/${researchId}/smart-voc`),
    {
      immediate: false,
    }
  );

  const handleDelete = async (researchId: string): Promise<void> => {
    if (!researchId) {
      throw new Error('Research ID is required for deletion');
    }

    try {
      await mutation.send(researchId);

      // Clear cache after deletion
      clearSmartVOCCache(researchId);
    } catch (error) {
      console.error('Failed to delete Smart VOC:', error);
      throw error;
    }
  };

  return {
    delete: handleDelete,
    isLoading: mutation.loading,
    error: mutation.error,
  };
}

// Helper functions
function clearSmartVOCCache(researchId: string): void {
  try {
    const cacheKey = `smart_voc_resource_${researchId}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    // Ignore localStorage errors
    console.warn('Failed to clear Smart VOC cache:', error);
  }
}

/**
 * Utility function to validate Smart VOC data
 */
export function validateSmartVOCData(data: Partial<SmartVOCFormData>): boolean {
  if (!data.researchId || data.researchId.trim().length === 0) {
    return false;
  }

  if (!data.questions || data.questions.length === 0) {
    return false;
  }

  return true;
}

/**
 * Default Smart VOC configuration
 */
export function getDefaultSmartVOCConfig(): Partial<SmartVOCFormData> {
  return {
    randomizeQuestions: false,
    smartVocRequired: true,
    questions: [],
  };
}