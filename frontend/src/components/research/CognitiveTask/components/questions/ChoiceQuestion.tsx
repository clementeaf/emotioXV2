import React from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, FormSection, FormCard, FormRow } from '@/components/common/atomic';
import { TrashIcon } from '@/components/common/icons';
import { ChoiceQuestionProps } from '../../types';

/**
 * Componente refactorizado que usa componentes atómicos
 * Elimina duplicación de layouts y patrones repetidos
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
          <h4 className="text-sm font-medium text-gray-700">Opciones</h4>
          
          {question.choices?.map((choice, index) => (
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
                  placeholder="Opción"
                  disabled={disabled}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveChoice(choice.id)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon />
                </Button>
              </FormRow>
            </FormCard>
          ))}

          {/* Botón agregar opción */}
          <Button
            variant="outline"
            onClick={onAddChoice}
            disabled={disabled}
            className="w-full"
          >
            + Añadir opción
          </Button>
        </div>
      </FormSection>
    </FormCard>
  );
};
