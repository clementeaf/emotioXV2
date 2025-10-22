import { useCallback, useEffect, useState } from 'react';
import { useThankYouScreenData } from '@/api/domains/thank-you-screen';
import { toastHelpers } from '@/utils/toast';
import { useFormManager, useModalManager, type ErrorModalData } from '@/components/common/hooks';

interface ValidationErrors {
  title?: string;
  message?: string;
  redirectUrl?: string;
}

interface ThankYouScreenFormData {
  isEnabled: boolean;
  title: string;
  message: string;
  redirectUrl: string;
  questionKey: string;
  metadata: {
    version: string;
    lastUpdated: string;
    lastModifiedBy: string;
  };
}

interface UseThankYouScreenFormResult {
  formData: ThankYouScreenFormData;
  thankYouScreenId: string | null;
  validationErrors: ValidationErrors;
  isLoading: boolean;
  isSaving: boolean;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  handleChange: (field: string, value: unknown) => void;
  handleSave: () => Promise<void>;
  handlePreview: () => void;
  closeModal: () => void;
  handleDelete: () => Promise<void>;
  isDeleting: boolean;
  showDelete: boolean;
  confirmModalVisible: boolean;
  showConfirmModal: () => void;
  closeConfirmModal: () => void;
  confirmDelete: () => Promise<void>;
}

// Initial form data
const INITIAL_FORM_DATA: ThankYouScreenFormData = {
  isEnabled: true,
  title: '',
  message: '',
  redirectUrl: '',
  questionKey: 'THANK_YOU_SCREEN',
  metadata: {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    lastModifiedBy: 'user'
  }
};

export const useThankYouScreenFormRefactored = (researchId: string): UseThankYouScreenFormResult => {
  const actualResearchId = researchId === 'current' ? '' : researchId;
  const [thankYouScreenId, setThankYouScreenId] = useState<string | null>(null);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  // Usar el hook centralizado para obtener datos y operaciones
  const {
    data: existingScreen,
    isLoading,
    updateThankYouScreen,
    createThankYouScreen,
    deleteThankYouScreen
  } = useThankYouScreenData(actualResearchId);

  // Usar hooks genéricos
  const formManager = useFormManager({
    initialFormData: INITIAL_FORM_DATA,
    onSave: async (data: ThankYouScreenFormData) => {
      try {
        if (existingScreen) {
          await updateThankYouScreen(existingScreen.id, data);
          setThankYouScreenId('existing');
          toastHelpers.updateSuccess('Pantalla de agradecimiento');
        } else {
          await createThankYouScreen(data);
          setThankYouScreenId('new');
          toastHelpers.saveSuccess('Pantalla de agradecimiento');
        }
        setHasBeenSaved(true);
      } catch (error) {
        throw new Error('Error al guardar la pantalla de agradecimiento');
      }
    },
    onDelete: async () => {
      try {
        await deleteThankYouScreen();
        toastHelpers.deleteSuccess('Pantalla de agradecimiento');
        setThankYouScreenId(null);
      } catch (error) {
        throw new Error('Error al eliminar la pantalla de agradecimiento');
      }
    },
    onPreview: () => {
      console.log('Preview Thank You Screen');
    },
    validateForm: (data: ThankYouScreenFormData) => {
      const errors: Record<string, string> = {};
      
      if (!data.title.trim()) {
        errors.title = 'El título es requerido';
      }
      
      if (!data.message.trim()) {
        errors.message = 'El mensaje es requerido';
      }
      
      if (data.redirectUrl && !data.redirectUrl.startsWith('http')) {
        errors.redirectUrl = 'La URL debe comenzar con http:// o https://';
      }
      
      return errors;
    },
    existingItem: existingScreen
  });

  const modalManager = useModalManager();

  // Procesar datos cuando cambien
  useEffect(() => {
    if (!actualResearchId) {
      return;
    }

    if (existingScreen) {
      const formDataToSet: ThankYouScreenFormData = {
        isEnabled: existingScreen.isEnabled ?? true,
        title: existingScreen.title ?? '',
        message: existingScreen.message ?? '',
        redirectUrl: existingScreen.redirectUrl ?? '',
        questionKey: 'THANK_YOU_SCREEN',
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          lastModifiedBy: 'user'
        }
      };
      
      // Actualizar formData usando el hook genérico
      Object.entries(formDataToSet).forEach(([key, value]) => {
        formManager.handleChange(key as keyof ThankYouScreenFormData, value);
      });
      
      setThankYouScreenId('existing');
      setHasBeenSaved(true);
    } else if (!hasBeenSaved) {
      // Resetear a datos iniciales
      Object.entries(INITIAL_FORM_DATA).forEach(([key, value]) => {
        formManager.handleChange(key as keyof ThankYouScreenFormData, value);
      });
    }
  }, [existingScreen, actualResearchId, hasBeenSaved]);

  const handleChange = useCallback((field: string, value: unknown) => {
    formManager.handleChange(field as keyof ThankYouScreenFormData, value);
  }, [formManager]);

  const handleSave = useCallback(async () => {
    await formManager.handleSave();
  }, [formManager]);

  const handlePreview = useCallback(() => {
    formManager.handlePreview();
  }, [formManager]);

  const handleDelete = useCallback(async () => {
    await formManager.handleDelete();
  }, [formManager]);

  const confirmDelete = useCallback(async () => {
    await handleDelete();
    modalManager.closeDeleteModal();
  }, [handleDelete, modalManager]);

  return {
    formData: formManager.formData,
    thankYouScreenId,
    validationErrors: formManager.validationErrors,
    isLoading: formManager.isLoading || isLoading,
    isSaving: formManager.isSaving,
    modalError: formManager.modalError,
    modalVisible: formManager.modalVisible,
    handleChange,
    handleSave,
    handlePreview,
    closeModal: formManager.closeModal,
    handleDelete,
    isDeleting: formManager.isDeleting,
    showDelete: !!existingScreen,
    confirmModalVisible: formManager.confirmModalVisible,
    showConfirmModal: formManager.showConfirmModal,
    closeConfirmModal: formManager.closeConfirmModal,
    confirmDelete
  };
};