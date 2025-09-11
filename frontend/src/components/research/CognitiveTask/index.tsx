'use client';

import React from 'react';
import { FormsSkeleton } from '@/components/research/WelcomeScreen/components/FormsSkeleton';
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
    continueWithAction,
    isEmpty
  } = useCognitiveTaskForm(researchId, onSave);

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

  // Estilo restrictivo para el formulario
  const containerStyle = {
    maxWidth: '768px',
    width: '100%',
    marginLeft: '0',
    marginRight: '0',
    overflowX: 'hidden' as const
  };

  // Estilo para el contenedor secundario
  const innerContainerStyle = {
    width: '100%',
    maxWidth: '768px',
    boxSizing: 'border-box' as const
  };

  // Mientras carga, mostrar un esqueleto de carga
  if (isLoading) {
    // Usar el mismo estilo de container para el skeleton
    return (
      <div style={containerStyle}>
        <div style={innerContainerStyle}>
          <FormsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div style={containerStyle}>
        <div className={cn('space-y-4', className)} style={innerContainerStyle}>
          {/* Mensaje amigable si no hay configuración previa */}
          {isEmpty && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
              <strong>¡Aún no has configurado la tarea cognitiva!</strong><br />
              Agrega preguntas y guarda para comenzar a recolectar datos de los participantes.
            </div>
          )}

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
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            title="Confirmar Eliminación"
            message="¿Estás seguro de que quieres eliminar TODOS los datos Cognitive Tasks de esta investigación? Esta acción no se puede deshacer."
          />
        </div>
      </div>

      {/* Columna lateral fija */}
      <div className="fixed top-20 right-32 w-80 h-[800px] bg-white border border-gray-200 rounded-lg shadow-lg p-4 overflow-y-auto">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg border-b pb-2">
            Configuración Avanzada
          </h3>
          
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Estadísticas</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Preguntas configuradas: {formData.questions.length}</div>
                <div>Estado: {cognitiveTaskId ? 'Guardado' : 'Sin guardar'}</div>
                <div>Aleatorización: {formData.randomizeQuestions ? 'Activa' : 'Inactiva'}</div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm text-blue-700 mb-2">Preguntas</h4>
              <div className="text-xs text-blue-600 space-y-1">
                {formData.questions.map((q, idx) => (
                  <div key={idx}>
                    Pregunta {idx + 1}: {q.type}
                    {q.files && q.files.length > 0 && (
                      <div className="ml-2 text-xs text-green-600">
                        {q.files.length} archivo(s)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
