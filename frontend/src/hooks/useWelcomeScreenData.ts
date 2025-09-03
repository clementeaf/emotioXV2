/**
 * 🎉 WELCOME SCREEN DATA HOOK - AlovaJS Clean Implementation  
 * Welcome screen management with strict typing
 */

import { useRequest } from 'alova/client';
import { alovaInstance } from '../config/alova.config';
import type { WelcomeScreenRecord } from '../../../shared/interfaces/welcome-screen.interface';
import type { ApiResponse } from '../types/research';

interface UseWelcomeScreenDataReturn {
  data: WelcomeScreenRecord | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for welcome screen data management
 */
export function useWelcomeScreenData(researchId: string): UseWelcomeScreenDataReturn {
  const shouldFetch = researchId && researchId !== 'current';

  const query = useRequest(
    () => alovaInstance.Get<ApiResponse<WelcomeScreenRecord>>(`/welcome-screens/research/${researchId}`),
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
      clearWelcomeScreenCache(researchId);
      
      await query.send();
    } catch (error) {
      console.error('Failed to refetch welcome screen data:', error);
      throw error;
    }
  };

  return {
    data: query.data?.data || null,
    isLoading: query.loading,
    error: query.error || null,
    refetch: handleRefetch,
  };
}

/**
 * Hook for creating welcome screen
 */
export function useCreateWelcomeScreen() {
  const mutation = useRequest(
    (data: Partial<WelcomeScreenRecord>) =>
      alovaInstance.Post<ApiResponse<WelcomeScreenRecord>>('/welcome-screens', data),
    {
      immediate: false,
    }
  );

  const handleCreate = async (data: Partial<WelcomeScreenRecord>): Promise<WelcomeScreenRecord> => {
    try {
      const response = await mutation.send(data);
      
      if (!response.data) {
        throw new Error('Invalid create response');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to create welcome screen:', error);
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
 * Hook for updating welcome screen
 */
export function useUpdateWelcomeScreen() {
  const mutation = useRequest(
    ({ researchId, data }: { researchId: string; data: Partial<WelcomeScreenRecord> }) =>
      alovaInstance.Put<ApiResponse<WelcomeScreenRecord>>(`/welcome-screens/research/${researchId}`, data),
    {
      immediate: false,
    }
  );

  const handleUpdate = async (
    researchId: string, 
    data: Partial<WelcomeScreenRecord>
  ): Promise<WelcomeScreenRecord> => {
    if (!researchId) {
      throw new Error('Research ID is required for update');
    }

    try {
      const response = await mutation.send({ researchId, data });
      
      if (!response.data) {
        throw new Error('Invalid update response');
      }

      // Clear cache after update
      clearWelcomeScreenCache(researchId);

      return response.data;
    } catch (error) {
      console.error('Failed to update welcome screen:', error);
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
 * Hook for deleting welcome screen
 */
export function useDeleteWelcomeScreen() {
  const mutation = useRequest(
    (researchId: string) =>
      alovaInstance.Delete<ApiResponse<{ message: string }>>(`/welcome-screens/research/${researchId}`),
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
      clearWelcomeScreenCache(researchId);
    } catch (error) {
      console.error('Failed to delete welcome screen:', error);
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
function clearWelcomeScreenCache(researchId: string): void {
  try {
    const cacheKey = `welcome_screen_resource_${researchId}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    // Ignore localStorage errors
    console.warn('Failed to clear welcome screen cache:', error);
  }
}

/**
 * Utility function to validate welcome screen data
 */
export function validateWelcomeScreenData(data: Partial<WelcomeScreenRecord>): boolean {
  if (!data.researchId || data.researchId.trim().length === 0) {
    return false;
  }

  if (!data.title || data.title.trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * Default welcome screen configuration
 */
export function getDefaultWelcomeScreenConfig(): Partial<WelcomeScreenRecord> {
  return {
    title: 'Bienvenido a la Investigación',
    message: 'Gracias por participar en nuestra investigación.',
    startButtonText: 'Comenzar',
    isEnabled: true,
  };
}