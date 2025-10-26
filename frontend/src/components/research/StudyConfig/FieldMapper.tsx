import React from 'react';
import { FormInput } from '@/components/common/FormInput';
import { FormTextarea } from '@/components/common/FormTextarea';
import { FormSelect } from '@/components/common/FormSelect';
import { FormToggle } from '@/components/common/FormToggle';
import { StudyConfigField } from './schema.types';

interface FieldMapperProps {
  fields: StudyConfigField[];
  question: any;
  updateQuestion: (fieldName: string, value: any) => void;
}

export const FieldMapper: React.FC<FieldMapperProps> = ({
  fields,
  question,
  updateQuestion
}) => {
  const getFieldValue = (fieldName: string) => {
    const keys = fieldName.split('.');
    let value = question;
    
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    updateQuestion(fieldName, value);
  };

  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const value = getFieldValue(field.name);
        
        switch (field.component) {
          case 'FormInput':
            return (
              <FormInput
                key={field.name}
                label={field.label}
                value={value || ''}
                onChange={(value: string) => handleFieldChange(field.name, value)}
                placeholder={field.placeholder}
              />
            );
            
          case 'FormTextarea':
            return (
              <FormTextarea
                key={field.name}
                label={field.label}
                value={value || ''}
                onChange={(value: string) => handleFieldChange(field.name, value)}
                placeholder={field.placeholder}
              />
            );
            
          case 'FormSelect':
            return (
              <FormSelect
                key={field.name}
                label={field.label}
                value={value || ''}
                onChange={(value) => handleFieldChange(field.name, value)}
                placeholder={field.placeholder}
                options={field.options || []}
              />
            );
            
          case 'FormToggle':
            return (
              <FormToggle
                key={field.name}
                label={field.label}
                checked={value || false}
                onChange={(checked) => handleFieldChange(field.name, checked)}
              />
            );
            
          case 'FormArray':
            return (
              <div key={field.name} className="text-gray-500">
                FormArray no implementado aún para: {field.label}
              </div>
            );
            
          default:
            return (
              <div key={field.name} className="text-red-500">
                Componente no soportado: {field.component}
              </div>
            );
        }
      })}
    </div>
  );
};