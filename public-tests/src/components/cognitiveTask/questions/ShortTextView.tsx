import React, { useState } from 'react';
import { ShortTextViewProps } from '../../../types';
import TextAreaField from '../../common/TextAreaField';
import QuestionHeader from '../common/QuestionHeader';

export const ShortTextView: React.FC<ShortTextViewProps> = ({ config, value, onChange, onContinue, questionKey }) => {
  // Usar questionKey del backend como identificador principal
  const id = questionKey || config.id;
  const title = config.title;
  const description = config.description;
  const answerPlaceholder = config.answerPlaceholder;
  const required = config.required;

  const [localValue, setLocalValue] = useState(value || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!id) {
    console.error('[ShortTextView] Configuración inválida (sin ID):', config);
    return <div className="p-4 text-red-600">Error: Pregunta mal configurada.</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !localValue.trim()) {
      setError('Por favor, escribe una respuesta.');
      return;
    }
    setIsSubmitting(true);
    onChange?.(id, localValue);
    if (onContinue) {
      onContinue(localValue);
    }
    setIsSubmitting(false);
  };

  // Detectar si ya existe una respuesta previa
  const hasExistingData = !!(value && value.trim());
  const buttonText = hasExistingData ? 'Actualizar y continuar' : 'Guardar y continuar';

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
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      <button
        type="submit"
        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isSubmitting || (required && !localValue.trim())}
      >
        {buttonText}
      </button>
    </form>
  );
};
