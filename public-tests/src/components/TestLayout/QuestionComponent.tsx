
import React from 'react';
import { useFormLoadingState } from '../../hooks/useFormLoadingState';
import { EmojiRangeQuestion, ScaleRangeQuestion, SingleAndMultipleChoiceQuestion, VOCTextQuestion, LinearScaleSlider } from './QuestionesComponents';
import { useAutoAdvance } from '../../hooks/useAutoAdvance';
import { useQuestionHandlers } from '../../hooks/useQuestionHandlers';
import { useQuestionInitialization, Question, QuestionConfig, FormData } from '../../hooks/useQuestionInitialization';
import { EmotionGrid } from './emotions';

interface QuestionComponentProps {
  question: Question;
  currentStepKey: string;
  initialFormData?: FormData;
}



export const QuestionComponent: React.FC<QuestionComponentProps> = React.memo(({ question, currentStepKey, initialFormData }) => {
  const {
    isLoading,
    hasLoadedData,
    formValues,
    saveToStore
  } = useFormLoadingState({
    questionKey: currentStepKey
  });

  const { value, setValue } = useQuestionInitialization({
    question,
    currentStepKey,
    initialFormData,
    formValues,
    hasLoadedData
  });

  // 🎯 HOOK PARA AUTO-AVANCE
  const { isAdvancing, triggerAutoAdvance } = useAutoAdvance({
    questionType: question.type,
    maxSelections: question.config?.maxSelections,
    currentQuestionKey: currentStepKey,
    onAdvance: () => {
      // Callback opcional después del avance
    }
  });

  // 🎯 HOOK PARA MANEJAR CAMBIOS SEGÚN TIPO DE PREGUNTA
  const { handleChange } = useQuestionHandlers({
    questionType: question.type,
    config: question.config,
    value,
    setValue,
    onSave: (dataToSave) => {
      saveToStore(dataToSave);
      // ✅ Solo guarda en FormDataStore, NO envía al backend
    },
    onAutoAdvance: (selections) => {
      triggerAutoAdvance(selections);
    },
    isAdvancing
  });

  // 🎯 HANDLER MEMOIZADO PARA CLICKS DE EMOCIONES
  const handleEmotionClick = React.useCallback((emotion: string) => {
    handleChange(emotion);
  }, [handleChange]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Cargando...</div>;
  }

  return (
    <div key={`question-${currentStepKey}-${question.type}`} className="flex flex-col items-center justify-center h-full gap-6 p-8">
      {question.title && question.title.trim() !== '' && (
        <p className="text-gray-600 text-center max-w-2xl">
          {question.title}
        </p>
      )}
      {question.description && question.description.trim() !== '' && (
        <p className="text-gray-600 text-center max-w-2xl">
          {question.description}
        </p>
      )}
      {question.config?.instructions && (
        <p className="text-sm text-gray-500 text-center max-w-2xl mt-2">
          {question.config.instructions}
        </p>
      )}

      <div className="w-full max-w-2xl">
        {question.type === 'choice' && (
          <SingleAndMultipleChoiceQuestion
              key={`choice-${currentStepKey}-${question.title.replace(/\s+/g, '-')}`}
              choices={(question.choices || []).map((choice: any) => ({
                id: choice.id || choice.value || String(choice.text || choice.label),
                text: choice.text || choice.label || String(choice.id || choice.value),
                isQualify: choice.isQualify,
                isDisqualify: choice.isDisqualify
              }))}
              value={value as string | string[]}
              onChange={handleChange}
              multiple={question.config?.multiple || false}
            />
        )}
        {question.type === 'scale' && (
            <ScaleRangeQuestion
              min={question.config?.min as number | undefined}
              max={question.config?.max as number | undefined}
            startLabel={question.config?.startLabel}
            endLabel={question.config?.endLabel}
            leftLabel={question.config?.leftLabel}
            rightLabel={question.config?.rightLabel}
            value={value as number}
            onChange={handleChange}
          />
        )}
        {question.type === 'linear_scale' && (
          <LinearScaleSlider
            min={question.config?.min as number | undefined}
            max={question.config?.max as number | undefined}
            startLabel={question.config?.startLabel}
            endLabel={question.config?.endLabel}
            value={value as number}
            onChange={handleChange}
          />
        )}
        {question.type === 'emoji' && (
          <EmojiRangeQuestion
              emojis={question.config?.emojis}
              value={value as number}
              onChange={handleChange}
              type={(question.config?.type as "emojis" | "stars") || 'emojis'}
              min={question.config?.min as number | undefined}
              max={question.config?.max as number | undefined}
              startLabel={question.config?.startLabel}
              endLabel={question.config?.endLabel}
            />
        )}
        {question.type === 'text' && (
          <VOCTextQuestion
              value={value as string}
              onChange={handleChange}
              placeholder={question.config?.placeholder as string}
            />
        )}
        {(question.type === 'cognitive_short_text' || question.type === 'cognitive_long_text') && (
          <VOCTextQuestion
              value={value as string}
              onChange={handleChange}
              placeholder={question.config?.placeholder as string || 'Escribe tu respuesta aquí...'}
            />
        )}
        {(question.type === 'smartvoc_nev' || question.type === 'detailed' || question.type === 'emojis') && (
          <EmotionGrid
            value={value}
            onEmotionClick={handleEmotionClick}
          />
        )}
      </div>
    </div>
  );
});

// 🎯 DISPLAY NAME PARA MEJOR DEBUGGING
QuestionComponent.displayName = 'QuestionComponent';
