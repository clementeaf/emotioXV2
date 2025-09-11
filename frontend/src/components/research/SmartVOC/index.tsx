import React from 'react';

import { FormsSkeleton } from '@/components/research/WelcomeScreen/components/FormsSkeleton';
import {
  ConfirmationModal,
  ErrorModal,
  SmartVOCFooter,
  SmartVOCQuestions,
} from './components';
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
    closeDeleteModal,
    isEmpty
  } = useSmartVOCForm(researchId);


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
    <div className={`${className} relative`}>
      {/* Contenido principal con ancho fijo */}
      <div className="max-w-4xl">
        {/* Mensaje amigable si no hay configuración previa */}
        {isEmpty && (
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
            <strong>¡Aún no has configurado el formulario SmartVOC!</strong><br />
            Agrega preguntas y guarda para comenzar a recolectar feedback de los participantes.
          </div>
        )}
        
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
                <div>Preguntas configuradas: {questions.length}</div>
                <div>Estado: {isExisting ? 'Guardado' : 'Sin guardar'}</div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm text-blue-700 mb-2">Tipos de Pregunta</h4>
              <div className="text-xs text-blue-600 space-y-1">
                {questions.map((q, idx) => (
                  <div key={q.id}>
                    Pregunta {idx + 1}: {q.type}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modales */}
      <ErrorModal
        isOpen={modalVisible}
        onClose={closeModal}
        error={modalError}
      />

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
