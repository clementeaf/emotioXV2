'use client';

import React from 'react';
import { CognitiveTaskFormProps } from './types';
import { useCognitiveTaskForm } from './hooks/useCognitiveTaskForm';
import { CognitiveTaskHeader } from './components/CognitiveTaskHeader';
import { CognitiveTaskFooter } from './components/CognitiveTaskFooter';
import { ErrorModal } from './components/ErrorModal';
import { UI_TEXTS } from './constants';
import { cn } from '@/lib/utils';
import { CognitiveTaskFields } from './components/CognitiveTaskFields';

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
    handleFileUpload,
    handleFileDelete: handleRemoveFile,
    handleAddQuestion,
    handleRandomizeChange: setRandomizeQuestions,
    handleSave: saveForm,
    validateForm,
    closeModal
  } = useCognitiveTaskForm(researchId);
  
  // Manejo de la acción de guardar
  const handleSave = () => {
    if (validateForm()) {
      saveForm();
      if (onSave) {
        onSave(formData);
      }
    }
  };

  // Mientras carga, mostrar un indicador de carga
  if (isLoading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-sm ${className} flex flex-col items-center justify-center`}>
        <div className="animate-pulse flex flex-col items-center space-y-4 w-full">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
          {/* Skeleton para preguntas */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 w-full border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-20 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
          <div className="flex justify-end space-x-2 w-full">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-blue-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('max-w-3xl mx-auto', className)}>
      {/* Encabezado */}
      <CognitiveTaskHeader 
        title={UI_TEXTS.TITLE} 
        description={UI_TEXTS.DESCRIPTION}
      />

      {/* Campos del formulario */}
      <CognitiveTaskFields 
        questions={formData.questions || []}
        randomizeQuestions={formData.randomizeQuestions || false}
        onQuestionChange={handleQuestionChange}
        onAddChoice={handleAddChoice}
        onRemoveChoice={handleRemoveChoice}
        onFileUpload={handleFileUpload}
        onRemoveFile={handleRemoveFile}
        setRandomizeQuestions={setRandomizeQuestions}
        onAddQuestion={handleAddQuestion}
        disabled={isLoading || isSaving}
      />
      
      {/* Pie de página con acciones */}
      <CognitiveTaskFooter 
        completionTimeText="Tiempo estimado de finalización: 5-7 minutos"
        previewButtonText="Vista Previa"
        saveButtonText={isSaving ? "Guardando..." : "Guardar y Continuar"}
        onPreview={() => {}}
        onSave={handleSave}
        isSaving={isSaving}
        disabled={isLoading || isSaving}
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