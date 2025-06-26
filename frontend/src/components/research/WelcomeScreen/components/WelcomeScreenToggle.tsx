import React from 'react';

import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';

import { UI_TEXTS } from '../constants';

interface WelcomeScreenToggleProps {
  isEnabled: boolean;
  onEnabledChange: (isEnabled: boolean) => void;
  disabled?: boolean;
}

/**
 * Componente para el interruptor de habilitar/deshabilitar Welcome Screen
 */
export const WelcomeScreenToggle: React.FC<WelcomeScreenToggleProps> = ({
  isEnabled,
  onEnabledChange,
  disabled
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <div>
        <Label htmlFor="welcome-screen-enabled" className="font-medium text-neutral-800">
          {'Habilitar Pantalla de Bienvenida'}
        </Label>
        <p className="text-sm text-neutral-600">
          {isEnabled ? UI_TEXTS.TOGGLE.ENABLED : UI_TEXTS.TOGGLE.DISABLED}
        </p>
      </div>
      <Switch
        id="welcome-screen-enabled"
        checked={isEnabled}
        onCheckedChange={onEnabledChange}
        disabled={disabled}
        aria-label={'Habilitar/Deshabilitar Pantalla de Bienvenida'}
      />
    </div>
  );
}; 