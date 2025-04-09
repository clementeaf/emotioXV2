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
import { FileUploader } from './components/FileUploader';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

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
    closeModal,
    // Estados para carga de archivos
    isUploading,
    uploadProgress,
    currentFileIndex,
    totalFiles
  } = useCognitiveTaskForm(researchId);
  
  // Manejo de la acción de guardar
  const handleSave = () => {
    // No llamamos a saveForm() directamente, sino al método handleSave del hook
    // que se encargará de mostrar el modal JSON antes de guardar
    saveForm();
    
    // La función onSave del prop debe llamarse después de que el usuario
    // confirme en el modal, no aquí directamente
    if (onSave) {
      // Este callback lo moveremos al hook
      onSave(formData);
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
        isUploading={isUploading}
        uploadProgress={uploadProgress}
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

/**
 * Componente para mostrar el progreso de carga de archivos
 */
const FileProgressIndicator = ({ progress, isLoading }: { progress: number; isLoading: boolean }) => {
  if (!isLoading) return null;
  
  return (
    <div className="my-2">
      <div className="flex items-center gap-2 mb-1">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm text-gray-600">Cargando... {progress}%</span>
      </div>
      <Progress value={progress} className="h-2 w-full" />
    </div>
  );
};

/**
 * Componente para mostrar un archivo con su progreso
 */
const FileItem = ({ file, onDelete }: { file: any; onDelete: () => void }) => {
  return (
    <div className="relative border rounded-md p-3 mb-2 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          {file.type?.startsWith('image/') && file.url && (
            <div className="relative w-12 h-12 overflow-hidden rounded border bg-gray-100 flex items-center justify-center">
              {file.isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <img src={file.url} alt={file.name} className="object-contain w-full h-full" />
              )}
            </div>
          )}
          <div>
            <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
              {file.isLoading && ` • Cargando...`}
            </p>
          </div>
        </div>
        <button 
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 p-1"
          disabled={file.isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      {file.isLoading && <FileProgressIndicator progress={file.progress || 0} isLoading={file.isLoading} />}
    </div>
  );
}; 