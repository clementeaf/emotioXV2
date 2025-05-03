import React from 'react';
import { SmartVOCFormProps } from '../types';
import { useSmartVOCForm } from '../hooks/useSmartVOCForm';
import {
  SmartVOCHeader,
  SmartVOCSettings,
  SmartVOCQuestions,
  SmartVOCFooter,
  ErrorModal,
  AddQuestionButton,
} from '.';
import { cn } from '@/lib/utils';
import { UI_TEXTS } from '../constants';
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={cn('max-w-4xl space-y-4', className)}>
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
          <SmartVOCHeader 
            title={UI_TEXTS.TITLE}
            description={UI_TEXTS.DESCRIPTION}
          />

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
    </DndProvider>
  );
};
