import React from 'react';
import { useStandardizedForm, validationRules, valueExtractors } from '../../../hooks/useStandardizedForm';
import { CognitiveQuestion } from '../../../types/cognitive-task.types';
import { MappedStepComponentProps } from '../../../types/flow.types';
import { StandardizedFormProps } from '../../../types/hooks.types';
import { formSpacing, getButtonDisabledState, getErrorDisplayProps, getFormContainerClass, getStandardButtonText } from '../../../utils/formHelpers';
import TextAreaField from '../../common/TextAreaField';
import QuestionHeader from '../common/QuestionHeader';

export const LongTextView: React.FC<MappedStepComponentProps> = (props) => {
  const { stepConfig, onStepComplete, savedResponse, savedResponseId } = props;
  const config = stepConfig as CognitiveQuestion;

  const id = config.id || '';
  const type = config.type || 'long_text';
  const title = config.title || 'Pregunta';
  const description = config.description;
  const answerPlaceholder = config.answerPlaceholder || '';
  const required = config.required;

  // Crear props estandarizadas
  const standardProps: StandardizedFormProps = {
    stepId: id,
    stepType: type,
    stepName: title,
    savedResponse: savedResponse as { id?: string | undefined; response?: unknown; } | null | undefined,
    savedResponseId,
    required
  };

  const [state, actions] = useStandardizedForm<string>(standardProps, {
    initialValue: '',
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
    hasExistingData: hasExistingData || !!value.trim()
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
