import React from 'react';
import { FormField, FormSection, FormRow } from '@/components/common/atomic';
import { FormCard } from '@/components/common/FormCard';
import { ScaleQuestionProps, ScaleConfig } from '../../types';

/**
 * Componente refactorizado que usa componentes atómicos
 * Elimina duplicación de layouts y patrones repetidos
 */
export const ScaleQuestion: React.FC<ScaleQuestionProps> = ({
  question,
  onQuestionChange,
  validationErrors,
  disabled
}) => {
  const titleError = validationErrors ? validationErrors['title'] : null;
  const descriptionError = validationErrors ? validationErrors['description'] : null;
  const startValueError = validationErrors ? validationErrors['scaleConfig.startValue'] : null;
  const endValueError = validationErrors ? validationErrors['scaleConfig.endValue'] : null;
  const startLabelError = validationErrors ? validationErrors['scaleConfig.startLabel'] : null;
  const endLabelError = validationErrors ? validationErrors['scaleConfig.endLabel'] : null;
  const scaleRangeError = validationErrors ? validationErrors['scaleConfig'] : null;
  
  const scaleConfig: ScaleConfig = question.scaleConfig || {
    startValue: 1,
    endValue: 5,
    startLabel: '',
    endLabel: ''
  };

  return (
    <FormCard>
      <FormSection 
        title="Configuración de Pregunta de Escala"
        description="Configure los valores y etiquetas de la escala"
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

        {/* Configuración de la escala */}
        <div className="space-y-3 pt-2 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-800">Configuración de la Escala</h4>
          
          {scaleRangeError && typeof scaleRangeError === 'string' && (
            <p className="text-xs text-red-500">{scaleRangeError}</p>
          )}

          <FormRow justified>
            {/* Valor inicial */}
            <FormField
              type="number"
              label="Valor inicial"
              value={scaleConfig.startValue ?? 0}
              onChange={(value) => {
                const numValue = parseInt(value, 10);
                onQuestionChange({ 
                  scaleConfig: { 
                    ...scaleConfig, 
                    startValue: isNaN(numValue) ? 0 : numValue 
                  } 
                });
              }}
              disabled={disabled}
              error={!!startValueError}
              errorMessage={startValueError || undefined}
              config={{ min: 0, max: 100 }}
            />

            {/* Valor final */}
            <FormField
              type="number"
              label="Valor final"
              value={scaleConfig.endValue ?? 0}
              onChange={(value) => {
                const numValue = parseInt(value, 10);
                onQuestionChange({ 
                  scaleConfig: { 
                    ...scaleConfig, 
                    endValue: isNaN(numValue) ? 0 : numValue 
                  } 
                });
              }}
              disabled={disabled}
              error={!!endValueError}
              errorMessage={endValueError || undefined}
              config={{ min: 0, max: 100 }}
            />
          </FormRow>
          
          <FormRow justified>
            {/* Etiqueta valor inicial */}
            <FormField
              type="text"
              label="Etiqueta valor inicial"
              value={scaleConfig.startLabel || ''}
              onChange={(value) => {
                onQuestionChange({ scaleConfig: { ...scaleConfig, startLabel: value } });
              }}
              placeholder="Ej: Muy en desacuerdo"
              disabled={disabled}
              error={!!startLabelError}
              errorMessage={startLabelError || undefined}
            />

            {/* Etiqueta valor final */}
            <FormField
              type="text"
              label="Etiqueta valor final"
              value={scaleConfig.endLabel || ''}
              onChange={(value) => {
                onQuestionChange({ scaleConfig: { ...scaleConfig, endLabel: value } });
              }}
              placeholder="Ej: Muy de acuerdo"
              disabled={disabled}
              error={!!endLabelError}
              errorMessage={endLabelError || undefined}
            />
          </FormRow>
        </div>

      </FormSection>
    </FormCard>
  );
};
