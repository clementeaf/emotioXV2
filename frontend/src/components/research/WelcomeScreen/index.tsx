import React, { useState } from 'react';

import {
    ErrorModal,
    FormsSkeleton,
    WelcomeScreenContent,
    WelcomeScreenFooter,
    WelcomeScreenSettings
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
    isEmpty,
    handleDelete,
    isDeleting,
  } = useWelcomeScreenForm(researchId);

  // Determine if it's an existing config based on existingScreen data
  const isExisting = !!existingScreen?.id;

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

      <FormsSkeleton />
    );
  }

  return (
    <>
      {/* Mensaje amigable si no hay configuración previa */}
      {isEmpty && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
          <strong>¡Aún no has configurado la pantalla de bienvenida!</strong><br />
          Completa el formulario y guarda para que los participantes vean una pantalla personalizada al iniciar la investigación.
        </div>
      )}

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
      {confirmModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmar eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar la pantalla de bienvenida? Esta acción no se puede deshacer.
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
    </>
  );
};
