import React from 'react';
import { FormField, FormSection, FormCard } from '@/components/common/atomic';
import { TextQuestionProps } from '../../types';

/**
 * Componente refactorizado que usa componentes atómicos
 * Elimina duplicación de layouts y patrones repetidos
 */
export const TextQuestion: React.FC<TextQuestionProps> = ({
  question,
  onQuestionChange,
  validationErrors,
  disabled
}) => {
  const titleError = validationErrors ? validationErrors['title'] : null;

  return (
    <FormCard>
      <FormSection 
        title="Configuración de Pregunta de Texto"
        description="Configure la pregunta de texto corto o largo"
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
          config={{ rows: 3 }}
        />

        {/* Placeholder de respuesta */}
        <FormField
          type="text"
          label="Placeholder de respuesta"
          value={question.answerPlaceholder || ''}
          onChange={(value) => onQuestionChange({ answerPlaceholder: value })}
          placeholder="Ej: Escribe tu respuesta aquí..."
          disabled={disabled}
        />

      </FormSection>
    </FormCard>
  );
};
