import React from 'react';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EducationalSidebar } from '@/components/common/EducationalSidebar';
import { useEducationalContent } from '@/hooks/useEducationalContent';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { ErrorModal } from '@/components/common/ErrorModal';
import { FormFooter } from '@/components/common/FormFooter';
import { useSmartVOCForm } from './hooks/useSmartVOCForm';
import { SmartVOCQuestions } from './components/SmartVOCQuestions';

interface SmartVOCFormProps {
  className?: string;
  researchId: string;
  onSave?: (data: any) => void;
}

/**
 * Componente principal del formulario SmartVOC
 * Estructura organizada siguiendo el patrón de WelcomeScreen/ThankYouScreen
 */
export const SmartVOCForm: React.FC<SmartVOCFormProps> = ({
  className,
  researchId,
  onSave
}) => {
  const {
    formData,
    smartVocId,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    questions,
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
      const metadataToSend = {
        createdAt: new Date().toISOString(),
        estimatedCompletionTime: '5-10',
        ...(formData.metadata || {}),
      };

      onSave({
        ...formData,
        questions,
        metadata: metadataToSend as { 
          createdAt: string; 
          updatedAt?: string; 
          estimatedCompletionTime: string; 
        },
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