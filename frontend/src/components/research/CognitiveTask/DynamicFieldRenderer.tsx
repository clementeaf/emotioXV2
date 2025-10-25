/**
 * Dynamic Field Renderer for Cognitive Task
 * Renders form fields dynamically based on schema configuration
 */

import React from 'react';
import { FormInput } from '@/components/common/FormInput';
import { FormTextarea } from '@/components/common/FormTextarea';
import { CognitiveTaskFieldConfig } from './schema.types';

interface DynamicFieldRendererProps {
  field: CognitiveTaskFieldConfig;
  value: any;
  onChange: (value: any) => void;
  question: any;
}

/**
 * Renders a single field based on its configuration
 */
export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  value,
  onChange,
  question
}) => {
  const commonProps = {
    value: value || '',
    onChange: (e: any) => onChange(e.target ? e.target.value : e),
  };

  switch (field.component) {
    case 'FormInput':
      return (
        <FormInput
          label={field.props.label}
          placeholder={field.props.placeholder}
          {...commonProps}
        />
      );

    case 'FormTextarea':
      return (
        <FormTextarea
          label={field.props.label}
          placeholder={field.props.placeholder}
          rows={field.props.rows || 3}
          {...commonProps}
        />
      );

    case 'FormCheckbox':
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={field.key}
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor={field.key} className="text-sm font-medium text-gray-700">
            {field.props.label}
          </label>
        </div>
      );

    case 'ChoiceManager':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {field.props.label}
          </label>
          <div className="space-y-2">
            {(value || []).map((choice: any, index: number) => (
              <div key={choice.id || index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={choice.text || ''}
                  onChange={(e) => {
                    const newChoices = [...(value || [])];
                    newChoices[index] = { ...choice, text: e.target.value };
                    onChange(newChoices);
                  }}
                  placeholder={`Opción ${index + 1}`}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newChoices = (value || []).filter((_: any, i: number) => i !== index);
                    onChange(newChoices);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const newChoices = [...(value || []), { id: Date.now().toString(), text: '', isQualify: false, isDisqualify: false }];
                onChange(newChoices);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              + Agregar opción
            </button>
          </div>
        </div>
      );

    case 'FileUploadManager':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {field.props.label}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Funcionalidad de carga de archivos en desarrollo
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Tipos permitidos: {field.props.acceptedTypes?.join(', ')}
            </p>
          </div>
        </div>
      );

    default:
      return (
        <div className="text-red-500">
          Componente no soportado: {field.component}
        </div>
      );
  }
};
