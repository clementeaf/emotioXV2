import React from 'react';
import { SmartVOCSettingsProps } from '../types';

/**
 * Componente para los ajustes generales de SmartVOC
 */
export const SmartVOCSettings: React.FC<SmartVOCSettingsProps> = ({
  randomize,
  requireAnswers,
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
      </div>
    </div>
  );
}; 