import React from 'react';
import { WelcomeScreenHeaderProps } from '../types';

/**
 * Componente de encabezado para el formulario de pantalla de bienvenida
 */
export const WelcomeScreenHeader: React.FC<WelcomeScreenHeaderProps> = ({ 
  title, 
  description 
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
}; 