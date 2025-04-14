import React from 'react';
import { WelcomeScreenFormProps } from './types';
import { useWelcomeScreenForm } from './hooks/useWelcomeScreenForm';
import {
  WelcomeScreenHeader,
  WelcomeScreenSettings,
  WelcomeScreenContent,
  WelcomeScreenFooter,
  WelcomeScreenSkeleton,
  ErrorModal
} from './components';
import { UI_TEXTS } from './constants';
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
    handleSave,
    handlePreview,
    validateForm,
    closeModal,
    isExisting,
    closeErrorModal,
    existingScreen
  } = useWelcomeScreenForm(researchId, onSave);

  // Callbacks específicos para cada campo
  const handleTitleChange = (value: string) => {
    handleChange('title', value);
  };

  const handleMessageChange = (value: string) => {
    handleChange('message', value);
  };

  const handleStartButtonTextChange = (value: string) => {
    handleChange('startButtonText', value);
  };

  const handleEnabledChange = (checked: boolean) => {
    handleChange('isEnabled', checked);
  };

  if (isLoading) {
    return <WelcomeScreenSkeleton />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <WelcomeScreenHeader 
          title={UI_TEXTS.TITLE} 
          description={UI_TEXTS.DESCRIPTION}
        />
        
        {/* Ajuste de habilitación/deshabilitación */}
        <WelcomeScreenSettings 
          isEnabled={formData.isEnabled}
        />
      </div>
      
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
        onTitleChange={handleTitleChange}
        onMessageChange={handleMessageChange}
        onStartButtonTextChange={handleStartButtonTextChange}
        validationErrors={validationErrors}
        disabled={isLoading || isSaving || !formData.isEnabled}
      />
      
      {/* Pie de página con acciones */}
      <WelcomeScreenFooter 
        isSaving={isSaving}
        isLoading={isLoading}
        isEnabled={formData.isEnabled}
        isExisting={isExisting}
        onSave={handleSave}
        onPreview={handlePreview}
        buttonText={isExisting ? UI_TEXTS.BUTTONS.UPDATE : UI_TEXTS.BUTTONS.SAVE}
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