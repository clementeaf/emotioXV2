/**
 * Field Mapper for Cognitive Task
 * Maps schema fields to dynamic renderers
 */

import React from 'react';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import { CognitiveTaskFieldConfig } from './schema.types';

interface FieldMapperProps {
  fields: CognitiveTaskFieldConfig[];
  question: any;
  updateQuestion: (questionId: string, data: any) => void;
}

/**
 * Maps schema fields to their corresponding renderers
 */
export const FieldMapper: React.FC<FieldMapperProps> = ({
  fields,
  question,
  updateQuestion
}) => {
  // Si tenemos una pregunta completa, renderizar el componente específico una sola vez
  if (question && updateQuestion) {
    return (
      <DynamicFieldRenderer
        field={fields[0]} // Usar el primer field como referencia
        value={question}
        onChange={() => {}} // No se usa en modo completo
        question={question}
        updateQuestion={updateQuestion}
      />
    );
  }

  // Fallback: renderizar campos individuales (no debería llegar aquí)
  return (
    <div className="space-y-4">
      {fields.map((field) => {
        // Handle nested keys like 'scaleConfig.startValue'
        const getValue = (key: string) => {
          const keys = key.split('.');
          let value = question;
          for (const k of keys) {
            value = value?.[k];
          }
          return value;
        };

        const handleChange = (value: any) => {
          // Handle nested keys like 'scaleConfig.startValue'
          const keys = field.key.split('.');
          if (keys.length === 1) {
            updateQuestion(question.id, { [field.key]: value });
          } else {
            // For nested keys, we need to update the parent object
            const parentKey = keys[0];
            const childKey = keys[1];
            const parentValue = question[parentKey] || {};
            updateQuestion(question.id, {
              [parentKey]: {
                ...parentValue,
                [childKey]: value
              }
            });
          }
        };

        return (
          <DynamicFieldRenderer
            key={field.key}
            field={field}
            value={getValue(field.key)}
            onChange={handleChange}
            question={question}
            updateQuestion={updateQuestion}
          />
        );
      })}
    </div>
  );
};
