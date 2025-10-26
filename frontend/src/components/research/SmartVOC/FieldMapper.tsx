import React from 'react';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import { SmartVOCFieldConfig } from './schema';

interface FieldMapperProps {
  fields: SmartVOCFieldConfig[];
  question: any;
  updateQuestion: (questionId: string, data: any) => void;
}

export const FieldMapper: React.FC<FieldMapperProps> = ({
  fields,
  question,
  updateQuestion
}) => {
  const getFieldValue = (field: SmartVOCFieldConfig) => {
    const label = field.props.label;
    
    switch (label) {
      case 'Título de la pregunta':
        return question.title || '';
      case 'Descripción (opcional)':
        return question.description || '';
      case 'Instrucciones (opcional)':
        return question.instructions || '';
      case 'Tipo de visualización':
        return question.config?.type || '';
      case 'Tipo de escala':
        return question.config?.scaleRange;
      default:
        return '';
    }
  };

  const getFieldOnChange = (field: SmartVOCFieldConfig) => {
    const label = field.props.label;
    
    switch (label) {
      case 'Título de la pregunta':
        return (value: string) => updateQuestion(question.id, { title: value });
      case 'Descripción (opcional)':
        return (value: string) => updateQuestion(question.id, { description: value });
      case 'Instrucciones (opcional)':
        return (value: string) => updateQuestion(question.id, { instructions: value });
      case 'Tipo de visualización':
        return (value: string) => updateQuestion(question.id, { 
          config: { ...question.config, type: value as any }
        });
      case 'Tipo de escala':
        return (value: any) => {
          // Este se maneja en DynamicFieldRenderer, pero necesitamos una función válida
        };
      default:
        return () => {};
    }
  };

  return (
    <>
      {fields.map((field, index) => (
        <DynamicFieldRenderer
          key={index}
          field={field}
          value={getFieldValue(field)}
          onChange={getFieldOnChange(field)}
          questionId={question.id}
          question={question}
          updateQuestion={updateQuestion}
        />
      ))}
    </>
  );
};
