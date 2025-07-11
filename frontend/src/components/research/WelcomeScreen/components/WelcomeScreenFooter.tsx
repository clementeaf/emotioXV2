import React from 'react';

// import { WelcomeScreenFormProps } from '../types';
import { FormFooter } from '@/components/ui/FormFooter';

import { UI_TEXTS } from '../constants';


// <<< Definir props específicas >>>
interface WelcomeScreenFooterProps {
  onSave: () => void;
  onPreview: () => void;
  isSaving?: boolean;
  disabled?: boolean;
  isUpdate?: boolean;
  // NUEVO: Props para eliminar
  onDelete?: () => void;
  isDeleting?: boolean;
  showDelete?: boolean;
}

/**
 * Componente para el pie de página del formulario de Welcome Screen
 */
export const WelcomeScreenFooter: React.FC<WelcomeScreenFooterProps> = ({
  onSave,
  onPreview,
  isSaving,
  disabled,
  isUpdate,
  // NUEVO: Props para eliminar
  onDelete,
  isDeleting,
  showDelete
}) => {
  return (
    <div className="flex justify-between items-center pt-4 gap-3">
      {/* Botón de eliminar - solo si showDelete es true */}
      {showDelete && onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting || disabled}
          className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Eliminando...' : '🗑️ Eliminar pantalla de bienvenida'}
        </button>
      ) : <div />}

      {/* FormFooter original alineado a la derecha */}
      <div className="flex gap-3">
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
      </div>
    </div>
  );
};
