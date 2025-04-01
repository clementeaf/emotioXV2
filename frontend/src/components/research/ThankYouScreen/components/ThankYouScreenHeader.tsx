import React from 'react';
import { ThankYouScreenHeaderProps } from '../types';

/**
 * Componente para el encabezado de la pantalla de agradecimiento
 */
export const ThankYouScreenHeader: React.FC<ThankYouScreenHeaderProps> = ({
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