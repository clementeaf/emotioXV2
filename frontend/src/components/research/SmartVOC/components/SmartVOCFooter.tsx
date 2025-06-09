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
  researchId,
  onSave,
  onPreview,
  onDelete
}) => {
  return (
    <div className="flex flex-col gap-4">
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
      
      {/* Botón de eliminar datos */}
      {onDelete && (
        <div className="flex justify-center pt-4 border-t border-gray-200">
          <button
            onClick={onDelete}
            disabled={isSaving || isLoading}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🗑️ Eliminar datos SmartVOC
          </button>
        </div>
      )}
    </div>
  );
}; 