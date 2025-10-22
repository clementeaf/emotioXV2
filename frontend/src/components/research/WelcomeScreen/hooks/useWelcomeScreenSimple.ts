import { useState, useEffect } from 'react';
import { toastHelpers } from '@/utils/toast';
import { apiClient } from '@/api/config/axios';
import { useFormManager, type ErrorModalData } from '@/components/common/hooks/useFormManager';

interface WelcomeScreenData {
  title: string;
  message: string;
  startButtonText: string;
  isEnabled: boolean;
}

export const useWelcomeScreenSimple = (researchId: string) => {
  const initialFormData: WelcomeScreenData = {
    title: '',
    message: '',
    startButtonText: '',
    isEnabled: true
  };

  // Usar el hook genérico de formularios
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

  return {
    formData: formManager.formData,
    isLoading: formManager.isLoading,
    isSaving: formManager.isSaving,
    isDeleting: formManager.isDeleting,
    validationErrors: formManager.validationErrors,
    modalError: formManager.modalError,
    modalVisible: formManager.modalVisible,
    confirmModalVisible: formManager.confirmModalVisible,
    handleChange: formManager.handleChange,
    handleSave: formManager.handleSave,
    handleDelete: formManager.handleDelete,
    handlePreview: formManager.handlePreview,
    closeModal: formManager.closeModal,
    showConfirmModal: formManager.showConfirmModal,
    closeConfirmModal: formManager.closeConfirmModal,
    confirmDelete: formManager.confirmDelete
  };
};
