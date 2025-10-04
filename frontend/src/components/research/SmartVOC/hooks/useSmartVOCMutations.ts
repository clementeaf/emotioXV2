// Hook para operaciones de API del formulario SmartVOC
// Responsabilidad: Contener toda la lógica de mutaciones y estado

import { useCallback, useState } from 'react';
import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';

import { useSmartVOCData } from '@/hooks/useSmartVOCData';

import { ErrorModalData } from '../types';

/**
 * Hook para operaciones de API del formulario SmartVOC
 * Implementa mutaciones siguiendo patrón WelcomeScreen/ThankYouScreen
 */
export const useSmartVOCMutations = (researchId: string, smartVocId?: string) => {
  const actualResearchId = researchId === 'current' ? '' : researchId;

  // Hooks centralizados TanStack Query
  const { data: smartVocData, isLoading, refetch, updateSmartVOC, createSmartVOC, deleteSmartVOC } = useSmartVOCData(actualResearchId);

  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handlers para el modal de error
  const closeModal = useCallback(() => {
    setModalVisible(false);
    setModalError(null);
  }, []);

  const showModal = useCallback((errorData: ErrorModalData) => {
    setModalError(errorData);
    setModalVisible(true);
  }, []);

  // Mutación para guardar (crear o actualizar)
  const saveMutation = {
    mutateAsync: async (data: SmartVOCFormData) => {
      if (!actualResearchId) {
        throw new Error('Research ID is required');
      }

      setIsSaving(true);
      try {
        let result: SmartVOCFormData;

        if (smartVocData || smartVocId) {
          // Actualizar existente
          await updateSmartVOC({
            ...data,
            researchId: actualResearchId
          });
          result = { ...data, researchId: actualResearchId };
        } else {
          // Crear nuevo
          result = await createSmartVOC({
            ...data,
            researchId: actualResearchId
          });
        }

        // Refresh data
        refetch();

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al guardar la configuración';
        showModal({
          title: 'Error al guardar',
          message: errorMessage,
          type: 'error'
        });
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    isPending: isSaving
  };

  // Mutación para eliminar
  const deleteMutation = {
    mutateAsync: async () => {
      if (!actualResearchId) {
        throw new Error('Research ID is required for deletion');
      }

      setIsDeleting(true);
      try {
        await deleteSmartVOC();

        // Refresh data
        refetch();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'No se pudo eliminar la configuración SmartVOC.';
        showModal({
          title: 'Error al eliminar',
          message: errorMessage,
          type: 'error'
        });
        throw error;
      } finally {
        setIsDeleting(false);
      }
    },
    isPending: isDeleting
  };

  return {
    smartVocData,
    isLoading,
    saveMutation,
    isSaving,
    deleteMutation,
    isDeleting,
    modalError,
    modalVisible,
    closeModal,
    showModal,
    refetch
  };
};