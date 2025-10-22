import React from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, FormSection, FormCard, FormRow } from '@/components/common/atomic';
import { ChoiceQuestionProps } from '../../types';

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
