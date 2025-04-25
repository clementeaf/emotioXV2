import React from 'react';
import { SmartVOCFooterProps } from '../types';
import { UI_TEXTS } from '../constants';

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
  const getSaveButtonText = () => {
    if (isSaving) {
      return 'Guardando...';
    }
    
    // Si existe un ID, es un registro existente, por lo que usamos "Actualizar"
    if (smartVocId) {
      return UI_TEXTS.BUTTONS.UPDATE;
    }
    
    // Por defecto, si no hay ID, es un nuevo registro, por lo que usamos "Guardar"
    return UI_TEXTS.BUTTONS.SAVE;
  };
  
  return (
    <div className="flex items-center justify-between px-8 py-4 mt-6 bg-neutral-50 rounded-lg border border-neutral-100">
      <p className="text-sm text-neutral-500">
        {isSaving ? 'Guardando...' : smartVocId 
          ? UI_TEXTS.FOOTER.EXISTING_CONFIGURATION
          : UI_TEXTS.FOOTER.NEW_CONFIGURATION}
      </p>
      <div className="flex space-x-2">
        {onPreview && (
          <button
            type="button"
            onClick={onPreview}
            disabled={isLoading || isSaving}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            {UI_TEXTS.BUTTONS.PREVIEW}
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={isLoading || isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[160px]"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>{'Guardando...'}</span>
            </div>
          ) : getSaveButtonText()}
        </button>
      </div>
    </div>
  );
}; 