import React from 'react';
import { Switch } from '@headlessui/react';
import { WelcomeScreenToggleProps } from '../types';
import { UI_TEXTS } from '../constants';

/**
 * Componente para activar/desactivar la pantalla de bienvenida
 */
export const WelcomeScreenToggle: React.FC<WelcomeScreenToggleProps> = ({
  isEnabled,
  onChange,
  disabled
}) => {
  return (
    <div className="flex items-center justify-between mb-6 p-4 border rounded-lg bg-gray-50">
      <div>
        <h3 className="font-medium">{UI_TEXTS.TITLE}</h3>
        <p className="text-sm text-gray-500">
          {isEnabled 
            ? UI_TEXTS.TOGGLE.ENABLED 
            : UI_TEXTS.TOGGLE.DISABLED}
        </p>
      </div>
      <Switch
        checked={isEnabled}
        onChange={onChange}
        disabled={disabled}
        className={`${
          isEnabled ? 'bg-blue-600' : 'bg-gray-300'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <span
          className={`${
            isEnabled ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </Switch>
    </div>
  );
}; 