import React from 'react';

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
    closeModal
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
