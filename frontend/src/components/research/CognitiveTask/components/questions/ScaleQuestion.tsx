import React from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ScaleQuestionProps, ScaleConfig } from '../../types';
import { UI_TEXTS } from '../../constants';
import { Switch } from '@/components/ui/Switch';

/**
 * Componente que maneja la configuración de preguntas de escala
 */
export const ScaleQuestion: React.FC<ScaleQuestionProps> = ({
  question,
  onQuestionChange,
  validationErrors,
  disabled
}) => {
  // Corregir el uso de validationErrors como objeto en lugar de array
  const errorKey = `question_${question.id}_scale`;
  const hasError = validationErrors && errorKey in validationErrors;
  const errorMessage = hasError ? validationErrors[errorKey] : null;
  
  // Asegurar que scaleConfig exista y tenga valores predeterminados
  const scaleConfig: ScaleConfig = question.scaleConfig || {
    startValue: 1,
    endValue: 5
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Añadir pregunta"
          value={question.title}
          onChange={(e) => onQuestionChange({ title: e.target.value })}
          className="flex-1"
          disabled={disabled}
        />
        <div className="flex items-center gap-4 ml-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Mostrar condicionalmente</span>
            <Switch
              checked={question.showConditionally}
              onCheckedChange={(checked: boolean) => onQuestionChange({ showConditionally: checked })}
              disabled={disabled}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Obligatorio</span>
            <Switch
              checked={question.required}
              onCheckedChange={(checked: boolean) => onQuestionChange({ required: checked })}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Valor inicial</span>
          <Input
            type="number"
            value={scaleConfig.startValue}
            onChange={(e) => {
              const newScaleConfig: ScaleConfig = {
                ...scaleConfig,
                startValue: Number(e.target.value)
              };
              onQuestionChange({ scaleConfig: newScaleConfig });
            }}
            className="w-20"
            disabled={disabled}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Valor final</span>
          <Input
            type="number"
            value={scaleConfig.endValue}
            onChange={(e) => {
              const newScaleConfig: ScaleConfig = {
                ...scaleConfig,
                endValue: Number(e.target.value)
              };
              onQuestionChange({ scaleConfig: newScaleConfig });
            }}
            className="w-20"
            disabled={disabled}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <span className="text-sm text-neutral-600 block mb-1">Etiqueta valor inicial</span>
          <Input
            value={scaleConfig.startLabel || ''}
            onChange={(e) => {
              const newScaleConfig: ScaleConfig = {
                ...scaleConfig,
                startLabel: e.target.value
              };
              onQuestionChange({ scaleConfig: newScaleConfig });
            }}
            placeholder="Ej: Muy en desacuerdo"
            disabled={disabled}
          />
        </div>
        <div className="flex-1">
          <span className="text-sm text-neutral-600 block mb-1">Etiqueta valor final</span>
          <Input
            value={scaleConfig.endLabel || ''}
            onChange={(e) => {
              const newScaleConfig: ScaleConfig = {
                ...scaleConfig,
                endLabel: e.target.value
              };
              onQuestionChange({ scaleConfig: newScaleConfig });
            }}
            placeholder="Ej: Muy de acuerdo"
            disabled={disabled}
          />
        </div>
      </div>

      {hasError && (
        <div className="text-red-500 text-sm mt-1">{errorMessage}</div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Marco de Dispositivo</span>
          <Switch
            checked={question.deviceFrame || false}
            onCheckedChange={(checked: boolean) => onQuestionChange({ deviceFrame: checked })}
            disabled={disabled}
          />
        </div>
        <span className="text-xs text-neutral-500">
          {question.deviceFrame ? 'Con Marco' : 'Sin Marco'}
        </span>
      </div>
    </div>
  );
}; 