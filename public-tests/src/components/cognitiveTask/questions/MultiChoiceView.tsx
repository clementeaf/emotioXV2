import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../../hooks/useStepResponseManager';
import { MappedStepComponentProps } from '../../../types/flow.types';
import CheckboxGroup from '../../common/CheckboxGroup';
import FormSubmitButton from '../../common/FormSubmitButton';
import QuestionHeader from '../common/QuestionHeader';

export const MultiChoiceView: React.FC<MappedStepComponentProps> = (props) => {
  const { stepConfig, onStepComplete, savedResponse, questionKey } = props;
  const config = stepConfig as any;

  const id = questionKey || config.id || '';
  const title = config.title || 'Pregunta';
  const description = config.description;
  const options = config.options || config.choices || [];
  const required = config.required;

  // Hook de persistencia igual que SmartVOC/ShortTextView/LongTextView/SingleChoiceView
  const {
    responseData,
    isSaving,
    isLoading,
    error,
    saveCurrentStepResponse,
    hasExistingData
  } = useStepResponseManager<string[]>({
    stepId: id,
    stepType: config.type || 'cognitive_multiple_choice',
    stepName: title,
    initialData: savedResponse as string[] | null | undefined,
    questionKey: id
  });

  // Estado local para las selecciones
  const [localValue, setLocalValue] = useState(savedResponse || []);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (Array.isArray(savedResponse)) {
      setLocalValue(savedResponse);
    } else {
      setLocalValue([]);
    }
  }, [savedResponse]);

  const localHasExistingData = Array.isArray(savedResponse) && savedResponse.length > 0;

  if (!id || !options || !Array.isArray(options)) {
    console.error('[MultiChoiceView] Configuración inválida (sin ID u opciones):', config);
    return <div className="p-4 text-red-600">Error: Pregunta mal configurada.</div>;
  }

  const handleCheckboxChange = (optionId: string, isChecked: boolean) => {
    let newSelectedIds: string[];
    if (isChecked) {
      // Añadir el ID si no está ya presente (importante evitar duplicados)
      newSelectedIds = localValue.includes(optionId) ? localValue : [...localValue, optionId];
    } else {
      // Eliminar el ID
      newSelectedIds = localValue.filter(selectedId => selectedId !== optionId);
    }
    setLocalValue(newSelectedIds);
    setLocalError(null);
  };

  const handleSubmit = async () => {
    if (required && localValue.length === 0) {
      setLocalError('Por favor, selecciona al menos una opción.');
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
      <CheckboxGroup
        name={`question-${id}`}
        options={options}
        selectedIds={localValue}
        onChange={handleCheckboxChange}
      />
      {(localError || error) && (
        <div className="text-red-600 text-sm mt-2">{localError || error}</div>
      )}
      <FormSubmitButton
        isSaving={!!isSaving || !!isLoading}
        hasExistingData={localHasExistingData}
        onClick={handleSubmit}
        disabled={isSaving || isLoading || (required && !localValue.length)}
      />
    </div>
  );
};
