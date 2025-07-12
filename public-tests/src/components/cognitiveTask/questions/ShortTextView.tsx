import React, { useState } from 'react';
import { ShortTextViewProps as BaseShortTextViewProps } from '../../../types';
import FormSubmitButton from '../../common/FormSubmitButton';
import TextAreaField from '../../common/TextAreaField';
import QuestionHeader from '../common/QuestionHeader';

export interface ShortTextViewProps extends BaseShortTextViewProps {
  isSubmitting?: boolean;
  error?: string | null;
  hasExistingData?: boolean;
}

export const ShortTextView: React.FC<ShortTextViewProps> = ({ config, value, onChange, onContinue, questionKey, isSubmitting, error, hasExistingData }) => {
  const id = questionKey || config.id;
  const title = config.title;
  const description = config.description;
  const answerPlaceholder = config.answerPlaceholder;
  const required = config.required;

  const [localValue, setLocalValue] = useState(value || '');
  const [localError, setLocalError] = useState<string | null>(null);

  if (!id) {
    console.error('[ShortTextView] Configuración inválida (sin ID):', config);
    return <div className="p-4 text-red-600">Error: Pregunta mal configurada.</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    setLocalError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (required && !localValue.trim()) {
      setLocalError('Por favor, escribe una respuesta.');
      return;
    }
    onChange?.(id, localValue);
    if (onContinue) {
      onContinue(localValue);
    }
  };

  const showHasExistingData = typeof hasExistingData === 'boolean' ? hasExistingData : !!(value && value.trim());

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <QuestionHeader
        title={title}
        instructions={description}
        required={required}
      />
      <TextAreaField
        id={`short-text-${id}`}
        name={id}
        label={title || description || 'Respuesta corta'}
        value={localValue}
        onChange={handleChange}
        placeholder={answerPlaceholder || ''}
        disabled={isSubmitting}
        required={required}
      />
      {(localError || error) && (
        <div className="text-red-600 text-sm">{localError || error}</div>
      )}
      <FormSubmitButton
        isSaving={!!isSubmitting}
        hasExistingData={!!showHasExistingData}
        onClick={handleSubmit}
        disabled={isSubmitting || (required && !localValue.trim())}
      />
    </form>
  );
};
