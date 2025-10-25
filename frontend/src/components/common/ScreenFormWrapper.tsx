import React from 'react';
import { ScreenForm, ScreenFormData } from '@/components/common/ScreenForm';
import { useFormManager } from '@/hooks/useFormManager';

interface ScreenFormWrapperProps {
  screenType: 'welcome' | 'thankyou';
  researchId: string;
  onSave?: () => void;
}

/**
 * Componente genérico para pantallas de bienvenida y agradecimiento
 * Elimina la duplicación entre WelcomeScreen y ThankYouScreen
 */
export const ScreenFormWrapper: React.FC<ScreenFormWrapperProps> = ({
  screenType,
  researchId,
  onSave
}) => {
  // Use the universal form manager hook
  const {
    formData,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    handleSave,
    handlePreview,
    handleDelete,
    closeModal,
    isExisting,
    isDeleteModalOpen,
    confirmDelete,
    closeDeleteModal
  } = useFormManager(`${screenType}_screen`, researchId);

  const handleSaveAndNotify = () => {
    handleSave();
    if (onSave) {
      onSave();
    }
  };

  // Wrapper para handleChange - TODO: Implement with useFormManager
  const handleChangeWrapper = (field: string, value: any) => {
    // TODO: Implement handleChange with useFormManager
    console.log('handleChange not implemented yet:', field, value);
  };

  // Configuración dinámica basada en screenType
  const config = {
    screenType,
    toggleLabel: screenType === 'welcome' 
      ? 'Habilitar pantalla de bienvenida'
      : 'Habilitar pantalla de agradecimiento',
    toggleDescription: screenType === 'welcome'
      ? 'La pantalla de bienvenida se mostrará al iniciar la investigación'
      : 'La pantalla de agradecimiento se mostrará al finalizar la investigación',
    titleLabel: 'Título',
    titlePlaceholder: screenType === 'welcome'
      ? 'Ingresa el título de la pantalla de bienvenida'
      : 'Ingresa el título de agradecimiento',
    messageLabel: 'Mensaje',
    messagePlaceholder: screenType === 'welcome'
      ? 'Ingresa el mensaje de bienvenida'
      : 'Ingresa el mensaje de agradecimiento',
    thirdFieldLabel: screenType === 'welcome'
      ? 'Texto del botón'
      : 'URL de redirección',
    thirdFieldPlaceholder: screenType === 'welcome'
      ? 'Ingresa el texto del botón de inicio'
      : 'https://ejemplo.com',
    deleteText: screenType === 'welcome'
      ? 'Eliminar pantalla de bienvenida'
      : 'Eliminar pantalla de agradecimiento',
    deleteMessage: screenType === 'welcome'
      ? '¿Estás seguro de que quieres eliminar la pantalla de bienvenida? Esta acción no se puede deshacer.'
      : '¿Estás seguro de que quieres eliminar la pantalla de agradecimiento? Esta acción no se puede deshacer.'
  };

  return (
    <div className="max-w-4xl space-y-4">
      <ScreenForm
        formData={formData as ScreenFormData}
        isLoading={isLoading}
        isSaving={isSaving}
        isDeleting={false} // TODO: Implement isDeleting with useFormManager
        isExisting={isExisting}
        validationErrors={{}} // TODO: Implement validationErrors with useFormManager
        modalError={modalError ? {
          type: modalError.type === 'success' ? 'info' : modalError.type,
          title: modalError.title,
          message: modalError.message
        } : null}
        modalVisible={modalVisible}
        confirmModalVisible={isDeleteModalOpen}
        handleChange={handleChangeWrapper}
        handleSave={handleSaveAndNotify}
        handlePreview={handlePreview}
        closeModal={closeModal}
        showConfirmModal={handleDelete}
        closeConfirmModal={closeDeleteModal}
        confirmDelete={confirmDelete}
        config={config}
      />
    </div>
  );
};
