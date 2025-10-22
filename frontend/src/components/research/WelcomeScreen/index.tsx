import React from 'react';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { FormToggle } from '@/components/common/FormToggle';
import { FormCard } from '@/components/common/FormCard';
import { FormInput } from '@/components/common/FormInput';
import { FormTextarea } from '@/components/common/FormTextarea';
import { FormActionButtons } from '@/components/common/FormActionButtons';
import { ErrorModal } from '@/components/common/ErrorModal';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { useWelcomeScreen } from './hooks/useWelcomeScreen';

interface WelcomeScreenFormProps {
  researchId: string;
}

export const WelcomeScreenForm: React.FC<WelcomeScreenFormProps> = ({
  researchId,
}) => {
  const {
    formData,
    isLoading,
    isSaving,
    isDeleting,
    existingScreen,
    modalError,
    modalVisible,
    confirmModalVisible,
    handleChange,
    handleSubmit,
    handlePreview,
    closeModal,
    showConfirmModal,
    closeConfirmModal,
    confirmDelete,
  } = useWelcomeScreen(researchId);

  const isExisting = !!existingScreen?.id && !existingScreen?.metadata?.isDefault;

  if (isLoading) {
    return <LoadingSkeleton type="form" count={4} />;
  }

  return (
    <>
      <div className="mt-8">
        <FormCard>
          <FormToggle
            label="Habilitar pantalla de bienvenida"
            description="La pantalla de bienvenida se mostrará al iniciar la investigación"
            checked={formData.isEnabled}
            onChange={(checked) => handleChange('isEnabled', checked)}
            disabled={isLoading || isSaving}
          />
          <div className="space-y-6 mt-6">
            <FormInput
              label="Título"
              value={formData.title}
              onChange={(value) => handleChange('title', value)}
              placeholder="Ingresa el título de la pantalla de bienvenida"
              disabled={isLoading || isSaving || !formData.isEnabled}
            />

            <FormTextarea
              label="Mensaje"
              value={formData.message}
              onChange={(value) => handleChange('message', value)}
              placeholder="Ingresa el mensaje de bienvenida"
              rows={4}
              disabled={isLoading || isSaving || !formData.isEnabled}
            />

            <FormInput
              label="Texto del botón"
              value={formData.startButtonText}
              onChange={(value) => handleChange('startButtonText', value)}
              placeholder="Ingresa el texto del botón de inicio"
              disabled={isLoading || isSaving || !formData.isEnabled}
            />
          </div>
          <FormActionButtons
            isSaving={isSaving}
            isDeleting={isDeleting}
            isExisting={isExisting}
            isEnabled={formData.isEnabled}
            onSave={handleSubmit}
            onPreview={handlePreview}
            onDelete={showConfirmModal}
            deleteText="Eliminar pantalla de bienvenida"
            deletingText="Eliminando..."
            savingText="Guardando..."
          />
        </FormCard>
      </div>

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
        message="¿Estás seguro de que quieres eliminar la pantalla de bienvenida? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onClose={closeConfirmModal}
        isLoading={isDeleting}
        variant="danger"
      />
    </>
  );
};
