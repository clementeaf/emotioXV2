import React from 'react';
import { FormInput } from '@/components/common/FormInput';
import { FormTextarea } from '@/components/common/FormTextarea';
import { FormSelect } from '@/components/common/FormSelect';
import { LabeledInput } from '@/components/common/LabeledInput';
import { ScaleSelector } from '@/components/common/ScaleSelector';
import { FieldConfig } from '../config';

interface DynamicFieldRendererProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  value,
  onChange,
  disabled = false
}) => {
  const commonProps = {
    label: field.label,
    value: value || '',
    onChange,
    placeholder: field.placeholder,
    disabled
  };

  switch (field.component) {
    case 'FormInput':
      return <FormInput {...commonProps} />;

    case 'FormTextarea':
      return (
        <FormTextarea
          {...commonProps}
          rows={field.rows || 3}
        />
      );

    case 'FormSelect':
      return (
        <FormSelect
          {...commonProps}
          options={field.options || []}
        />
      );

    case 'LabeledInput':
      return (
        <LabeledInput
          {...commonProps}
          label={field.label}
        />
      );

    case 'ScaleSelector':
      return (
        <ScaleSelector
          value={value || { start: 1, end: 5 }}
          onChange={onChange}
          options={field.options?.map(opt => ({ value: opt.value, label: opt.label }))}
          disabled={disabled}
        />
      );

    default:
      return <div>Componente no soportado: {field.component}</div>;
  }
};
