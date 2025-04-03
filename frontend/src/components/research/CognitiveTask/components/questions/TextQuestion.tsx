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
  // Buscar errores para esta pregunta
  const questionId = question.id;
  const titleError = validationErrors[`question_${questionId}_title`];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {UI_TEXTS.TEXT_QUESTION?.QUESTION_TEXT_LABEL || 'Título de la pregunta'}
        </label>
        <Input
          value={question.title || ''}
          onChange={(e) => onQuestionChange({ title: e.target.value })}
          placeholder={UI_TEXTS.TEXT_QUESTION?.QUESTION_TEXT_PLACEHOLDER || 'Introduce el título de la pregunta'}
          disabled={disabled}
          error={!!titleError}
          helperText={titleError}
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
    </div>
  );
}; 