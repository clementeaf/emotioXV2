import React from 'react';

import {
  ConfirmationModal,
  ErrorModal,
  SmartVOCFooter,
  SmartVOCHeader,
  SmartVOCQuestions,
  SmartVOCSettings,
} from './components';
import { UI_TEXTS } from './constants';
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
    updateSettings,
    handleSave,
    handlePreview,
    handleDelete,
    closeModal,
    isExisting,
    isDeleteModalOpen,
    confirmDelete,
    closeDeleteModal,
  } = useSmartVOCForm(researchId);

  // Callbacks para cambios en los ajustes
  const handleRandomizeChange = (checked: boolean) => {
    updateSettings({ randomizeQuestions: checked });
  };

  const handleRequireAnswersChange = (checked: boolean) => {
    updateSettings({ smartVocRequired: checked });
  };

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
      if(typeof metadataToSend.createdAt !== 'string') {
        metadataToSend.createdAt = new Date().toISOString();
      }
      // Asegurar que estimatedCompletionTime es string
      if(typeof metadataToSend.estimatedCompletionTime !== 'string'){
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
      <div className={`${className} flex flex-col items-center justify-center`}>
        <div className="animate-pulse flex flex-col items-center space-y-4 w-full">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
          <div className="space-y-2 w-full">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="space-y-2 w-full">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-24 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="flex justify-end space-x-2 w-full">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-blue-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Encabezado */}
      <SmartVOCHeader
        title={UI_TEXTS.TITLE}
        description={UI_TEXTS.DESCRIPTION}
      />
      {/* Indicador de estado - Solo para debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 text-xs rounded">
          <p>Estado: {smartVocId ? 'Configuración existente' : 'Nueva configuración'}</p>
          <p>ID: {smartVocId || 'No hay ID (nueva)'}</p>
          <p>Preguntas activas: {questions.length}</p>
          <p>Aleatorizar: {formData.randomizeQuestions ? 'Sí' : 'No'}</p>
          <p>Requerir respuestas: {formData.smartVocRequired ? 'Sí' : 'No'}</p>
        </div>
      )}
      {/* Configuración general */}
      <SmartVOCSettings
        randomize={formData.randomizeQuestions}
        onRandomizeChange={handleRandomizeChange}
        requireAnswers={formData.smartVocRequired}
        onRequireAnswersChange={handleRequireAnswersChange}
        disabled={isLoading || isSaving}
      />
      {/* Gestión de preguntas */}
      <SmartVOCQuestions
        questions={questions}
        onUpdateQuestion={updateQuestion}
        onAddQuestion={addQuestion}
        onRemoveQuestion={removeQuestion}
        disabled={isLoading || isSaving}
      />
      {/* Pie de página con acciones */}
      <SmartVOCFooter
        isSaving={isSaving}
        isLoading={isLoading}
        smartVocId={smartVocId}
        isExisting={isExisting}
        researchId={researchId}
        onSave={handleSaveAndNotify}
        onPreview={handlePreview}
        onDelete={handleDelete}
      />
      {/* Modal para mostrar errores y mensajes */}
      <ErrorModal
        isOpen={modalVisible}
        onClose={closeModal}
        error={modalError}
      />

      {/* Modal de confirmación para eliminar datos */}
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
