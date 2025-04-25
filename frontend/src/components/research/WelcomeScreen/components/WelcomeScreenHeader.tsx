import React from 'react';
import { WelcomeScreenData } from '@/services/welcomeScreenService';
import { UI_TEXTS } from '../constants';

interface WelcomeScreenHeaderProps {
  title: string;
}

/**
 * Componente para la cabecera del formulario de Welcome Screen
 */
export const WelcomeScreenHeader: React.FC<WelcomeScreenHeaderProps> = ({ title }) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-neutral-800">{title || 'Configurar Pantalla de Bienvenida'}</h1>
    </div>
  );
}; 