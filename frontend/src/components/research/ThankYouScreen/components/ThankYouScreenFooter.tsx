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

  return (
    <footer className="flex items-center justify-between px-8 py-4 mt-6 bg-neutral-50 rounded-lg border border-neutral-100">
      <p className="text-sm text-neutral-500">
        {getStatusText()}
      </p>
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
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? UI_TEXTS.FOOTER.SAVING_BUTTON : UI_TEXTS.FOOTER.SAVE_BUTTON}
        </button>
      </div>
    </footer>
  );
}; 