import React from 'react';
// import { WelcomeScreenFormProps } from '../types';
import { Button } from '@/components/ui/Button';
import { UI_TEXTS } from '../constants';
import { FormFooter } from '@/components/ui/FormFooter';

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
  return (
    <FormFooter
      onSave={onSave}
      onPreview={onPreview}
      isSaving={isSaving}
      isDisabled={disabled}
      isUpdate={isUpdate}
      saveText={UI_TEXTS.BUTTONS.SAVE}
      updateText={UI_TEXTS.BUTTONS.UPDATE}
      savingText={UI_TEXTS.BUTTONS.SAVING}
      previewText={UI_TEXTS.BUTTONS.PREVIEW}
    />
  );
}; 