import React from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { TextQuestionProps } from '../../types';
import { UI_TEXTS } from '../../constants';

/**
 * Componente que maneja la configuración de preguntas de texto corto y largo
 */
export const TextQuestion: React.FC<TextQuestionProps> = ({
  question,
  onQuestionChange,
  validationErrors,
  disabled
}) => {
  const error = validationErrors?.find(
    (error) => error.id === question.id && error.field === 'text'
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {UI_TEXTS.TEXT_QUESTION?.QUESTION_TEXT_LABEL || 'Texto de la pregunta'}
        </label>
        <Input
          value={question.text || ''}
          onChange={(e) => onQuestionChange({ text: e.target.value })}
          placeholder={UI_TEXTS.TEXT_QUESTION?.QUESTION_TEXT_PLACEHOLDER || 'Introduce el texto de la pregunta'}
          disabled={disabled}
          error={error?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {UI_TEXTS.TEXT_QUESTION?.DESCRIPTION_LABEL || 'Descripción'}
        </label>
        <Textarea
          value={question.description || ''}
          onChange={(e) => onQuestionChange({ description: e.target.value })}
          placeholder={UI_TEXTS.TEXT_QUESTION?.DESCRIPTION_PLACEHOLDER || 'Introduce una descripción opcional'}
          rows={3}
          disabled={disabled}
        />
      </div>

      {question.type === 'short_text' && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {UI_TEXTS.TEXT_QUESTION?.PLACEHOLDER_LABEL || 'Texto de marcador de posición'}
          </label>
          <Input
            value={question.placeholder || ''}
            onChange={(e) => onQuestionChange({ placeholder: e.target.value })}
            placeholder={UI_TEXTS.TEXT_QUESTION?.PLACEHOLDER_INPUT || 'Ej: Escribe tu respuesta aquí'}
            disabled={disabled}
          />
        </div>
      )}

      {question.type === 'long_text' && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {UI_TEXTS.TEXT_QUESTION?.PLACEHOLDER_LABEL || 'Texto de marcador de posición'}
          </label>
          <Textarea
            value={question.placeholder || ''}
            onChange={(e) => onQuestionChange({ placeholder: e.target.value })}
            placeholder={UI_TEXTS.TEXT_QUESTION?.PLACEHOLDER_TEXTAREA || 'Ej: Escribe tu respuesta detallada aquí'}
            rows={2}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}; 