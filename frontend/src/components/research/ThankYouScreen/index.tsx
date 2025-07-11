import React, { useState } from 'react';

import { FormsSkeleton } from '@/components/research/WelcomeScreen/components/FormsSkeleton';
import { cn } from '@/lib/utils';

import {
    ErrorModal,
    ThankYouScreenContent,
    ThankYouScreenFooter,
    ThankYouScreenSettings
} from './components';
import { useThankYouScreenForm } from './hooks/useThankYouScreenForm';
import { ThankYouScreenFormProps } from './types';

export const ThankYouScreenForm: React.FC<ThankYouScreenFormProps> = ({
  className,
  researchId,
  onSave
}) => {
  const {
    formData,
    thankYouScreenId,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    handleChange,
    handleSave,
    handlePreview,
    closeModal,
    // NUEVO: Props para eliminar
    handleDelete,
    isDeleting,
    showDelete,
  } = useThankYouScreenForm(researchId);

  const handleTitleChange = (value: string) => {
    handleChange('title', value);
  };

  const handleMessageChange = (value: string) => {
    handleChange('message', value);
  };

  const handleRedirectUrlChange = (value: string) => {
    handleChange('redirectUrl', value);
  };

  const handleEnabledChange = (checked: boolean) => {
    handleChange('isEnabled', checked);
  };

  const handleSaveAndNotify = () => {
    handleSave();
    if (onSave) {
      onSave(formData);
    }
  };

  // <<< Lógica para el modal de confirmación >>>
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const showConfirmModal = () => {
    setConfirmModalVisible(true);
  };

  const closeConfirmModal = () => {
    setConfirmModalVisible(false);
  };

  const confirmDelete = async () => {
    if (handleDelete) {
      await handleDelete();
      closeConfirmModal();
    }
  };

  if (isLoading) {
    return (
      <div className={cn('max-w-4xl space-y-4', className)}>
        <FormsSkeleton />
      </div>
    );
  }

  return (
    <div className={cn('max-w-4xl space-y-4', className)}>
      <ThankYouScreenSettings
        isEnabled={formData.isEnabled}
        onEnabledChange={handleEnabledChange}
        disabled={isLoading || isSaving}
      />

      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-transparent border border-neutral-200 text-[14px] rounded-lg p-4">
          <p>Estado: {thankYouScreenId ? 'Configuración existente' : 'Nueva configuración'}</p>
          <p>Habilitado: {formData.isEnabled ? 'Sí' : 'No'}</p>
          <p>ID Investigación: {researchId}</p>
          <p>ID Formulario Agradecimiento: {thankYouScreenId || 'No hay ID (nueva)'}</p>
        </div>
      )}

      {/* Contenido del formulario */}
      <ThankYouScreenContent
        title={formData.title}
        message={formData.message}
        redirectUrl={formData.redirectUrl ?? ''}
        onTitleChange={handleTitleChange}
        onMessageChange={handleMessageChange}
        onRedirectUrlChange={handleRedirectUrlChange}
        validationErrors={validationErrors}
        disabled={isLoading || isSaving || !formData.isEnabled}
      />

      {/* Pie de página con acciones */}
      <ThankYouScreenFooter
        isSaving={isSaving}
        isLoading={isLoading}
        isEnabled={formData.isEnabled}
        thankYouScreenId={thankYouScreenId}
        onSave={handleSaveAndNotify}
        onPreview={handlePreview}
        // NUEVO: Props para eliminar
        onDelete={showConfirmModal}
        isDeleting={isDeleting}
        showDelete={showDelete}
      />

      {/* Modal para mostrar errores y mensajes */}
      <ErrorModal
        isOpen={modalVisible}
        onClose={closeModal}
        error={modalError}
      />

      {/* Modal de confirmación para eliminar */}
      {confirmModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar la pantalla de agradecimiento? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeConfirmModal}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
