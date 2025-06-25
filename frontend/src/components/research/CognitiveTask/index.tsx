'use client';

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import React from 'react';
import {
    CognitiveTaskFooter,
    CognitiveTaskHeader,
    ErrorModal,
    JsonPreviewModal,
    NavigationFlowPreview
} from './components';
import { CognitiveTaskFields } from './components/CognitiveTaskFields';
import { ProgressBar } from './components/ProgressBar';
import { UI_TEXTS } from './constants';
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
    closeModal,
    isUploading,
    uploadProgress,
    showJsonPreview,
    closeJsonModal,
    jsonToSend,
    pendingAction,
    continueWithAction,
    showInteractivePreview,
    closeInteractivePreview
  } = useCognitiveTaskForm(researchId, onSave);

  // Registrar información importante para debugging
  React.useEffect(() => {
    if (cognitiveTaskId) {
      console.log('[CognitiveTaskForm] Editando tarea cognitiva existente:', cognitiveTaskId);

      // Registrar información sobre archivos en las preguntas
      const questionsWithFiles = formData.questions.filter(q => q.files && q.files.length > 0);
      if (questionsWithFiles.length > 0) {
        console.log('[CognitiveTaskForm] Preguntas con archivos:', questionsWithFiles.length);
        questionsWithFiles.forEach(q => {
          console.log(`[CognitiveTaskForm] Pregunta ${q.id} (${q.type}) tiene ${q.files?.length || 0} archivos:`,
            q.files?.map(f => ({id: f.id, name: f.name, url: f.url, s3Key: f.s3Key})));
        });
      }
    } else {
      console.log('[CognitiveTaskForm] Creando nueva tarea cognitiva');
    }

    // Mostrar el modo actual del botón de guardar
    console.log('[CognitiveTaskForm] Estado del botón de guardar:', isSaving ? "Guardando..." : cognitiveTaskId ? "Actualizar" : "Guardar y Continuar");
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

  // Estilo restrictivo para el formulario
  const containerStyle = {
    maxWidth: '768px',
    width: '100%',
    marginLeft: '0',
    marginRight: '0',
    overflowX: 'hidden' as 'hidden'
  };

  // Estilo para el contenedor secundario
  const innerContainerStyle = {
    width: '100%',
    maxWidth: '768px',
    boxSizing: 'border-box' as 'border-box'
  };

  // Mientras carga, mostrar un esqueleto de carga
  if (isLoading) {
    // Usar el mismo estilo de container para el skeleton
    return (
      <div style={containerStyle}>
        <div style={innerContainerStyle}>
          <LoadingSkeleton variant="form" rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div className={cn('space-y-4', className)} style={innerContainerStyle}>
        {/* Encabezado */}
        <CognitiveTaskHeader
          title={UI_TEXTS.TITLE}
          description={UI_TEXTS.DESCRIPTION}
        />

        {/* --- Información Contextual --- */}
        <div className="mt-4 mb-6 p-3 bg-gray-50 border rounded-md text-sm text-gray-600">
          <p><span className="font-semibold">Estado:</span> {cognitiveTaskId ? 'Configuración existente' : 'Configuración nueva'}</p>
          {cognitiveTaskId && (
            <p><span className="font-semibold">ID:</span> {cognitiveTaskId}</p>
          )}
          {/* Asegurarse de que researchId siempre tenga valor aquí */}
          <p><span className="font-semibold">Research ID:</span> {researchId || 'No disponible'}</p>
        </div>
        {/* --- Fin Información Contextual --- */}

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
          onDelete={handleDelete}
          isSaving={isSaving}
          cognitiveTaskId={cognitiveTaskId}
          researchId={researchId}
        />

        {/* Modal para mostrar errores y mensajes */}
        <ErrorModal
          isOpen={modalVisible}
          onClose={closeModal}
          error={modalError}
        />

        {/* Modal para la vista previa del JSON */}
        <JsonPreviewModal
          isOpen={showJsonPreview}
          onClose={closeJsonModal}
          onContinue={continueWithAction}
          jsonData={jsonToSend}
          pendingAction={pendingAction}
          hasValidationErrors={!!validationErrors && Object.keys(validationErrors).length > 0}
        />

        {/* >>> NUEVO: Modal para la previsualización interactiva */}
        {showInteractivePreview && (
          <NavigationFlowPreview
            config={formData}
            onClose={closeInteractivePreview}
          />
        )}
      </div>
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
      <ProgressBar value={progress} className="h-2 w-full" />
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
                <Spinner size="sm" />
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
