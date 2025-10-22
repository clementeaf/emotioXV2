import { useEffect } from 'react';
import { toastHelpers } from '@/utils/toast';
import { apiClient } from '@/api/config/axios';
import { useFormManager, useModalManager, type ErrorModalData } from '@/components/common/hooks';

interface WelcomeScreenData {
  title: string;
  message: string;
  startButtonText: string;
  isEnabled: boolean;
}

interface UseWelcomeScreenResult {
  formData: WelcomeScreenData;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  existingScreen: any | null;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  confirmModalVisible: boolean;
  handleChange: (field: keyof WelcomeScreenData, value: string | boolean) => void;
  handleSubmit: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handlePreview: () => void;
  closeModal: () => void;
  showConfirmModal: () => void;
  closeConfirmModal: () => void;
  confirmDelete: () => Promise<void>;
}

export const useWelcomeScreenRefactored = (researchId: string): UseWelcomeScreenResult => {
  const initialFormData: WelcomeScreenData = {
    title: '',
    message: '',
    startButtonText: '',
    isEnabled: true
  };

  // Usar hooks genéricos
  const formManager = useFormManager({
    initialFormData,
    onSave: async (data: WelcomeScreenData) => {
      try {
        const response = await apiClient.post('/welcome-screens', {
          researchId,
          ...data
        });
        
        if (response.data.success) {
          toastHelpers.saveSuccess('Pantalla de bienvenida');
        }
      } catch (error) {
        throw new Error('Error al guardar la pantalla de bienvenida');
      }
    },
    onDelete: async () => {
      try {
        const response = await apiClient.delete(`/welcome-screens/${researchId}`);
        
        if (response.data.success) {
          toastHelpers.deleteSuccess('Pantalla de bienvenida');
        }
      } catch (error) {
        throw new Error('Error al eliminar la pantalla de bienvenida');
      }
    },
    onPreview: () => {
      console.log('Preview Welcome Screen');
    },
    validateForm: (data: WelcomeScreenData) => {
      const errors: Record<string, string> = {};
      
      if (!data.title.trim()) {
        errors.title = 'El título es requerido';
      }
      
      if (!data.message.trim()) {
        errors.message = 'El mensaje es requerido';
      }
      
      if (!data.startButtonText.trim()) {
        errors.startButtonText = 'El texto del botón es requerido';
      }
      
      return errors;
    }
  });

  const modalManager = useModalManager();

  // Cargar datos existentes
  useEffect(() => {
    const loadExistingScreen = async () => {
      try {
        const response = await apiClient.get(`/welcome-screens/${researchId}`);
        if (response.data.success && response.data.data) {
          formManager.handleChange('title', response.data.data.title);
          formManager.handleChange('message', response.data.data.message);
          formManager.handleChange('startButtonText', response.data.data.startButtonText);
          formManager.handleChange('isEnabled', response.data.data.isEnabled);
        }
      } catch (error) {
        console.log('No existing welcome screen found');
      }
    };

    loadExistingScreen();
  }, [researchId]);

  const handleSubmit = async () => {
    await formManager.handleSave();
  };

  const handleDelete = async () => {
    await formManager.handleDelete();
  };

  const handlePreview = () => {
    formManager.handlePreview();
  };

  const confirmDelete = async () => {
    await handleDelete();
    modalManager.closeDeleteModal();
  };

  return {
    formData: formManager.formData,
    isLoading: formManager.isLoading,
    isSaving: formManager.isSaving,
    isDeleting: formManager.isDeleting,
    existingScreen: formManager.existingItem,
    modalError: formManager.modalError,
    modalVisible: formManager.modalVisible,
    confirmModalVisible: formManager.confirmModalVisible,
    handleChange: formManager.handleChange,
    handleSubmit,
    handleDelete,
    handlePreview,
    closeModal: formManager.closeModal,
    showConfirmModal: formManager.showConfirmModal,
    closeConfirmModal: formManager.closeConfirmModal,
    confirmDelete
  };
};
