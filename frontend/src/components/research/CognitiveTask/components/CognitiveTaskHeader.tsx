import React from 'react';
import { CognitiveTaskHeaderProps } from '../types';

/**
 * Componente para el encabezado de las tareas cognitivas
 */
export const CognitiveTaskHeader: React.FC<CognitiveTaskHeaderProps> = ({
  title,
  description
}) => {
  return (
    <div className="space-y-0.5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-neutral-500">
        {description}
      </p>
    </div>
  );
}; 