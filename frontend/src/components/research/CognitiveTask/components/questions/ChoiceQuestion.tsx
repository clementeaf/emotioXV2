import React from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ChoiceQuestionProps } from '../../types';
import { UI_TEXTS } from '../../constants';

// Ícono de papelera simplificado
const TrashIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);

// Textos predeterminados para evitar errores
const DEFAULT_TEXTS = {
  QUESTION_TITLE_LABEL: 'Título de la pregunta',
  QUESTION_TITLE_PLACEHOLDER: 'Introduce el título de la pregunta',
  DESCRIPTION_LABEL: 'Descripción',
  DESCRIPTION_PLACEHOLDER: 'Introduce una descripción opcional',
  OPTIONS_LABEL: 'Opciones',
  ADD_OPTION: 'Añadir opción',
  OPTION_PLACEHOLDER: 'Opción'
};

/**
 * Componente que maneja la configuración de preguntas de selección (opción única, múltiple y ranking)
 */
export const ChoiceQuestion: React.FC<ChoiceQuestionProps> = ({
  question,
  onQuestionChange,
  onAddChoice,
  onRemoveChoice,
  validationErrors,
  disabled
}) => {
  // Buscar errores para esta pregunta
  const questionId = question.id;
  const titleError = validationErrors[`question_${questionId}_title`];
  const choicesError = validationErrors[`question_${questionId}_choices`];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {UI_TEXTS.CHOICE_QUESTION?.QUESTION_TITLE_LABEL || DEFAULT_TEXTS.QUESTION_TITLE_LABEL}
        </label>
        <Input
          value={question.title || ''}
          onChange={(e) => onQuestionChange({ title: e.target.value })}
          placeholder={UI_TEXTS.CHOICE_QUESTION?.QUESTION_TITLE_PLACEHOLDER || DEFAULT_TEXTS.QUESTION_TITLE_PLACEHOLDER}
          disabled={disabled}
          error={!!titleError}
          helperText={titleError}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {UI_TEXTS.CHOICE_QUESTION?.DESCRIPTION_LABEL || DEFAULT_TEXTS.DESCRIPTION_LABEL}
        </label>
        <Textarea
          value={question.description || ''}
          onChange={(e) => onQuestionChange({ description: e.target.value })}
          placeholder={UI_TEXTS.CHOICE_QUESTION?.DESCRIPTION_PLACEHOLDER || DEFAULT_TEXTS.DESCRIPTION_PLACEHOLDER}
          rows={3}
          disabled={disabled}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-neutral-700">
            {UI_TEXTS.CHOICE_QUESTION?.OPTIONS_LABEL || DEFAULT_TEXTS.OPTIONS_LABEL}
            {choicesError && <span className="ml-2 text-xs text-red-500">{choicesError}</span>}
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddChoice}
            disabled={disabled}
          >
            {UI_TEXTS.CHOICE_QUESTION?.ADD_OPTION || DEFAULT_TEXTS.ADD_OPTION}
          </Button>
        </div>

        <div className="space-y-2">
          {question.choices?.map((choice, index) => (
            <div key={choice.id} className="flex items-center gap-2">
              <Input
                value={choice.text || ''}
                onChange={(e) => 
                  onQuestionChange({
                    choices: question.choices?.map(c => 
                      c.id === choice.id 
                        ? { ...c, text: e.target.value } 
                        : c
                    )
                  })
                }
                placeholder={`${UI_TEXTS.CHOICE_QUESTION?.OPTION_PLACEHOLDER || DEFAULT_TEXTS.OPTION_PLACEHOLDER} ${index + 1}`}
                disabled={disabled}
                className="flex-1"
                error={!!validationErrors[`question_${questionId}_choice_${index}`]}
                helperText={validationErrors[`question_${questionId}_choice_${index}`]}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveChoice(choice.id)}
                disabled={disabled || (question.choices?.length || 0) <= 1}
              >
                <TrashIcon />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 