/**
 * 🎯 SMART VOC DATA HOOK - Domain Architecture Implementation
 * Smart VOC management using domain-based TanStack Query + Axios
 * Migrated from direct hooks to domain architecture
 */

import { useSmartVOCData as useSmartVOCDataFromDomain } from '@/api/domains/smart-voc';

import type { SmartVOCFormData } from '@/api/domains/smart-voc';

interface UseSmartVOCDataReturn {
  data: SmartVOCFormData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateSmartVOC: (data: Partial<SmartVOCFormData>) => Promise<void>;
  createSmartVOC: (data: SmartVOCFormData) => Promise<SmartVOCFormData>;
  deleteSmartVOC: () => Promise<void>;
}

/**
 * Hook para gestionar datos de SmartVOC
 * Now uses the domain architecture for consistency
 */
export const useSmartVOCData = (researchId: string | null): UseSmartVOCDataReturn => {
  const result = useSmartVOCDataFromDomain(researchId);

  return {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    updateSmartVOC: result.updateSmartVOC,
    createSmartVOC: result.createSmartVOC,
    deleteSmartVOC: result.deleteSmartVOC,
  };
};

/**
 * Re-export domain hooks for direct access
 */
export {
  useSmartVOCValidation,
  useCreateSmartVOC,
  useUpdateSmartVOC,
  useDeleteSmartVOC
} from '@/api/domains/smart-voc';

// Export por defecto para compatibilidad
export default useSmartVOCData;