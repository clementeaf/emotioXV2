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
  QUESTION_TEXT_LABEL: 'Texto de la pregunta',
  QUESTION_TEXT_PLACEHOLDER: 'Introduce el texto de la pregunta',
  DESCRIPTION_LABEL: 'Descripción',
  DESCRIPTION_PLACEHOLDER: 'Introduce una descripción opcional',
  OPTIONS_LABEL: 'Opciones',
  ADD_OPTION: 'Añadir opción',
  OPTION_PLACEHOLDER: 'Opción'
};

// Definición del tipo para errores de validación
type ValidationError = {
  id: string;
  field: string;
  message: string;
};

/**
 * Componente que maneja la configuración de preguntas de selección (opción única, múltiple y ranking)
 * 
 * Nota: Usamos 'as any' en varias partes para evitar errores de tipo mientras se completa
 * la definición de los tipos. En una implementación completa, estos tipos deberían
 * estar correctamente definidos en el archivo de tipos.
 */
export const ChoiceQuestion: React.FC<ChoiceQuestionProps> = ({
  question,
  onQuestionChange,
  onAddChoice,
  onRemoveChoice,
  validationErrors,
  disabled
}) => {
  // Buscar error de validación si existe
  const error = Array.isArray(validationErrors) 
    ? validationErrors.find(
        (err: ValidationError) => err.id === question.id && err.field === 'text'
      )
    : undefined;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {(UI_TEXTS as any).CHOICE_QUESTION?.QUESTION_TEXT_LABEL || DEFAULT_TEXTS.QUESTION_TEXT_LABEL}
        </label>
        <Input
          value={(question as any).text || ''}
          onChange={(e) => onQuestionChange({ text: e.target.value } as any)}
          placeholder={(UI_TEXTS as any).CHOICE_QUESTION?.QUESTION_TEXT_PLACEHOLDER || DEFAULT_TEXTS.QUESTION_TEXT_PLACEHOLDER}
          disabled={disabled}
          error={error?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {(UI_TEXTS as any).CHOICE_QUESTION?.DESCRIPTION_LABEL || DEFAULT_TEXTS.DESCRIPTION_LABEL}
        </label>
        <Textarea
          value={(question as any).description || ''}
          onChange={(e) => onQuestionChange({ description: e.target.value } as any)}
          placeholder={(UI_TEXTS as any).CHOICE_QUESTION?.DESCRIPTION_PLACEHOLDER || DEFAULT_TEXTS.DESCRIPTION_PLACEHOLDER}
          rows={3}
          disabled={disabled}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-neutral-700">
            {(UI_TEXTS as any).CHOICE_QUESTION?.OPTIONS_LABEL || DEFAULT_TEXTS.OPTIONS_LABEL}
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddChoice}
            disabled={disabled}
          >
            {(UI_TEXTS as any).CHOICE_QUESTION?.ADD_OPTION || DEFAULT_TEXTS.ADD_OPTION}
          </Button>
        </div>

        <div className="space-y-2">
          {(question as any).choices?.map((choice: any, index: number) => (
            <div key={choice.id} className="flex items-center gap-2">
              <Input
                value={choice.text || ''}
                onChange={(e) => 
                  onQuestionChange({
                    choices: (question as any).choices?.map((c: any) => 
                      c.id === choice.id 
                        ? { ...c, text: e.target.value } 
                        : c
                    )
                  } as any)
                }
                placeholder={`${(UI_TEXTS as any).CHOICE_QUESTION?.OPTION_PLACEHOLDER || DEFAULT_TEXTS.OPTION_PLACEHOLDER} ${index + 1}`}
                disabled={disabled}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveChoice(choice.id)}
                disabled={disabled || ((question as any).choices?.length || 0) <= 1}
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