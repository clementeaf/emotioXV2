import React from 'react';

import { Switch } from '@/components/ui/Switch';

import { SmartVOCSettingsProps } from '../types';

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
    <div className="bg-white  py-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <h3 className="font-medium text-lg">SmartVOC</h3>
          <span className="text-sm text-neutral-500">
            {randomize ? 'aleatorización activada' : 'aleatorización desactivada'}, 
            {requireAnswers ? ' respuestas obligatorias' : ' respuestas opcionales'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">
            {randomize && requireAnswers ? 'Activado' : 'Configuración parcial'}
          </span>
          <Switch 
            checked={randomize} 
            onCheckedChange={onRandomizeChange} 
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}; 