import React from 'react';

import {
  ErrorModal,
  WelcomeScreenContent,
  WelcomeScreenFooter,
  WelcomeScreenSettings,
  WelcomeScreenSkeleton
} from './components';
import { useWelcomeScreenForm } from './hooks/useWelcomeScreenForm';
import { WelcomeScreenFormProps } from './types';

/**
 * Componente principal para el formulario de configuración de la pantalla de bienvenida
 */
export const WelcomeScreenForm: React.FC<WelcomeScreenFormProps> = ({
  className,
  researchId,
  onSave
}) => {
  const {
    formData,
    setFormData,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    handleChange,
    handleSubmit,
    handlePreview,
    closeModal,
    existingScreen
  } = useWelcomeScreenForm(researchId);

  // Determine if it's an existing config based on existingScreen data
  const isExisting = !!existingScreen?.id;

  // <<< Lógica para el modal de confirmación (si se implementa) >>>
  const confirmModalVisible = false; // Placeholder
  const showConfirmModalAction = () => {}; // Placeholder
  const closeConfirmModal = () => {}; // Placeholder
  const confirmAction = handleSubmit; // Placeholder - llamar a handleSubmit al confirmar

  if (isLoading) {
    return (

      <WelcomeScreenSkeleton />
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

      {/* Indicador de estado - Solo para debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 text-xs rounded">
          <p>Estado: {isExisting ? 'Configuración existente' : 'Nueva configuración'}</p>
          <p>ID: {existingScreen?.id || 'No hay ID (nueva)'}</p>
          <p>Habilitado: {formData.isEnabled ? 'Sí' : 'No'}</p>
          <p>Research ID: {researchId}</p>
        </div>
      )}

      {/* Contenido del formulario */}
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

      {/* Pie de página con acciones */}
      <WelcomeScreenFooter
        isSaving={isSaving}
        disabled={!formData.isEnabled || isSaving}
        onSave={handleSubmit}
        onPreview={handlePreview}
        isUpdate={isExisting}
      />

      {/* Modal para mostrar errores y mensajes */}
      <ErrorModal
        isOpen={modalVisible}
        onClose={closeModal}
        error={modalError}
      />

      <ErrorModal
        isOpen={confirmModalVisible}
        onClose={closeConfirmModal}
        error={modalError}
      />
    </>
  );
};
