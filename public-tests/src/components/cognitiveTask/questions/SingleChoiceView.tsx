import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../../hooks/useStepResponseManager';
import { MappedStepComponentProps } from '../../../types/flow.types';
import FormSubmitButton from '../../common/FormSubmitButton';
import RadioButtonGroup from '../../common/RadioButtonGroup';
import QuestionHeader from '../common/QuestionHeader';

export const SingleChoiceView: React.FC<MappedStepComponentProps> = (props) => {
  const { stepConfig, onStepComplete, savedResponse, questionKey } = props;
  const config = stepConfig as any;

  const id = questionKey || config.id || '';
  const title = config.title || 'Pregunta';
  const description = config.description;
  const options = config.options || config.choices || [];
  const required = config.required;

  // Hook de persistencia igual que SmartVOC/ShortTextView/LongTextView
  const {
    responseData,
    isSaving,
    isLoading,
    error,
    saveCurrentStepResponse,
    hasExistingData
  } = useStepResponseManager<string>({
    stepId: id,
    stepType: config.type || 'cognitive_single_choice',
    stepName: title,
    initialData: savedResponse as string | null | undefined,
    questionKey: id
  });

  // Estado local para la selección
  const [localValue, setLocalValue] = useState(savedResponse || '');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof savedResponse === 'string') {
      setLocalValue(savedResponse);
    } else {
      setLocalValue('');
    }
  }, [savedResponse]);

  const localHasExistingData = typeof savedResponse === 'string' && savedResponse.trim() !== '';

  if (!id || !options || !Array.isArray(options)) {
    console.error('[SingleChoiceView] Configuración inválida (sin ID u opciones):', config);
    return <div className="p-4 text-red-600">Error: Pregunta mal configurada.</div>;
  }

  const handleRadioChange = (selectedOptionId: string) => {
    setLocalValue(selectedOptionId);
    setLocalError(null);
  };

  const handleSubmit = async () => {
    if (required && !localValue) {
      setLocalError('Por favor, selecciona una opción.');
      return;
    }
    const result = await saveCurrentStepResponse(localValue);
    if (result.success && onStepComplete) {
      onStepComplete(localValue);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <QuestionHeader title={title} instructions={description} required={required} />
      <RadioButtonGroup
        name={`question-${id}`}
        options={options}
        selectedValue={localValue}
        onChange={handleRadioChange}
      />
      {(localError || error) && (
        <div className="text-red-600 text-sm mt-2">{localError || error}</div>
      )}
      <FormSubmitButton
        isSaving={!!isSaving || !!isLoading}
        hasExistingData={localHasExistingData}
        onClick={handleSubmit}
        disabled={isSaving || isLoading || (required && !localValue)}
      />
    </div>
  );
};
