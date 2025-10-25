import React from 'react';
import { FormInput } from '@/components/common/FormInput';
import { FormTextarea } from '@/components/common/FormTextarea';
import { FormSelect } from '@/components/common/FormSelect';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { SmartVOCFieldConfig } from './schema';

interface DynamicFieldRendererProps {
  field: SmartVOCFieldConfig;
  value: any;
  onChange: (value: any) => void;
  questionId: string;
  question: any;
  updateQuestion: (id: string, data: any) => void;
}

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  value,
  onChange,
  questionId,
  question,
  updateQuestion
}) => {
  const commonProps = {
    value: value || '',
    onChange,
    ...field.props
  } as Record<string, unknown>;

  switch (field.component) {
    case 'FormInput':
      return <FormInput 
        label={commonProps.label as string}
        value={commonProps.value as string}
        onChange={commonProps.onChange as (value: string) => void}
        placeholder={commonProps.placeholder as string}
      />;

    case 'FormTextarea':
      return <FormTextarea 
        label={commonProps.label as string}
        value={commonProps.value as string}
        onChange={commonProps.onChange as (value: string) => void}
        placeholder={commonProps.placeholder as string}
        rows={commonProps.rows as number}
      />;

    case 'FormSelect':
      return <FormSelect 
        label={commonProps.label as string}
        value={commonProps.value as string}
        onChange={commonProps.onChange as (value: string) => void}
        options={commonProps.options as Array<{value: string; label: string}>}
        placeholder={commonProps.placeholder as string}
      />;

    case 'CustomSelect':
      // Lógica especial para CustomSelect (escalas)
      if (field.props.label === 'Tipo de escala') {
        const range = question.config?.scaleRange;
        const currentValue = (() => {
          if (range?.start === 1 && range?.end === 5) return '1-5';
          if (range?.start === 1 && range?.end === 7) return '1-7';
          if (range?.start === 0 && range?.end === 10) return '0-10';
          return 'custom';
        })();

        return (
          <div className="space-y-4">
            <CustomSelect
              value={currentValue}
              onChange={(value) => {
                let newRange;
                switch (value) {
                  case '1-5':
                    newRange = { start: 1, end: 5 };
                    break;
                  case '1-7':
                    newRange = { start: 1, end: 7 };
                    break;
                  case '0-10':
                    newRange = { start: 0, end: 10 };
                    break;
                  default:
                    newRange = question.config?.scaleRange || { start: 1, end: 5 };
                }
                updateQuestion(questionId, { 
                  config: { ...question.config, scaleRange: newRange }
                });
              }}
              options={field.props.options}
              placeholder={field.props.placeholder}
              className="w-full"
            />
            
            {/* Mostrar campos personalizados si es necesario */}
            {(() => {
              const range = question.config?.scaleRange;
              const isCustom = !(
                (range?.start === 1 && range?.end === 5) ||
                (range?.start === 1 && range?.end === 7) ||
                (range?.start === 0 && range?.end === 10)
              );
              
              if (isCustom) {
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rango personalizado
                    </label>
                    <div className="flex gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Desde</label>
                        <input
                          type="number"
                          value={question.config?.scaleRange?.start || 1}
                          onChange={(e) => updateQuestion(questionId, { 
                            config: { 
                              ...question.config, 
                              scaleRange: { 
                                start: parseInt(e.target.value),
                                end: question.config?.scaleRange?.end || 5
                              }
                            }
                          })}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                        <input
                          type="number"
                          value={question.config?.scaleRange?.end || 5}
                          onChange={(e) => updateQuestion(questionId, { 
                            config: { 
                              ...question.config, 
                              scaleRange: { 
                                start: question.config?.scaleRange?.start || 1,
                                end: parseInt(e.target.value)
                              }
                            }
                          })}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        );
      }
      return <CustomSelect 
        value={commonProps.value as string}
        onChange={commonProps.onChange as (value: string) => void}
        options={field.props.options || []}
        placeholder={commonProps.placeholder as string}
        className={commonProps.className as string}
      />;

    default:
      return null;
  }
};
