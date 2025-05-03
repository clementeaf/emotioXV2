import React from 'react';
import { SmartVOCFooterProps } from '../types';
import { UI_TEXTS } from '../constants';
import { FormFooter } from '@/components/ui/FormFooter';

/**
 * Componente para el pie de página del formulario SmartVOC
 */
export const SmartVOCFooter: React.FC<SmartVOCFooterProps> = ({
  isSaving,
  isLoading,
  smartVocId,
  onSave,
  onPreview
}) => {
  return (
    <FormFooter
      onSave={onSave}
      onPreview={onPreview}
      isSaving={isSaving}
      isDisabled={isLoading}
      isUpdate={!!smartVocId}
      saveText="Guardar"
      updateText="Actualizar"
      savingText="Guardando..."
      previewText={UI_TEXTS.BUTTONS.PREVIEW}
    />
  );
}; 