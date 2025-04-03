import React, { useEffect } from 'react';
import { CognitiveTaskFormProps, Question, QuestionType } from './types';
import { useCognitiveTaskForm } from './hooks/useCognitiveTaskForm';
import { 
  AddQuestionModal, 
  CognitiveTaskHeader, 
  CognitiveTaskSettings, 
  CognitiveTaskFooter,
  QuestionCard
} from './components';
import { Button } from '@/components/ui/Button';
import { UI_TEXTS, QUESTION_TYPES, ERROR_MESSAGES } from './constants';

// Función para crear preguntas de ejemplo con tipos correctos
const createDefaultQuestions = (): Question[] => [
  {
    id: '3.1',
    type: 'short_text' as QuestionType,
    title: 'Pregunta de texto corto de ejemplo',
    description: 'Descripción opcional para esta pregunta',
    required: true,
    showConditionally: false,
    deviceFrame: false
  },
  {
    id: '3.2',
    type: 'long_text' as QuestionType,
    title: 'Pregunta de texto largo de ejemplo',
    description: 'Descripción opcional para esta pregunta',
    required: true,
    showConditionally: false,
    deviceFrame: false
  },
  {
    id: '3.3',
    type: 'single_choice' as QuestionType,
    title: 'Pregunta de selección única de ejemplo',
    description: 'Descripción opcional para esta pregunta',
    required: true,
    showConditionally: false,
    choices: [
      { id: '1', text: 'Opción 1' },
      { id: '2', text: 'Opción 2' },
      { id: '3', text: 'Opción 3' }
    ],
    deviceFrame: false
  },
  {
    id: '3.4',
    type: 'multiple_choice' as QuestionType,
    title: 'Pregunta de selección múltiple de ejemplo',
    description: 'Descripción opcional para esta pregunta',
    required: true,
    showConditionally: false,
    choices: [
      { id: '1', text: 'Opción 1' },
      { id: '2', text: 'Opción 2' },
      { id: '3', text: 'Opción 3' }
    ],
    deviceFrame: false
  },
  {
    id: '3.5',
    type: 'linear_scale' as QuestionType,
    title: 'Pregunta de escala lineal de ejemplo',
    description: 'Descripción opcional para esta pregunta',
    required: true,
    showConditionally: false,
    scaleConfig: {
      startValue: 1,
      endValue: 5,
      startLabel: 'Poco',
      endLabel: 'Mucho'
    },
    deviceFrame: false
  },
  {
    id: '3.6',
    type: 'ranking' as QuestionType,
    title: 'Pregunta de ranking de ejemplo',
    description: 'Descripción opcional para esta pregunta',
    required: true,
    showConditionally: false,
    choices: [
      { id: '1', text: 'Opción 1' },
      { id: '2', text: 'Opción 2' },
      { id: '3', text: 'Opción 3' }
    ],
    deviceFrame: false
  },
  {
    id: '3.7',
    type: 'navigation_flow' as QuestionType,
    title: 'Prueba de flujo de navegación de ejemplo',
    description: 'Carga pantallas y define el flujo de navegación',
    required: true,
    showConditionally: false,
    files: [],
    deviceFrame: true
  },
  {
    id: '3.8',
    type: 'preference_test' as QuestionType,
    title: 'Prueba de preferencia de ejemplo',
    description: 'Comparación de diseños para evaluar preferencias',
    required: true,
    showConditionally: false,
    files: [],
    deviceFrame: true
  }
];

/**
 * Componente principal para la creación y edición de tareas cognitivas
 */
export const CognitiveTaskForm: React.FC<CognitiveTaskFormProps> = ({
  className = '',
  researchId,
  onSave
}) => {
  const {
    // Estado
    formData,
    cognitiveTaskId,
    isLoading,
    isSaving,
    validationErrors,
    isAddQuestionModalOpen,
    modalError,
    modalVisible,
    // Callbacks
    handleQuestionChange,
    handleAddChoice,
    handleRemoveChoice,
    handleFileUpload,
    handleMultipleFilesUpload,
    handleFileDelete,
    handleRandomizeChange,
    handleAddQuestion,
    openAddQuestionModal,
    closeAddQuestionModal,
    handleSave,
    handlePreview,
    closeModal,
    initializeDefaultQuestions,
    // Constantes
    questionTypes
  } = useCognitiveTaskForm(researchId);

  // Agregar preguntas de ejemplo cuando se carga el componente por primera vez
  useEffect(() => {
    // Solo inicializar con preguntas por defecto si no hay preguntas y no está cargando
    if (!isLoading && formData.questions.length === 0) {
      initializeDefaultQuestions(createDefaultQuestions());
    }
  }, [isLoading, formData.questions.length, initializeDefaultQuestions]);

  // Callback para notificar al componente padre cuando se guardan los datos
  const handleSaveWithCallback = React.useCallback(async () => {
    try {
      await handleSave();
      // Solo llamamos a onSave si existe y pasamos formData
      if (onSave && formData) {
        onSave(formData);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  }, [handleSave, onSave, formData]);

  // Mostrar loading si está cargando datos
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin text-primary border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabecera con título y descripción */}
      <CognitiveTaskHeader
        title={UI_TEXTS.TITLE}
        description={UI_TEXTS.DESCRIPTION}
      />

      {/* Ajustes generales */}
      <CognitiveTaskSettings
        randomizeQuestions={formData.randomizeQuestions}
        onRandomizeChange={handleRandomizeChange}
        disabled={isSaving}
      />

      {/* Lista de preguntas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-neutral-800">
            Preguntas
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={openAddQuestionModal}
            disabled={isSaving}
          >
            {UI_TEXTS.FOOTER?.ADD_QUESTION_BUTTON || 'Añadir pregunta'}
          </Button>
        </div>

        {formData?.questions?.length === 0 ? (
          <div className="p-6 text-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
            <p className="text-neutral-500">
              {ERROR_MESSAGES?.VALIDATION_ERRORS?.NO_QUESTIONS || 'No hay preguntas. Añade al menos una pregunta.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData?.questions?.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onQuestionChange={handleQuestionChange}
                onAddChoice={handleAddChoice}
                onRemoveChoice={handleRemoveChoice}
                onFileUpload={handleFileUpload}
                onMultipleFilesUpload={handleMultipleFilesUpload}
                onFileDelete={handleFileDelete}
                disabled={isSaving}
                validationErrors={validationErrors}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer con acciones */}
      <CognitiveTaskFooter
        isSaving={isSaving}
        isLoading={isLoading}
        cognitiveTaskId={cognitiveTaskId}
        onSave={handleSaveWithCallback}
        onPreview={handlePreview}
      />

      {/* Modal para añadir preguntas */}
      <AddQuestionModal
        isOpen={isAddQuestionModalOpen}
        onClose={closeAddQuestionModal}
        onAddQuestion={handleAddQuestion}
        questionTypes={questionTypes || QUESTION_TYPES}
      />

      {/* Modal de error si es necesario */}
      {modalVisible && modalError && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
            <div className="p-4 flex justify-between items-center bg-red-50 text-red-800">
              <h3 className="text-lg font-medium">{modalError.title}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">{modalError.message}</p>
              <div className="flex justify-end">
                <button onClick={closeModal} className="px-4 py-2 text-sm font-medium rounded bg-red-500 hover:bg-red-600 text-white">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 