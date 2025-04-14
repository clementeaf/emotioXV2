import React from 'react';
import { WelcomeScreenHeader } from './WelcomeScreenHeader';

interface WelcomeScreenSettingsProps {
  title: string;
  message: string;
  startButtonText: string;
  isEnabled: boolean;
}

export const WelcomeScreenSettings: React.FC<WelcomeScreenSettingsProps> = ({
  title,
  message,
  startButtonText,
  isEnabled
}) => {
  return (
    <div className="space-y-6">
      <WelcomeScreenHeader 
        title="Configuración de la Pantalla de Bienvenida"
        description="Personaliza cómo se verá tu pantalla de bienvenida"
      />
      {/* Aquí irá el resto del contenido */}
    </div>
  );
}; 