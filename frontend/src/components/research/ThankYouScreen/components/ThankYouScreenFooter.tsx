import React from 'react';

import { FormFooter } from '@/components/ui/FormFooter';

import { UI_TEXTS } from '../constants';
import { ThankYouScreenFooterProps } from '../types';

/**
 * Componente para el pie de página con acciones del formulario
 */
export const ThankYouScreenFooter: React.FC<ThankYouScreenFooterProps> = ({
  isSaving,
  isLoading,
  isEnabled,
  thankYouScreenId,
  onSave,
  onPreview,
  // NUEVO: Props para eliminar
  onDelete,
  isDeleting,
  showDelete
}) => {
  // Determinar el texto de estado
  const getStatusText = () => {
    if (!isEnabled) {
      return 'La pantalla de agradecimiento está deshabilitada';
    }
    if (isSaving || isLoading) {
      return UI_TEXTS.FOOTER.SAVING_TEXT;
    }

    return thankYouScreenId
      ? UI_TEXTS.FOOTER.UPDATE_EXISTING_TEXT
      : UI_TEXTS.FOOTER.CREATE_NEW_TEXT;
  };

  return (
    <div className="space-y-4">
      {/* Botón de eliminar - solo si showDelete es true */}
      {showDelete && onDelete && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting || isLoading}
            className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Eliminando...' : '🗑️ Eliminar pantalla de agradecimiento'}
          </button>
        </div>
      )}

      {/* FormFooter original */}
      <FormFooter
        onSave={onSave}
        onPreview={onPreview}
        isSaving={isSaving}
        isDisabled={isLoading || !isEnabled}
        isUpdate={!!thankYouScreenId}
        saveText="Guardar"
        updateText="Actualizar"
        savingText={UI_TEXTS.FOOTER.SAVING_BUTTON}
        previewText={UI_TEXTS.FOOTER.PREVIEW_BUTTON}
        statusText={getStatusText()}
        showStatus={true}
        className="mt-6"
      />
    </div>
  );
};
