import React from 'react';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
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
    <div className="flex items-center space-x-2">
      <Switch
        checked={isEnabled}
        onCheckedChange={onEnabledChange}
        disabled={disabled}
        className={cn(
          'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isEnabled ? 'bg-blue-500' : 'bg-neutral-200'
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform',
            isEnabled ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </Switch>
      <Label
        htmlFor="thank-you-screen-toggle"
        className="text-sm font-medium text-neutral-700 cursor-pointer"
      >
        {isEnabled ? UI_TEXTS.SETTINGS.ENABLED_LABEL : UI_TEXTS.SETTINGS.DISABLED_LABEL}
      </Label>
    </div>
  );
}; 