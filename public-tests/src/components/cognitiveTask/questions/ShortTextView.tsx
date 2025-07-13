import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../../hooks/useStepResponseManager';
import FormSubmitButton from '../../common/FormSubmitButton';
import TextAreaField from '../../common/TextAreaField';
import QuestionHeader from '../common/QuestionHeader';

export const ShortTextView: React.FC<any> = (props) => {
  // Compatibilidad: aceptar config o stepConfig
  const config = props.stepConfig || props.config;
  const { onStepComplete, savedResponse, questionKey } = props;

  if (!config) {
    console.error('[ShortTextView] config/stepConfig es undefined');
    return <div className="p-4 text-red-600">Error: Configuración no disponible.</div>;
  }

  const id = questionKey || config?.id || '';
  const title = config?.title || 'Pregunta';
  const description = config?.description;
  const answerPlaceholder = config?.answerPlaceholder || '';
  const required = config?.required;

  // Hook de persistencia igual que otros componentes corregidos
  const {
    responseData,
    isSaving,
    isLoading,
    error,
    saveCurrentStepResponse,
    hasExistingData
  } = useStepResponseManager<string>({
    stepId: id,
    stepType: config?.type || 'cognitive_short_text',
    stepName: title,
    initialData: savedResponse as string | null | undefined,
    questionKey: id
  });

  // Estado local para el textarea
  const [localValue, setLocalValue] = useState<string>(typeof savedResponse === 'string' ? savedResponse : '');
  const [localError, setLocalError] = useState<string | null>(null);

  // Sincronizar valor local con respuesta persistida
  useEffect(() => {
    if (typeof savedResponse === 'string') {
      setLocalValue(savedResponse);
    } else {
      setLocalValue('');
    }
  }, [savedResponse]);

  const localHasExistingData = typeof savedResponse === 'string' && savedResponse.trim() !== '';

  if (!id) {
    console.error('[ShortTextView] Configuración inválida (sin ID):', config);
    return <div className="p-4 text-red-600">Error: Pregunta mal configurada.</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    setLocalError(null);
  };

  const handleSubmit = async () => {
    if (required && !localValue.trim()) {
      setLocalError('Por favor, escribe una respuesta.');
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
      <TextAreaField
        id={`short-text-${id}`}
        name={id}
        label={title || description || 'Respuesta corta'}
        value={localValue}
        onChange={handleChange}
        placeholder={answerPlaceholder}
        disabled={isSaving || isLoading}
        required={required}
      />
      {(localError || error) && (
        <div className="text-red-600 text-sm mt-2">{localError || error}</div>
      )}
      <FormSubmitButton
        isSaving={!!isSaving || !!isLoading}
        hasExistingData={localHasExistingData}
        onClick={handleSubmit}
        disabled={isSaving || isLoading || (required && !localValue.trim())}
      />
    </div>
  );
};
