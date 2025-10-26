import React from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, FormSection, FormCard, FormRow } from '@/components/common/atomic';
import { TrashIcon } from '@/components/common/icons';
import { ChoiceQuestionProps } from '../../types';

// Textos predeterminados
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
 * Componente refactorizado que usa componentes atómicos
 * Elimina duplicación de layouts y patrones repetidos
 * Mantiene todas las funcionalidades del componente original
 */
export const ChoiceQuestion: React.FC<ChoiceQuestionProps> = ({
  question,
  onQuestionChange,
  onAddChoice,
  onRemoveChoice,
  validationErrors,
  disabled
}) => {
  // Buscar errores
  const titleError = validationErrors ? validationErrors['title'] : null;
  const descriptionError = validationErrors ? validationErrors['description'] : null;
  const choicesError = validationErrors ? validationErrors['choices'] : null;

  return (
    <FormCard>
      <FormSection 
        title="Configuración de Pregunta de Selección"
        description="Configure las opciones de respuesta"
      >
        {/* Título de la pregunta */}
        <FormField
          type="text"
          label="Título de la pregunta"
          value={question.title || ''}
          onChange={(value) => onQuestionChange({ title: value })}
          placeholder="Introduce el título de la pregunta"
          disabled={disabled}
          error={!!titleError}
          errorMessage={titleError || undefined}
        />

        {/* Descripción */}
        <FormField
          type="textarea"
          label="Descripción"
          value={question.description || ''}
          onChange={(value) => onQuestionChange({ description: value })}
          placeholder="Introduce una descripción opcional"
          disabled={disabled}
          error={!!descriptionError}
          errorMessage={descriptionError || undefined}
        />

        {/* Opciones */}
        <div className="space-y-3">
          <FormRow justified>
            <h4 className="text-sm font-medium text-gray-700">
              {DEFAULT_TEXTS.OPTIONS_LABEL}
              {choicesError && <span className="ml-2 text-xs text-red-500">({choicesError})</span>}
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddChoice}
              disabled={disabled}
            >
              {DEFAULT_TEXTS.ADD_OPTION}
            </Button>
          </FormRow>
          
          {question.choices?.map((choice, index) => {
            // Buscar error específico para el texto de esta opción
            const choiceTextErrorKey = `choices.${index}.text`;
            const choiceTextError = validationErrors ? validationErrors[choiceTextErrorKey] : null;

            return (
              <FormCard key={choice.id} className="p-3">
                <FormRow justified>
                  <FormField
                    type="text"
                    label=""
                    value={choice.text || ''}
                    onChange={(value) => {
                      const newChoices = [...(question.choices || [])];
                      newChoices[index] = { ...choice, text: value };
                      onQuestionChange({ choices: newChoices });
                    }}
                    placeholder={`${DEFAULT_TEXTS.OPTION_PLACEHOLDER} ${index + 1}`}
                    disabled={disabled}
                    error={!!choiceTextError}
                    errorMessage={choiceTextError || undefined}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveChoice(choice.id)}
                    disabled={disabled || (question.choices?.length || 0) <= 1}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon />
                  </Button>
                </FormRow>
              </FormCard>
            );
          })}
        </div>

      </FormSection>
    </FormCard>
  );
};
