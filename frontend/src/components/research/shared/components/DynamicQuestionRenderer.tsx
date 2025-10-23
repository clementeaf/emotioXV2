import React from 'react';
import { QuestionPreview } from '@/components/common/QuestionPreview';
import { DynamicQuestion, QuestionField } from '../hooks/useDynamicQuestionForm';
import FormInput from '@/components/common/FormInput';
import FormTextarea from '@/components/common/FormTextarea';
import FormSelect from '@/components/common/FormSelect';

interface DynamicQuestionRendererProps {
  question: DynamicQuestion;
  questionTypeConfig: {
    fields: QuestionField[];
    previewType: string;
    info?: string;
  };
  onUpdate: (updates: Partial<DynamicQuestion>) => void;
  onRemove?: () => void;
  onDuplicate?: () => void;
  disabled?: boolean;
  showPreview?: boolean;
}

/**
 * Componente genérico para renderizar cualquier tipo de pregunta
 * Basado en configuración dinámica del schema JSON
 */
export const DynamicQuestionRenderer: React.FC<DynamicQuestionRendererProps> = ({
  question,
  questionTypeConfig,
  onUpdate,
  onRemove,
  onDuplicate,
  disabled = false,
  showPreview = true
}) => {
  
  // Función para obtener valor anidado
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };
  
  // Función para crear manejador de cambios
  const createFieldChangeHandler = (fieldName: string) => {
    return (value: any) => {
      if (fieldName.includes('.')) {
        // Para campos anidados como 'config.type'
        const [parent, child] = fieldName.split('.');
        onUpdate({
          [parent]: {
            ...question[parent],
            [child]: value
          }
        });
      } else {
        onUpdate({ [fieldName]: value });
      }
    };
  };
  
  // Renderizar campo dinámico
  const renderField = (field: QuestionField) => {
    const fieldValue = getNestedValue(question, field.name);
    const handleChange = createFieldChangeHandler(field.name);
    
    const commonProps = {
      label: field.label,
      value: fieldValue || '',
      onChange: handleChange,
      placeholder: field.placeholder,
      disabled,
      required: field.required
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
        
      case 'ChoiceManager':
        // Componente especializado para manejar opciones
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
            </label>
            <div className="text-sm text-gray-500">
              Gestión de opciones (implementar ChoiceManager)
            </div>
          </div>
        );
        
      case 'ScaleConfig':
        // Componente especializado para configuración de escalas
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
            </label>
            <div className="text-sm text-gray-500">
              Configuración de escala (implementar ScaleConfig)
            </div>
          </div>
        );
        
      case 'HitZoneManager':
        // Componente especializado para zonas de interacción
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
            </label>
            <div className="text-sm text-gray-500">
              Gestión de zonas (implementar HitZoneManager)
            </div>
          </div>
        );
        
      case 'FileUploader':
        // Componente especializado para upload de archivos
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
            </label>
            <div className="text-sm text-gray-500">
              Upload de archivos (implementar FileUploader)
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-sm text-red-500">
            Componente no soportado: {field.component}
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Campos del formulario */}
      <div className="space-y-4">
        {questionTypeConfig.fields.map((field, index) => (
          <div key={`${question.id}-${field.name}-${index}`}>
            {renderField(field)}
          </div>
        ))}
        
        {/* Información específica del tipo */}
        {questionTypeConfig.info && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">
              {questionTypeConfig.previewType}
            </span>
            <div className="text-sm text-neutral-600 bg-neutral-100 px-3 py-2 rounded-lg">
              {questionTypeConfig.info}
            </div>
          </div>
        )}
      </div>
      
      {/* Vista previa */}
      {showPreview && (
        <div className="border-t pt-4">
          <QuestionPreview
            title={question.title}
            description={question.description}
            instructions={question.instructions}
            type={question.type}
            config={question.config}
          />
        </div>
      )}
      
      {/* Acciones */}
      {(onRemove || onDuplicate) && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              disabled={disabled}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              Duplicar
            </button>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              disabled={disabled}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
};
