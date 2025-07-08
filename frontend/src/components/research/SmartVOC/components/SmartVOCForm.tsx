import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';


import { useSmartVOCForm } from '../hooks/useSmartVOCForm';
import { SmartVOCFormProps } from '../types';
import { generateNewQuestion } from '../utils';

import {
  AddQuestionButton,
  ConfirmationModal,
  ErrorModal,
  SmartVOCFooter,
  SmartVOCQuestions,
  SmartVOCSettings,
} from '.';

export const SmartVOCForm: React.FC<SmartVOCFormProps> = ({
  className,
  researchId,
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
    updateSettings,
    addQuestion,
    removeQuestion,
    handleSave,
    handlePreview,
    closeModal,
    handleDelete,
    isDeleteModalOpen,
    confirmDelete,
    closeDeleteModal,
  } = useSmartVOCForm(researchId);

  const handleAddQuestion = () => {
    const newQuestion = generateNewQuestion(questions.length);
    addQuestion(newQuestion);
  };

  // console.log('isDeleteModalOpen: ', isDeleteModalOpen);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={cn('w-full space-y-4', className)}>
        {/* Configuración principal */}
        <SmartVOCSettings
          randomize={formData.randomizeQuestions}
          onRandomizeChange={(value) => updateSettings({ randomizeQuestions: value })}
          requireAnswers={formData.smartVocRequired}
          onRequireAnswersChange={(value) => updateSettings({ smartVocRequired: value })}
          disabled={isLoading || isSaving}
        />

        {/* Contenido principal en un contenedor con bordes */}
        <div className="space-y-6 p-6 bg-white rounded-lg border border-neutral-100">
          <SmartVOCQuestions
            questions={questions}
            onUpdateQuestion={updateQuestion}
            onAddQuestion={addQuestion}
            onRemoveQuestion={removeQuestion}
            disabled={isLoading || isSaving}
          />

          <AddQuestionButton onClick={handleAddQuestion} />
        </div>

        {/* Pie de página con acciones */}
        <SmartVOCFooter
          isSaving={isSaving}
          isLoading={isLoading}
          smartVocId={smartVocId}
          researchId={researchId}
          onSave={handleSave}
          onPreview={handlePreview}
          onDelete={handleDelete}
          isExisting={!!smartVocId}
        />

        {/* Modal de errores (SOLO para errores) */}
        <ErrorModal
          isOpen={modalVisible}
          onClose={closeModal}
          error={modalError}
        />

        {/* Modal de confirmación (NUEVO y específico) */}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          title="Confirmar Eliminación"
          message="¿Estás seguro de que quieres eliminar TODOS los datos SmartVOC de esta investigación? Esta acción no se puede deshacer."
        />
      </div>
    </DndProvider>
  );
};
