import React from 'react';
import { ThankYouScreenFormProps } from './types';
import { useThankYouScreenForm } from './hooks/useThankYouScreenForm';
import {
  ThankYouScreenHeader,
  ThankYouScreenSettings,
  ThankYouScreenContent,
  ThankYouScreenFooter,
  ErrorModal
} from './components';
import { UI_TEXTS } from './constants';
import { cn } from '@/lib/utils';

/**
 * Componente principal para el formulario de configuración de la pantalla de agradecimiento
 * Esta versión refactorizada separa las responsabilidades en subcomponentes
 * y utiliza un hook personalizado para la lógica del formulario
 */
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
    closeModal
  } = useThankYouScreenForm(researchId);

  // Callbacks específicos para cada campo
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

  // Callback para guardar y notificar al componente padre si es necesario
  const handleSaveAndNotify = () => {
    handleSave();
    if (onSave) {
      onSave(formData);
    }
  };
  
  // Mientras carga, mostrar un indicador de carga
  if (isLoading) {
    return (
      <div className={cn('space-y-4 bg-white p-6 rounded-lg shadow-sm', className)}>
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-6 bg-gray-200 rounded-full w-12"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded w-full"></div>
          <div className="flex justify-between mt-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-blue-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <ThankYouScreenHeader 
          title={UI_TEXTS.TITLE} 
          description={UI_TEXTS.DESCRIPTION}
        />
        
        {/* Ajuste de habilitación/deshabilitación */}
        <ThankYouScreenSettings 
          isEnabled={formData.isEnabled}
          onEnabledChange={handleEnabledChange}
          disabled={isLoading || isSaving}
        />
      </div>
      
      {/* Indicador de estado - Solo para debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 text-xs rounded">
          <p>Estado: {thankYouScreenId ? 'Configuración existente' : 'Nueva configuración'}</p>
          <p>ID: {thankYouScreenId || 'No hay ID (nueva)'}</p>
          <p>Habilitado: {formData.isEnabled ? 'Sí' : 'No'}</p>
          <p>Research ID: {researchId}</p>
        </div>
      )}
      
      {/* Contenido del formulario (solo si está habilitado) */}
      {formData.isEnabled && (
        <ThankYouScreenContent 
          title={formData.title}
          message={formData.message}
          redirectUrl={formData.redirectUrl || ''}
          onTitleChange={handleTitleChange}
          onMessageChange={handleMessageChange}
          onRedirectUrlChange={handleRedirectUrlChange}
          validationErrors={validationErrors}
          disabled={isLoading || isSaving}
        />
      )}
      
      {/* Pie de página con acciones */}
      <ThankYouScreenFooter 
        isSaving={isSaving}
        isLoading={isLoading}
        thankYouScreenId={thankYouScreenId}
        onSave={handleSaveAndNotify}
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