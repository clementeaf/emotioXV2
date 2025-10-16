import React from 'react';

import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EducationalSidebar } from '@/components/common/EducationalSidebar';
import { useEducationalContent } from '@/hooks/useEducationalContent';
import {
  SmartVOCQuestions,
} from './components';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { ErrorModal } from '@/components/common/ErrorModal';
import { FormFooter } from '@/components/common/FormFooter';
import { useSmartVOCForm } from './hooks/useSmartVOCForm';
import { SmartVOCFormProps } from './types';

/**
 * Componente principal del formulario SmartVOC
 * Esta versión refactorizada separa las responsabilidades en subcomponentes
 * y utiliza un hook personalizado para la lógica del formulario
 */
export const SmartVOCForm: React.FC<SmartVOCFormProps> = ({
  className,
  researchId,
  onSave
}) => {
  const {
    questions,
    formData,
    smartVocId,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    updateQuestion,
    addQuestion,
    removeQuestion,
    handleSave,
    handlePreview,
    handleDelete,
    closeModal,
    isExisting,
    isDeleteModalOpen,
    confirmDelete,
    closeDeleteModal
  } = useSmartVOCForm(researchId);

  // Hook para el contenido educativo
  const {
    smartVocContent,
    loading: educationalLoading,
    error: educationalError
  } = useEducationalContent();


  // Callback para guardar y notificar al componente padre si es necesario
  const handleSaveAndNotify = () => {
    handleSave();
    if (onSave) {
      // Asegurar que metadata y createdAt existan para cumplir el tipo esperado por onSave
      const metadataToSend = {
        createdAt: new Date().toISOString(), // Valor por defecto
        estimatedCompletionTime: 'unknown', // Valor por defecto
        ...(formData.metadata || {}), // Sobrescribir con valores existentes si existen
      };
      // Asegurar que createdAt es string
      if (typeof metadataToSend.createdAt !== 'string') {
        metadataToSend.createdAt = new Date().toISOString();
      }
      // Asegurar que estimatedCompletionTime es string
      if (typeof metadataToSend.estimatedCompletionTime !== 'string') {
        metadataToSend.estimatedCompletionTime = 'unknown';
      }

      onSave({
        ...formData,
        questions, // Asegúrate que 'questions' también esté actualizado si es necesario
        metadata: metadataToSend as { createdAt: string; updatedAt?: string; estimatedCompletionTime: string; }, // Type assertion
      });
    }
  };

  // Mientras carga, mostrar un indicador de carga
  if (isLoading) {
    return (
      <div className={className}>
        <LoadingSkeleton type="form" count={4} />
      </div>
    );
  }

  return (
    <div className="flex gap-6 min-w-[1200px]">
      {/* Columna izquierda - Contenido principal con scroll */}
      <div className="flex-[2] min-w-[800px] max-h-[calc(100vh-200px)] overflow-y-auto pr-4">

        {/* Gestión de preguntas */}
        <SmartVOCQuestions
          questions={questions}
          onUpdateQuestion={updateQuestion}
          onAddQuestion={addQuestion}
          onRemoveQuestion={removeQuestion}
          disabled={isLoading || isSaving}
        />
        {/* Pie de página con acciones */}
        <FormFooter
          isSaving={isSaving}
          isLoading={isLoading}
          onSave={handleSaveAndNotify}
          onPreview={handlePreview}
          onDelete={handleDelete}
          isExisting={isExisting}
          deleteText="Eliminar datos SmartVOC"
        />
      </div>

      {/* Columna derecha - Sidebar fijo con contenido educativo */}
      <div className="flex-[1] min-w-[400px]">
        <div className="sticky top-6">
          <EducationalSidebar
            content={smartVocContent}
            loading={educationalLoading}
            error={educationalError}
            title="Configuración Avanzada"
          />
        </div>
      </div>

      {/* Modales */}
      {modalError && (
        <ErrorModal
          isOpen={modalVisible}
          onClose={closeModal}
          error={{
            type: modalError.type === 'success' ? 'info' : modalError.type,
            title: modalError.title,
            message: typeof modalError.message === 'string' ? modalError.message : String(modalError.message)
          }}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar TODOS los datos SmartVOC de esta investigación? Esta acción no se puede deshacer."
      />
    </div>
  );
};
