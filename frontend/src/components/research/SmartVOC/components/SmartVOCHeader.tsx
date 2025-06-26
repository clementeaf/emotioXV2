import React from 'react';

import { SmartVOCHeaderProps } from '../types';

/**
 * Componente para el encabezado del formulario SmartVOC
 */
export const SmartVOCHeader: React.FC<SmartVOCHeaderProps> = ({
  title,
  description
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-neutral-900 mb-1">{title}</h2>
      <p className="text-sm text-neutral-500">{description}</p>
    </div>
  );
}; 