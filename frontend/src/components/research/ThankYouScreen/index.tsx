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
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

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
      <div className={cn('max-w-4xl space-y-4', className)}>
        <LoadingSkeleton variant="form" rows={6} />
      </div>
    );
  }
  
  return (
    <div className={cn('max-w-4xl space-y-4', className)}>
      {/* Toggle de habilitación */}
      <ThankYouScreenSettings 
        isEnabled={formData.isEnabled}
        onEnabledChange={handleEnabledChange}
        disabled={isLoading || isSaving}
      />
      
      {/* Indicador de estado - Solo para debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 text-xs rounded">
          <p>Estado: {thankYouScreenId ? 'Configuración existente' : 'Nueva configuración'}</p>
          <p>ID: {thankYouScreenId || 'No hay ID (nueva)'}</p>
          <p>Habilitado: {formData.isEnabled ? 'Sí' : 'No'}</p>
          <p>Research ID: {researchId}</p>
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