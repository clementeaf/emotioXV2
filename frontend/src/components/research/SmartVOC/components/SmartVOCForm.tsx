import React from 'react';
import { SmartVOCFormProps } from '../types';
import { useSmartVOCForm } from '../hooks/useSmartVOCForm';
import {
  SmartVOCHeader,
  SmartVOCSettings,
  SmartVOCQuestions,
  SmartVOCFooter,
  ErrorModal,
  JsonPreviewModal
} from '.';
import { cn } from '@/lib/utils';
import { UI_TEXTS } from '../constants';

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
    updateSettings,
    addQuestion,
    removeQuestion,
    handleSave,
    handlePreview,
    closeModal,
    showJsonPreview,
    closeJsonModal,
    jsonToSend,
    pendingAction,
    continueWithAction
  } = useSmartVOCForm(researchId);

  return (
    <div className={cn('space-y-6', className)}>
      <SmartVOCHeader 
        title={UI_TEXTS.TITLE}
        description={UI_TEXTS.DESCRIPTION}
      />

      <SmartVOCSettings
        randomize={formData.randomizeQuestions}
        onRandomizeChange={(value) => updateSettings({ randomizeQuestions: value })}
        requireAnswers={formData.smartVocRequired}
        onRequireAnswersChange={(value) => updateSettings({ smartVocRequired: value })}
        disabled={isLoading || isSaving}
      />

      <SmartVOCQuestions
        questions={questions}
        onUpdateQuestion={updateQuestion}
        onAddQuestion={addQuestion}
        onRemoveQuestion={removeQuestion}
        disabled={isLoading || isSaving}
      />

      <SmartVOCFooter
        isSaving={isSaving}
        isLoading={isLoading}
        smartVocId={smartVocId}
        onSave={handleSave}
        onPreview={handlePreview}
      />

      <ErrorModal
        isOpen={modalVisible}
        onClose={closeModal}
        error={modalError}
      />

      {showJsonPreview && (
        <JsonPreviewModal
          isOpen={showJsonPreview}
          onClose={closeJsonModal}
          onContinue={continueWithAction}
          jsonData={jsonToSend}
          pendingAction={pendingAction}
        />
      )}
    </div>
  );
}; 