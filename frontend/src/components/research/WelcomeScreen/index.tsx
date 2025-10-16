import React from 'react';

import {
    ErrorModal,
    FormsSkeleton,
    WelcomeScreenContent,
    WelcomeScreenFooter,
    WelcomeScreenSettings,
    DeleteConfirmationModal
} from './components';
import { useWelcomeScreenForm } from './hooks/useWelcomeScreenForm';
import { WelcomeScreenFormProps } from './types';

/**
 * Componente principal para el formulario de configuración de la pantalla de bienvenida
 */
export const WelcomeScreenForm: React.FC<WelcomeScreenFormProps> = ({
  researchId,
}) => {
  const {
    formData,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    handleChange,
    handleSubmit,
    handlePreview,
    closeModal,
    existingScreen,
    isDeleting,
    confirmModalVisible,
    showConfirmModal,
    closeConfirmModal,
    confirmDelete,
  } = useWelcomeScreenForm(researchId);

  const isExisting = !!existingScreen?.id && !existingScreen?.metadata?.isDefault;

  if (isLoading) {
    return (

      <FormsSkeleton />
    );
  }

  return (
    <>
      {/* Toggle de habilitación */}
      <WelcomeScreenSettings
        isEnabled={formData.isEnabled ?? false}
        onChange={(checked) => handleChange('isEnabled', checked)}
        disabled={isLoading || isSaving}
      />

      {/* Contenido del formulario */}
      <div className="mt-8">
        <WelcomeScreenContent
        title={formData.title}
        message={formData.message}
        startButtonText={formData.startButtonText}
        onTitleChange={(value) => handleChange('title', value)}
        onMessageChange={(value) => handleChange('message', value)}
        onStartButtonTextChange={(value) => handleChange('startButtonText', value)}
        validationErrors={validationErrors}
        disabled={isLoading || isSaving || !formData.isEnabled}
        />
      </div>

      {/* Pie de página con acciones */}
      <WelcomeScreenFooter
        isSaving={isSaving}
        disabled={!formData.isEnabled || isSaving}
        onSave={handleSubmit}
        onPreview={handlePreview}
        isUpdate={isExisting}
        // NUEVO: Props para eliminar
        onDelete={showConfirmModal}
        isDeleting={isDeleting}
        showDelete={isExisting}
      />

      {/* Modal para mostrar errores y mensajes */}
      <ErrorModal
        isOpen={modalVisible}
        onClose={closeModal}
        error={modalError}
      />

      {/* Modal de confirmación para eliminar */}
      <DeleteConfirmationModal
        isOpen={confirmModalVisible}
        title="Confirmar eliminación"
        message="¿Estás seguro de que quieres eliminar la pantalla de bienvenida? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={closeConfirmModal}
        isLoading={isDeleting}
      />
    </>
  );
};
