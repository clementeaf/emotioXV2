/**
 * 🎉 THANK YOU SCREEN DATA HOOK - AlovaJS Clean Implementation
 * Thank you screen management with strict typing
 */

import { useRequest } from 'alova/client';
import { alovaInstance } from '../config/alova.config';
import type { ThankYouScreenModel, ThankYouScreenFormData } from '@/shared/interfaces/thank-you-screen.interface';
import type { ApiResponse } from '../types/research';

interface UseThankYouScreenDataReturn {
  data: ThankYouScreenModel | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for thank you screen data management
 */
export function useThankYouScreenData(researchId: string): UseThankYouScreenDataReturn {
  const shouldFetch = researchId && researchId !== 'current';

  const query = useRequest(
    () => alovaInstance.Get<ApiResponse<ThankYouScreenModel>>(`/research/${researchId}/thank-you-screen`),
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
      clearThankYouScreenCache(researchId);

      await query.send();
    } catch (error) {
      console.error('Failed to refetch thank you screen data:', error);
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
 * Hook for creating thank you screen
 */
export function useCreateThankYouScreen() {
  const mutation = useRequest(
    (data: Partial<ThankYouScreenModel>) =>
      alovaInstance.Post<ApiResponse<ThankYouScreenModel>>(`/research/${data.researchId}/thank-you-screen`, data),
    {
      immediate: false,
    }
  );

  const handleCreate = async (data: Partial<ThankYouScreenModel>): Promise<ThankYouScreenModel> => {
    try {
      const response = await mutation.send(data);

      if (!response) {
        throw new Error('Invalid create response');
      }

      return response.data || response;
    } catch (error) {
      console.error('Failed to create thank you screen:', error);
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
 * Hook for updating thank you screen
 */
export function useUpdateThankYouScreen() {
  const mutation = useRequest(
    ({ researchId, data }: { researchId: string; data: Partial<ThankYouScreenModel> }) =>
      alovaInstance.Post<ApiResponse<ThankYouScreenModel>>(`/research/${researchId}/thank-you-screen`, data),
    {
      immediate: false,
    }
  );

  const handleUpdate = async (
    researchId: string,
    data: Partial<ThankYouScreenModel>
  ): Promise<ThankYouScreenModel> => {
    if (!researchId) {
      throw new Error('Research ID is required for update');
    }

    try {
      const response = await mutation.send({ researchId, data });

      if (!response) {
        throw new Error('Invalid update response');
      }

      // Clear cache after update
      clearThankYouScreenCache(researchId);

      return response.data || response;
    } catch (error) {
      console.error('Failed to update thank you screen:', error);
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
 * Hook for deleting thank you screen
 */
export function useDeleteThankYouScreen() {
  const mutation = useRequest(
    (researchId: string) =>
      alovaInstance.Delete<ApiResponse<{ message: string }>>(`/research/${researchId}/thank-you-screen`),
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
      clearThankYouScreenCache(researchId);
    } catch (error) {
      console.error('Failed to delete thank you screen:', error);
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
function clearThankYouScreenCache(researchId: string): void {
  try {
    const cacheKey = `thank_you_screen_resource_${researchId}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    // Ignore localStorage errors
    console.warn('Failed to clear thank you screen cache:', error);
  }
}

/**
 * Utility function to validate thank you screen data
 */
export function validateThankYouScreenData(data: Partial<ThankYouScreenModel>): boolean {
  if (!data.researchId || data.researchId.trim().length === 0) {
    return false;
  }

  if (!data.title || data.title.trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * Default thank you screen configuration
 */
export function getDefaultThankYouScreenConfig(): Partial<ThankYouScreenModel> {
  return {
    title: 'Gracias por tu participación',
    message: 'Tu participación ha sido registrada exitosamente.',
    isEnabled: true,
  };
}