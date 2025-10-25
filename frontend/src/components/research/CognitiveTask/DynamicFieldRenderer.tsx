/**
 * Dynamic Field Renderer for Cognitive Task
 * Renders form fields dynamically based on schema configuration
 */

import React from 'react';
import { FormInput } from '@/components/common/FormInput';
import { FormTextarea } from '@/components/common/FormTextarea';
import { ChoiceManager } from '@/components/common/ChoiceManager';
import { FormCheckbox, FileUploadPlaceholder, ErrorDisplay } from '@/components/common/atomic';
import { CognitiveTaskFieldConfig } from './schema.types';

interface DynamicFieldRendererProps {
  field: CognitiveTaskFieldConfig;
  value: any;
  onChange: (value: any) => void;
}

/**
 * Renders a single field based on its configuration
 */
export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  value,
  onChange
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
        <FormCheckbox
          id={field.key}
          label={field.props.label}
          checked={value || false}
          onChange={onChange}
        />
      );

    case 'ChoiceManager':
      return (
        <ChoiceManager
          label={field.props.label}
          value={value || []}
          onChange={onChange}
          minChoices={field.props.minChoices || 2}
          maxChoices={field.props.maxChoices || 10}
          placeholder={field.props.placeholder || 'Ingresa el texto de la opción'}
        />
      );

    case 'FileUploadManager':
      return (
        <FileUploadPlaceholder
          label={field.props.label}
          message="Funcionalidad de carga de archivos en desarrollo"
          acceptedTypes={field.props.acceptedTypes}
        />
      );

    default:
      return (
        <ErrorDisplay
          message={field.component}
          component="Componente"
        />
      );
  }
};
