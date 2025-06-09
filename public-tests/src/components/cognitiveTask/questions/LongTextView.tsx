import React from 'react';
import { CognitiveQuestion } from '../../../types/cognitive-task.types';
import QuestionHeader from '../common/QuestionHeader';
import TextAreaField from '../../common/TextAreaField';
import { useStandardizedForm, valueExtractors, validationRules } from '../../../hooks/useStandardizedForm';
import { StandardizedFormProps } from '../../../types/hooks.types';
import { getStandardButtonText, getButtonDisabledState, getErrorDisplayProps, getFormContainerClass, formSpacing } from '../../../utils/formHelpers';

// Interface específica para este componente  
interface LongTextViewComponentProps {
  config: CognitiveQuestion;
  onStepComplete?: (answer?: unknown) => void;
  savedResponse?: { id?: string; response?: unknown } | null;
  savedResponseId?: string | null;
}

export const LongTextView: React.FC<LongTextViewComponentProps> = ({ 
  config, 
  onStepComplete,
  savedResponse,
  savedResponseId,
}) => {
  const id = config.id || '';
  const type = config.type || 'long_text';
  const title = config.title || 'Pregunta';
  const description = config.description;
  const answerPlaceholder = config.answerPlaceholder || 'Escribe tu respuesta detallada aquí...';
  const required = config.required;

  // Crear props estandarizadas
  const standardProps: StandardizedFormProps = {
    stepId: id,
    stepType: type,
    stepName: title,
    savedResponse,
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
    if (result.success) {
      onStepComplete?.(result.data);
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
      <QuestionHeader title={title} description={description} required={required} />
      
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