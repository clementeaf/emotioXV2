import React from 'react';

import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';

import { ScaleQuestionProps, ScaleConfig } from '../../types';

const DEFAULT_TEXTS = {
  QUESTION_TITLE_LABEL: 'Título de la pregunta',
  QUESTION_TITLE_PLACEHOLDER: 'Introduce el título de la pregunta',
  DESCRIPTION_LABEL: 'Descripción',
  DESCRIPTION_PLACEHOLDER: 'Introduce una descripción opcional',
  SCALE_START_VALUE_LABEL: 'Valor inicial',
  SCALE_END_VALUE_LABEL: 'Valor final',
  SCALE_START_LABEL_LABEL: 'Etiqueta valor inicial',
  SCALE_START_LABEL_PLACEHOLDER: 'Ej: Muy en desacuerdo',
  SCALE_END_LABEL_LABEL: 'Etiqueta valor final',
  SCALE_END_LABEL_PLACEHOLDER: 'Ej: Muy de acuerdo',
  DEVICE_FRAME_LABEL: 'Marco de Dispositivo',
  WITH_FRAME: 'Con Marco',
  WITHOUT_FRAME: 'Sin Marco'
};

/**
 * Componente que maneja la configuración de preguntas de escala
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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {DEFAULT_TEXTS.QUESTION_TITLE_LABEL}
        </label>
        <Input
          value={question.title || ''}
          onChange={(e) => onQuestionChange({ title: e.target.value })}
          placeholder={DEFAULT_TEXTS.QUESTION_TITLE_PLACEHOLDER}
          disabled={disabled}
          error={!!titleError}
          helperText={titleError || undefined}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {DEFAULT_TEXTS.DESCRIPTION_LABEL}
        </label>
        <Textarea
          value={question.description || ''}
          onChange={(e) => onQuestionChange({ description: e.target.value })}
          placeholder={DEFAULT_TEXTS.DESCRIPTION_PLACEHOLDER}
          rows={3}
          disabled={disabled}
          error={!!descriptionError}
        />
      </div>

      <div className="space-y-3 pt-2 border-t border-neutral-200">
        <h4 className="text-sm font-medium text-neutral-800">Configuración de la Escala</h4>
        
        {scaleRangeError && typeof scaleRangeError === 'string' && (
          <p className="text-xs text-red-500">{scaleRangeError}</p>
        )}

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              {DEFAULT_TEXTS.SCALE_START_VALUE_LABEL}
            </label>
            <Input
              type="number"
              value={scaleConfig.startValue ?? 0}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value, 10);
                onQuestionChange({ 
                  scaleConfig: { 
                    ...scaleConfig, 
                    startValue: isNaN(numValue) ? 0 : numValue 
                  } 
                });
              }}
              className="w-full"
              disabled={disabled}
              error={!!startValueError}
              helperText={startValueError || undefined}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              {DEFAULT_TEXTS.SCALE_END_VALUE_LABEL}
            </label>
            <Input
              type="number"
              value={scaleConfig.endValue ?? 0}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value, 10);
                onQuestionChange({ 
                  scaleConfig: { 
                    ...scaleConfig, 
                    endValue: isNaN(numValue) ? 0 : numValue 
                  } 
                });
              }}
              className="w-full"
              disabled={disabled}
              error={!!endValueError}
              helperText={endValueError || undefined}
            />
          </div>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              {DEFAULT_TEXTS.SCALE_START_LABEL_LABEL}
            </label>
            <Input
              value={scaleConfig.startLabel || ''}
              onChange={(e) => {
                onQuestionChange({ scaleConfig: { ...scaleConfig, startLabel: e.target.value } });
              }}
              placeholder={DEFAULT_TEXTS.SCALE_START_LABEL_PLACEHOLDER}
              disabled={disabled}
              error={!!startLabelError}
              helperText={startLabelError || undefined}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              {DEFAULT_TEXTS.SCALE_END_LABEL_LABEL}
            </label>
            <Input
              value={scaleConfig.endLabel || ''}
              onChange={(e) => {
                onQuestionChange({ scaleConfig: { ...scaleConfig, endLabel: e.target.value } });
              }}
              placeholder={DEFAULT_TEXTS.SCALE_END_LABEL_PLACEHOLDER}
              disabled={disabled}
              error={!!endLabelError}
              helperText={endLabelError || undefined}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-200 space-y-3">
        <h4 className="text-sm font-medium text-neutral-800">Opciones Adicionales</h4>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">Obligatorio</span>
          <Switch
            checked={question.required || false}
            onCheckedChange={(checked: boolean) => onQuestionChange({ required: checked })}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">Mostrar condicionalmente</span>
          <Switch
            checked={question.showConditionally || false}
            onCheckedChange={(checked: boolean) => onQuestionChange({ showConditionally: checked })}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">{DEFAULT_TEXTS.DEVICE_FRAME_LABEL}</span>
          <div className="flex items-center gap-2">
            <Switch
              checked={question.deviceFrame || false}
              onCheckedChange={(checked: boolean) => onQuestionChange({ deviceFrame: checked })}
              disabled={disabled}
            />
            <span className="text-xs text-neutral-500">
              {question.deviceFrame ? DEFAULT_TEXTS.WITH_FRAME : DEFAULT_TEXTS.WITHOUT_FRAME}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}; 