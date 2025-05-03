import React from 'react';
import { SmartVOCFooterProps } from '../types';
import { UI_TEXTS } from '../constants';
import { Button } from '@/components/ui/Button';

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
  // Determinando el texto adecuado para el botón de guardar
  const buttonText = isSaving
    ? 'Guardando...'
    : smartVocId
    ? 'Actualizar'
    : 'Guardar';
  
  return (
    <div className="flex justify-end items-center gap-3 pt-4">
      {onPreview && (
        <Button
          variant="outline"
          onClick={onPreview}
          disabled={isLoading || isSaving}
        >
          {UI_TEXTS.BUTTONS.PREVIEW}
        </Button>
      )}
      <Button
        onClick={onSave}
        disabled={isLoading || isSaving}
        loading={isSaving}
      >
        {buttonText}
      </Button>
    </div>
  );
}; 