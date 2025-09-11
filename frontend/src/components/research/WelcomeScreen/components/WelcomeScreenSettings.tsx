import React from 'react';

import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';

import { UI_TEXTS } from '../constants';

interface WelcomeScreenSettingsProps {
  isEnabled: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const WelcomeScreenSettings: React.FC<WelcomeScreenSettingsProps> = ({
  isEnabled,
  onChange,
  disabled = false
}) => {
  return (
    <div className="flex items-center space-x-2 my-4">
      <Switch
        checked={isEnabled}
        onCheckedChange={onChange}
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
        htmlFor="welcome-screen-toggle"
        className="text-sm font-medium text-neutral-700 cursor-pointer"
      >
        {isEnabled ? UI_TEXTS.TOGGLE.ENABLED : UI_TEXTS.TOGGLE.DISABLED}
      </Label>
    </div>
  );
}; 