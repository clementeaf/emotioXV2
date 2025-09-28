/**
 * 🎯 WELCOME SCREEN DATA HOOK - Domain Architecture Implementation
 * Welcome Screen management using domain-based TanStack Query + Axios
 * Migrated from direct hooks to domain architecture
 */

import { useWelcomeScreenData as useWelcomeScreenDataFromDomain } from '@/api/domains/welcome-screen';

/**
 * Hook para gestionar datos de Welcome Screen
 * Now uses the domain architecture for consistency
 */
export const useWelcomeScreenData = (researchId: string | null) => {
  const result = useWelcomeScreenDataFromDomain(researchId);

  return {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    updateWelcomeScreen: result.updateWelcomeScreen,
    createWelcomeScreen: result.createWelcomeScreen,
    deleteWelcomeScreen: result.deleteWelcomeScreen,
    isCreating: result.isCreating,
    isUpdating: result.isUpdating,
    isDeleting: result.isDeleting,
  };
};

/**
 * Re-export domain hooks for direct access
 */
export {
  useWelcomeScreenValidation,
  useCreateWelcomeScreen,
  useUpdateWelcomeScreen,
  useDeleteWelcomeScreen
} from '@/api/domains/welcome-screen';