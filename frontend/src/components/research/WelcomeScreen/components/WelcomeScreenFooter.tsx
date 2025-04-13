import React from 'react';
import { WelcomeScreenFooterProps } from '../types';
import { UI_TEXTS } from '../constants';

/**
 * Componente para el pie de página del formulario de pantalla de bienvenida
 */
export const WelcomeScreenFooter: React.FC<WelcomeScreenFooterProps> = ({
  isSaving,
  isLoading,
  welcomeScreenId,
  isEnabled,
  onSave,
  onPreview,
  buttonText
}) => {
  // Determinando el texto adecuado para el botón de guardar
  const getSaveButtonText = () => {
    if (isSaving) {
      return UI_TEXTS.BUTTONS.SAVING;
    }
    
    // Si existe un ID, es un registro existente, por lo que usamos "Actualizar"
    if (welcomeScreenId) {
      return UI_TEXTS.BUTTONS.UPDATE;
    }
    
    // Por defecto, si no hay ID, es un nuevo registro, por lo que usamos "Guardar"
    return UI_TEXTS.BUTTONS.SAVE;
  };
  
  return (
    <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
      <button
        type="button"
        onClick={onPreview}
        disabled={isLoading || isSaving || !isEnabled}
        className={`px-4 py-2 text-sm font-medium rounded-md border border-blue-600 text-blue-600 
          hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${(isLoading || isSaving || !isEnabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {UI_TEXTS.BUTTONS.PREVIEW}
      </button>
      
      <button
        type="button"
        onClick={onSave}
        disabled={isLoading || isSaving}
        className={`
          px-6 py-2 text-sm font-medium rounded-md
          bg-blue-600 text-white
          hover:bg-blue-700 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center min-w-[120px]
        `}
      >
        {isSaving ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>{buttonText || getSaveButtonText()}</span>
          </div>
        ) : (
          buttonText || getSaveButtonText()
        )}
      </button>
    </div>
  );
}; 