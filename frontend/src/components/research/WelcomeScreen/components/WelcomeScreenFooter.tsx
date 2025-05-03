import React from 'react';
// import { WelcomeScreenFormProps } from '../types';
import { Button } from '@/components/ui/Button';
import { UI_TEXTS } from '../constants';

// <<< Definir props específicas >>>
interface WelcomeScreenFooterProps {
  onSave: () => void;
  onPreview: () => void;
  isSaving?: boolean;
  disabled?: boolean;
  isUpdate?: boolean;
}

/**
 * Componente para el pie de página del formulario de Welcome Screen
 */
export const WelcomeScreenFooter: React.FC<WelcomeScreenFooterProps> = ({
  onSave,
  onPreview,
  isSaving,
  disabled,
  isUpdate
}) => {
  const buttonText = isSaving
    ? UI_TEXTS.BUTTONS.SAVING
    : isUpdate
    ? UI_TEXTS.BUTTONS.UPDATE
    : UI_TEXTS.BUTTONS.SAVE;

  return (
    <div className="flex justify-end items-center gap-3 pt-4">
      <Button
        variant="outline"
        onClick={onPreview}
        disabled={disabled || isSaving}
      >
        {UI_TEXTS.BUTTONS.PREVIEW}
      </Button>
      <Button
        onClick={onSave}
        disabled={disabled || isSaving}
        loading={isSaving}
      >
        {buttonText}
      </Button>
    </div>
  );
}; 