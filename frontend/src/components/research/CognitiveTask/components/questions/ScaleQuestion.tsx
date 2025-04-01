import React from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ScaleQuestionProps } from '../../types';
import { UI_TEXTS } from '../../constants';

/**
 * Componente que maneja la configuración de preguntas de escala
 */
export const ScaleQuestion: React.FC<ScaleQuestionProps> = ({
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
          {UI_TEXTS.SCALE_QUESTION?.QUESTION_TEXT_LABEL || 'Texto de la pregunta'}
        </label>
        <Input
          value={question.text || ''}
          onChange={(e) => onQuestionChange({ text: e.target.value })}
          placeholder={UI_TEXTS.SCALE_QUESTION?.QUESTION_TEXT_PLACEHOLDER || 'Introduce el texto de la pregunta'}
          disabled={disabled}
          error={error?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {UI_TEXTS.SCALE_QUESTION?.DESCRIPTION_LABEL || 'Descripción'}
        </label>
        <Textarea
          value={question.description || ''}
          onChange={(e) => onQuestionChange({ description: e.target.value })}
          placeholder={UI_TEXTS.SCALE_QUESTION?.DESCRIPTION_PLACEHOLDER || 'Introduce una descripción opcional'}
          rows={3}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {UI_TEXTS.SCALE_QUESTION?.MIN_LABEL || 'Valor mínimo'}
          </label>
          <Input
            type="number"
            value={question.minValue || 1}
            onChange={(e) => onQuestionChange({ minValue: parseInt(e.target.value) })}
            min={1}
            max={9}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {UI_TEXTS.SCALE_QUESTION?.MAX_LABEL || 'Valor máximo'}
          </label>
          <Input
            type="number"
            value={question.maxValue || 10}
            onChange={(e) => onQuestionChange({ maxValue: parseInt(e.target.value) })}
            min={2}
            max={10}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {UI_TEXTS.SCALE_QUESTION?.MIN_LABEL_TEXT || 'Etiqueta valor mínimo'}
          </label>
          <Input
            value={question.minLabel || ''}
            onChange={(e) => onQuestionChange({ minLabel: e.target.value })}
            placeholder={UI_TEXTS.SCALE_QUESTION?.MIN_LABEL_PLACEHOLDER || 'Ej: Muy poco probable'}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {UI_TEXTS.SCALE_QUESTION?.MAX_LABEL_TEXT || 'Etiqueta valor máximo'}
          </label>
          <Input
            value={question.maxLabel || ''}
            onChange={(e) => onQuestionChange({ maxLabel: e.target.value })}
            placeholder={UI_TEXTS.SCALE_QUESTION?.MAX_LABEL_PLACEHOLDER || 'Ej: Muy probable'}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}; 