import React from 'react';
import { useStandardizedForm, validationRules, valueExtractors } from '../../../hooks/useStandardizedForm';
import { CognitiveQuestion } from '../../../types/cognitive-task.types';
import { MappedStepComponentProps } from '../../../types/flow.types';
import { StandardizedFormProps } from '../../../types/hooks.types';
import { formSpacing, getButtonDisabledState, getErrorDisplayProps, getFormContainerClass, getStandardButtonText } from '../../../utils/formHelpers';
import TextAreaField from '../../common/TextAreaField';
import QuestionHeader from '../common/QuestionHeader';

export const LongTextView: React.FC<MappedStepComponentProps> = (props) => {
  const { stepConfig, onStepComplete, savedResponse, savedResponseId, questionKey } = props; // NUEVO: Extraer questionKey
  const config = stepConfig as CognitiveQuestion;

  // NUEVO: Usar questionKey del backend como identificador principal
  const id = questionKey || config.id || '';
  const type = config.type || 'long_text';
  const title = config.title || 'Pregunta';
  const description = config.description;
  const answerPlaceholder = config.answerPlaceholder || '';
  const required = config.required;

  // NUEVO: Log para verificar que se está usando el questionKey correcto
  console.log('[LongTextView] 🔍 Debug info:', {
    questionKey,
    configId: config.id,
    finalId: id,
    questionTitle: title,
    stepType: type
  });

  // Crear props estandarizadas
  const standardProps: StandardizedFormProps = {
    stepId: id, // NUEVO: Usar id basado en questionKey
    stepType: type,
    stepName: title,
    savedResponse: savedResponse as { id?: string | undefined; response?: unknown; } | null | undefined,
    savedResponseId,
    required
  };

  // Determinar el valor inicial a partir de la respuesta previa
  let initialValue = '';
  if (savedResponse && typeof savedResponse === 'object' && 'response' in savedResponse && typeof savedResponse.response === 'string') {
    initialValue = savedResponse.response;
  } else if (typeof savedResponse === 'string') {
    initialValue = savedResponse;
  }

  const [state, actions] = useStandardizedForm<string>(standardProps, {
    initialValue,
    extractValueFromResponse: valueExtractors.textValue,
    validationRules: required ? [validationRules.required('Por favor, escribe una respuesta.')] : []
  });

  const { value, isSaving, isLoading, error, hasExistingData, isDataLoaded } = state;
  const { setValue, validateAndSave } = actions;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleSubmit = async () => {
    const result = await validateAndSave();
    if (result.success && onStepComplete) {
      onStepComplete(result.data);
    }
  };

  const buttonText = getStandardButtonText({
    isSaving,
    isLoading,
    hasExistingData
  });

  const isButtonDisabled = getButtonDisabledState({
    isRequired: required,
    value,
    isSaving,
    isLoading,
    hasError: !!error
  });

  const errorDisplay = getErrorDisplayProps(error);

  if (isLoading && !isDataLoaded) {
    return (
      <div className={getFormContainerClass('centered')}>
        <div className="text-center text-neutral-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className={getFormContainerClass('centered')}>
      <QuestionHeader title={title} instructions={description} required={required} />

      <TextAreaField
        id={`long-text-${id}`}
        name={`long-text-${id}`}
        label={title}
        value={value}
        onChange={handleChange}
        placeholder={answerPlaceholder}
        disabled={isSaving || isLoading}
      />

      {errorDisplay.hasError && (
        <div className={`${errorDisplay.errorClassName} ${formSpacing.error}`}>
          {errorDisplay.errorMessage}
        </div>
      )}

      <button
        className={`bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg ${formSpacing.button} disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={handleSubmit}
        disabled={isButtonDisabled}
      >
        {buttonText}
      </button>
    </div>
  );
};
