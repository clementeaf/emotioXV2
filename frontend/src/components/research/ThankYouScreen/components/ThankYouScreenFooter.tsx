import React from 'react';
import { ThankYouScreenFooterProps } from '../types';
import { UI_TEXTS } from '../constants';

/**
 * Componente para el pie de página con acciones del formulario
 */
export const ThankYouScreenFooter: React.FC<ThankYouScreenFooterProps> = ({
  isSaving,
  isLoading,
  isEnabled,
  thankYouScreenId,
  onSave,
  onPreview
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

  // Determinar el texto del botón de guardar
  const getSaveButtonText = () => {
    if (isSaving) {
      return UI_TEXTS.FOOTER.SAVING_BUTTON;
    }
    return thankYouScreenId ? "Actualizar" : "Guardar";
  };

  return (
    <footer className="flex items-center justify-end py-4 mt-6">
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={onPreview}
          disabled={isLoading || isSaving || !isEnabled}
          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          {UI_TEXTS.FOOTER.PREVIEW_BUTTON}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isLoading || isSaving || !isEnabled}
          className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-black/50 transition-colors disabled:opacity-50"
        >
          {getSaveButtonText()}
        </button>
      </div>
    </footer>
  );
}; 