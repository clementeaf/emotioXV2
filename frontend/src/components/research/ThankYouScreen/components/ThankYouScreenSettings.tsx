import React from 'react';
import { Switch } from '@/components/ui/Switch';
import { ThankYouScreenSettingsProps } from '../types';
import { UI_TEXTS } from '../constants';

/**
 * Componente para configuración general de la pantalla de agradecimiento
 */
export const ThankYouScreenSettings: React.FC<ThankYouScreenSettingsProps> = ({
  isEnabled,
  onEnabledChange,
  disabled
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <h3 className="text-md font-medium">Configuración</h3>
        <p className="text-sm text-neutral-500">
          Activa o desactiva la pantalla de agradecimiento
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-neutral-500">
          {isEnabled 
            ? UI_TEXTS.SETTINGS.ENABLED_LABEL 
            : UI_TEXTS.SETTINGS.DISABLED_LABEL}
        </span>
        <Switch
          checked={isEnabled}
          onCheckedChange={onEnabledChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}; 