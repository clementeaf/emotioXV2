'use client';

import React from 'react';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EducationalContentSidebar } from '@/components/research/shared/EducationalContentSidebar';
import { useEducationalContent } from '@/hooks/useEducationalContent';
import { cn } from '@/lib/utils';
import { ConfirmationModal } from '../SmartVOC/components/ConfirmationModal';
import {
  CognitiveTaskFooter,
  ErrorModal,
  JsonPreviewModal
} from './components';
import { CognitiveTaskFields } from './components/CognitiveTaskFields';
import { useCognitiveTaskForm } from './hooks/useCognitiveTaskForm';
import { CognitiveTaskFormProps } from './types';

/**
 * Componente principal del formulario de tareas cognitivas
 * Esta versión refactorizada separa las responsabilidades en subcomponentes
 * y utiliza un hook personalizado para la lógica del formulario
 */
export const CognitiveTaskForm: React.FC<CognitiveTaskFormProps> = ({
  className,
  researchId,
  onSave
}) => {
  const {
    formData,
    cognitiveTaskId,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    handleQuestionChange,
    handleAddChoice,
    handleRemoveChoice,
    handleAddQuestion,
    handleFileUpload,
    handleFileDelete: handleRemoveFile,
    handleRandomizeChange: setRandomizeQuestions,
    handleSave: saveForm,
    handlePreview,
    handleDelete,
    confirmDelete,
    closeModal,
    isUploading,
    uploadProgress,
    showJsonPreview,
    closeJsonModal,
    jsonToSend,
    pendingAction,
    continueWithAction
  } = useCognitiveTaskForm(researchId, onSave);

  // Hook para el contenido educativo
  const {
    cognitiveTaskContent,
    loading: educationalLoading,
    error: educationalError
  } = useEducationalContent();

  // 🆕 Estado temporal para el modal de confirmación (hasta que se implemente en el hook)
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  // 🆕 Función para manejar la eliminación con modal
  const handleDeleteWithModal = () => {
    setShowDeleteModal(true);
  };

  // 🆕 Función para confirmar la eliminación
  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    if (confirmDelete) {
      confirmDelete();
    } else {
      // Fallback al método original si confirmDelete no está disponible
      handleDelete();
    }
  };

  // Registrar información importante para debugging
  React.useEffect(() => {
    if (cognitiveTaskId) {

      // Registrar información sobre archivos en las preguntas
      const questionsWithFiles = formData.questions.filter(q => q.files && q.files.length > 0);
      if (questionsWithFiles.length > 0) {
        questionsWithFiles.forEach(q => {
          //   q.files?.map(f => ({id: f.id, name: f.name, url: f.url, s3Key: f.s3Key})));
        });
      }
    } else {
    }

    // Mostrar el modo actual del botón de guardar
  }, [cognitiveTaskId, formData.questions, isSaving]);

  // Listener para guardado automático cuando se definen hitzones
  React.useEffect(() => {
    const handleAutoSave = () => {
      saveForm();
    };

    window.addEventListener('cognitiveTaskAutoSave', handleAutoSave);

    return () => {
      window.removeEventListener('cognitiveTaskAutoSave', handleAutoSave);
    };
  }, [saveForm]);

  // Mientras carga, mostrar un esqueleto de carga
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
        <div className={cn('space-y-4', className)}>
          {/* Campos del formulario */}
          <CognitiveTaskFields
            questions={formData.questions}
            randomizeQuestions={formData.randomizeQuestions}
            onQuestionChange={handleQuestionChange}
            onAddChoice={handleAddChoice}
            onRemoveChoice={handleRemoveChoice}
            onAddQuestion={handleAddQuestion}
            onFileUpload={handleFileUpload}
            onFileDelete={handleRemoveFile}
            setRandomizeQuestions={setRandomizeQuestions}
            disabled={isSaving}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            validationErrors={validationErrors}
          />

          <CognitiveTaskFooter
            onSave={saveForm}
            onPreview={handlePreview}
            onDelete={handleDeleteWithModal}
            isSaving={isSaving}
            cognitiveTaskId={cognitiveTaskId}
            researchId={researchId}
          />
        </div>
      </div>

      {/* Columna derecha - Sidebar fijo con contenido educativo */}
      <div className="flex-[1] min-w-[400px]">
        <div className="sticky top-6">
          <EducationalContentSidebar
            content={cognitiveTaskContent}
            loading={educationalLoading}
            error={educationalError}
            title="Configuración Avanzada"
          />
        </div>
      </div>

      {/* Modales */}
      <ErrorModal
        isOpen={modalVisible}
        onClose={closeModal}
        error={modalError}
      />

      <JsonPreviewModal
        isOpen={showJsonPreview}
        onClose={closeJsonModal}
        onContinue={continueWithAction}
        jsonData={jsonToSend}
        pendingAction={pendingAction}
        hasValidationErrors={!!validationErrors && Object.keys(validationErrors).length > 0}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar TODOS los datos Cognitive Tasks de esta investigación? Esta acción no se puede deshacer."
      />
    </div>
  );
};
