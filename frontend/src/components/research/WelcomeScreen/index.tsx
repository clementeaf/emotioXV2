import React from 'react';
import { WelcomeScreenFormProps } from './types';
import { useWelcomeScreenForm } from './hooks/useWelcomeScreenForm';
import {
  WelcomeScreenSettings,
  WelcomeScreenContent,
  WelcomeScreenFooter,
  WelcomeScreenSkeleton,
  ErrorModal
} from './components';
import { cn } from '@/lib/utils';

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
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    handleChange,
    handleSubmit,
    handlePreview,
    validateForm,
    closeModal,
    isExisting,
    closeErrorModal,
    existingScreen
  } = useWelcomeScreenForm(researchId, onSave);

  if (isLoading) {
    return <WelcomeScreenSkeleton />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toggle de habilitación */}
      <WelcomeScreenSettings 
        isEnabled={formData.isEnabled}
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
        isLoading={isLoading}
        isEnabled={formData.isEnabled}
        isExisting={isExisting}
        onSave={handleSubmit}
        onPreview={handlePreview}
      />
      
      {/* Modal para mostrar errores y mensajes */}
      <ErrorModal 
        isOpen={modalVisible}
        onClose={closeModal}
        error={modalError}
      />
    </div>
  );
}; 