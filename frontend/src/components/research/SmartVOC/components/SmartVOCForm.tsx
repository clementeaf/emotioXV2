import React from 'react';
import { SmartVOCFormProps } from '../types';
import { useSmartVOCForm } from '../hooks/useSmartVOCForm';
import {
  SmartVOCSettings,
  SmartVOCQuestions,
  SmartVOCFooter,
  ErrorModal,
  AddQuestionButton,
} from '.';
import { cn } from '@/lib/utils';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Spinner } from '@/components/ui/Spinner';
import { generateNewQuestion } from '../utils';

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
  } = useSmartVOCForm(researchId);

  const handleAddQuestion = () => {
    const newQuestion = generateNewQuestion(questions.length);
    addQuestion(newQuestion);
  };

  if (isLoading) {
    return <Spinner />;
  }

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

  return (
    <DndProvider backend={HTML5Backend}>
      {/* Contenedor principal con restricción de ancho */}
      <div style={containerStyle}>
        <div className={cn('space-y-4', className)} style={innerContainerStyle}>
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
            onSave={handleSave}
            onPreview={handlePreview}
          />

          {/* Modal de errores */}
          <ErrorModal
            isOpen={modalVisible}
            onClose={closeModal}
            error={modalError}
          />
        </div>
      </div>
    </DndProvider>
  );
};
