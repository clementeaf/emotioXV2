import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../../hooks/useStepResponseManager';
import { MappedStepComponentProps } from '../../../types/flow.types';
import FormSubmitButton from '../../common/FormSubmitButton';
import QuestionHeader from '../common/QuestionHeader';
import ScaleButtonGroup from './common/ScaleButtonGroup';
import ScaleLabels from './common/ScaleLabels';

export const LinearScaleView: React.FC<MappedStepComponentProps> = (props) => {
  const { stepConfig, onStepComplete, savedResponse, questionKey } = props;
  const config = stepConfig as any;

  const id = questionKey || config.id || '';
  const title = config.title || 'Pregunta';
  const description = config.description;
  const required = config.required;

  // Hook de persistencia igual que SmartVOC/ShortTextView/LongTextView/SingleChoiceView/MultiChoiceView
  const {
    responseData,
    isSaving,
    isLoading,
    error,
    saveCurrentStepResponse,
    hasExistingData
  } = useStepResponseManager<number>({
    stepId: id,
    stepType: config.type || 'cognitive_linear_scale',
    stepName: title,
    initialData: savedResponse as number | null | undefined,
    questionKey: id
  });

  // Estado local para la selección
  const [localValue, setLocalValue] = useState(savedResponse || 0);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof savedResponse === 'number') {
      setLocalValue(savedResponse);
    } else {
      setLocalValue(0);
    }
  }, [savedResponse]);

  const localHasExistingData = typeof savedResponse === 'number' && !isNaN(savedResponse);

  // Extraer configuración de la escala, con valores por defecto razonables
  const minValue = typeof config.minValue === 'number' ? config.minValue : 1;
  const maxValue = typeof config.maxValue === 'number' ? config.maxValue : 5;
  const minLabel = config.minLabel || ''; // Etiqueta para el valor mínimo
  const maxLabel = config.maxLabel || ''; // Etiqueta para el valor máximo

  if (!id || minValue > maxValue) { // Validación básica
    console.error('[LinearScaleView] Configuración inválida:', config);
    return <div className="p-4 text-red-600">Error: Pregunta mal configurada.</div>;
  }

  // Generar los botones numéricos según minValue y maxValue
  const scaleButtons = Array.from({ length: maxValue - minValue + 1 }, (_, i) => minValue + i);

  const handleSelection = (selectedValue: number) => {
    setLocalValue(selectedValue);
    setLocalError(null);
  };

  const handleSubmit = async () => {
    if (required && localValue === undefined) {
      setLocalError('Por favor, selecciona un valor en la escala.');
      return;
    }
    const result = await saveCurrentStepResponse(localValue || 0);
    if (result.success && onStepComplete) {
      onStepComplete(localValue);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <QuestionHeader title={title} instructions={description} required={required} />

      <ScaleButtonGroup
        buttons={scaleButtons}
        selectedValue={localValue}
        onSelect={handleSelection}
      />

      <ScaleLabels
        minLabel={minLabel}
        maxLabel={maxLabel}
      />

      {(localError || error) && (
        <div className="text-red-600 text-sm mt-2">{localError || error}</div>
      )}

      <FormSubmitButton
        isSaving={!!isSaving || !!isLoading}
        hasExistingData={localHasExistingData}
        onClick={handleSubmit}
        disabled={isSaving || isLoading}
      />
    </div>
  );
};
