import React from 'react';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { FormToggle } from '@/components/common/FormToggle';
import { FormCard } from '@/components/common/FormCard';
import { FormInput } from '@/components/common/FormInput';
import { FormTextarea } from '@/components/common/FormTextarea';
import { ActionButton } from '@/components/common/ActionButton';
import { ErrorModal } from '@/components/common/ErrorModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { useThankYouScreenForm } from './hooks/useThankYouScreenForm';

interface ThankYouScreenFormProps {
  className?: string;
  researchId: string;
  onSave?: () => void;
}

export const ThankYouScreenForm: React.FC<ThankYouScreenFormProps> = ({
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
    isDeleting,
    showDelete,
    confirmModalVisible,
    showConfirmModal,
    closeConfirmModal,
    confirmDelete,
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
      onSave();
    }
  };


  if (isLoading) {
    return <LoadingSkeleton type="form" count={4} />;
  }

  return (
    <div className="max-w-4xl space-y-4">
      {/* Toggle de habilitación */}
      <FormToggle
        label="Habilitar pantalla de agradecimiento"
        description="La pantalla de agradecimiento se mostrará al finalizar la investigación"
        checked={formData.isEnabled}
        onChange={handleEnabledChange}
        disabled={isLoading || isSaving}
      />
      <FormCard title="Configuración de Pantalla de Agradecimiento">
        <div className="space-y-6">
          <FormInput
            label="Título"
            value={formData.title}
            onChange={handleTitleChange}
            placeholder="Ingresa el título de agradecimiento"
            disabled={isLoading || isSaving || !formData.isEnabled}
            error={validationErrors.title}
          />

          <FormTextarea
            label="Mensaje"
            value={formData.message}
            onChange={handleMessageChange}
            placeholder="Ingresa el mensaje de agradecimiento"
            rows={4}
            disabled={isLoading || isSaving || !formData.isEnabled}
            error={validationErrors.message}
          />

          <FormInput
            label="URL de redirección"
            value={formData.redirectUrl ?? ''}
            onChange={handleRedirectUrlChange}
            placeholder="https://ejemplo.com"
            disabled={isLoading || isSaving || !formData.isEnabled}
            error={validationErrors.redirectUrl}
          />
        </div>
        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-4 gap-3">
          {/* Botón de eliminar */}
          {showDelete && (
            <ActionButton
              variant="danger"
              onClick={showConfirmModal}
              disabled={isDeleting || isSaving || !formData.isEnabled}
              loading={isDeleting}
              icon="🗑️"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar pantalla de agradecimiento'}
            </ActionButton>
          )}

          {/* Botones principales */}
          <div className="flex gap-3 ml-auto">
            <ActionButton
              variant="secondary"
              onClick={handlePreview}
              disabled={!formData.isEnabled || isSaving}
            >
              Vista previa
            </ActionButton>

            <ActionButton
              variant="primary"
              onClick={handleSaveAndNotify}
              disabled={!formData.isEnabled || isSaving}
              loading={isSaving}
            >
              {isSaving ? 'Guardando...' : (thankYouScreenId ? 'Actualizar' : 'Guardar')}
            </ActionButton>
          </div>
        </div>
      </FormCard>

      {/* Modales */}
      {modalError && (
        <ErrorModal
          isOpen={modalVisible}
          onClose={closeModal}
          error={modalError}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModalVisible}
        title="Confirmar eliminación"
        message="¿Estás seguro de que quieres eliminar la pantalla de agradecimiento? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onClose={closeConfirmModal}
        onCancel={closeConfirmModal}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
};
