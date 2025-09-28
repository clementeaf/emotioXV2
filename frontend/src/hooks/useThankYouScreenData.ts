/**
 * 🎯 THANK YOU SCREEN DATA HOOK - Domain Architecture Implementation
 * Thank You Screen management using domain-based TanStack Query + Axios
 * Migrated from direct hooks to domain architecture
 */

import { useThankYouScreenData as useThankYouScreenDataFromDomain } from '@/api/domains/thank-you-screen';

import type { ThankYouScreenModel, ThankYouScreenFormData } from '@/api/domains/thank-you-screen';

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
 * Now uses the domain architecture for consistency
 */
export const useThankYouScreenData = (researchId: string | null): UseThankYouScreenDataReturn => {
  const result = useThankYouScreenDataFromDomain(researchId);

  return {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    updateThankYouScreen: result.updateThankYouScreen,
    createThankYouScreen: result.createThankYouScreen,
    deleteThankYouScreen: result.deleteThankYouScreen,
  };
};

/**
 * Re-export domain hooks for direct access
 */
export {
  useThankYouScreenValidation,
  useCreateThankYouScreen,
  useUpdateThankYouScreen,
  useDeleteThankYouScreen
} from '@/api/domains/thank-you-screen';

// Export por defecto para compatibilidad
export default useThankYouScreenData;