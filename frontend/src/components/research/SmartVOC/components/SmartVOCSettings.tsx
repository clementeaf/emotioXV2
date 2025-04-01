import React from 'react';
import { Switch } from '@/components/ui/Switch';
import { SmartVOCSettingsProps } from '../types';
import { UI_TEXTS } from '../constants';

/**
 * Componente para los ajustes generales de SmartVOC
 */
export const SmartVOCSettings: React.FC<SmartVOCSettingsProps> = ({
  randomize,
  onRandomizeChange,
  requireAnswers,
  onRequireAnswersChange,
  disabled
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Ajuste de aleatorizar preguntas */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
        <div className="space-y-0.5">
          <h3 className="text-sm font-medium text-neutral-900">
            {UI_TEXTS.SETTINGS.RANDOMIZE_TITLE}
          </h3>
          <p className="text-sm text-neutral-500">
            {UI_TEXTS.SETTINGS.RANDOMIZE_DESCRIPTION}
          </p>
        </div>
        <Switch 
          checked={randomize} 
          onCheckedChange={onRandomizeChange} 
          disabled={disabled}
        />
      </div>
      
      {/* Ajuste de respuestas requeridas */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
        <div className="space-y-0.5">
          <h3 className="text-sm font-medium text-neutral-900">
            {UI_TEXTS.SETTINGS.REQUIRED_TITLE}
          </h3>
          <p className="text-sm text-neutral-500">
            {UI_TEXTS.SETTINGS.REQUIRED_DESCRIPTION}
          </p>
        </div>
        <Switch 
          checked={requireAnswers} 
          onCheckedChange={onRequireAnswersChange} 
          disabled={disabled}
        />
      </div>
    </div>
  );
}; 