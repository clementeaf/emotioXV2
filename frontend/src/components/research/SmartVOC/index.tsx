import React from 'react';

import { FormsSkeleton } from '@/components/research/WelcomeScreen/components/FormsSkeleton';
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
    isEmpty
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
      <div className={className}>
        <FormsSkeleton />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Mensaje amigable si no hay configuración previa */}
      {isEmpty && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
          <strong>¡Aún no has configurado el formulario SmartVOC!</strong><br />
          Agrega preguntas y guarda para comenzar a recolectar feedback de los participantes.
        </div>
      )}
      {/* Indicador de estado - Solo para debugging */}
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
