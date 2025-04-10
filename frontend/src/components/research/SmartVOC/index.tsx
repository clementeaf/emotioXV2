import React from 'react';
import { SmartVOCFormProps, DEFAULT_SMART_VOC_CONFIG } from './types';
import { useSmartVOCForm } from './hooks/useSmartVOCForm';
import {
  SmartVOCHeader,
  SmartVOCSettings,
  SmartVOCQuestions,
  SmartVOCFooter,
  ErrorModal,
  JsonPreviewModal
} from './components';
import { UI_TEXTS } from './constants';

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
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    updateQuestion,
    addQuestion,
    removeQuestion,
    handleSettingChange,
    handleSave,
    handlePreview,
    closeModal,
    showJsonPreview,
    closeJsonModal,
    jsonToSend,
    pendingAction,
    continueWithAction
  } = useSmartVOCForm(researchId);

  // Callbacks para cambios en los ajustes
  const handleRandomizeChange = (checked: boolean) => {
    handleSettingChange('randomize', checked);
  };

  const handleRequireAnswersChange = (checked: boolean) => {
    handleSettingChange('requireAnswers', checked);
  };

  // Callback para guardar y notificar al componente padre si es necesario
  const handleSaveAndNotify = () => {
    handleSave();
    if (onSave) {
      onSave({
        ...formData,
        questions
      });
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
    <div className={`bg-white p-6 rounded-lg shadow-sm ${className}`}>
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
          <p>Aleatorizar: {formData.randomize ? 'Sí' : 'No'}</p>
          <p>Requerir respuestas: {formData.requireAnswers ? 'Sí' : 'No'}</p>
        </div>
      )}
      
      {/* Configuración general */}
      <SmartVOCSettings 
        randomize={formData.randomize}
        onRandomizeChange={handleRandomizeChange}
        requireAnswers={formData.requireAnswers}
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
        onSave={handleSaveAndNotify}
        onPreview={handlePreview}
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
      />
    </div>
  );
}; 