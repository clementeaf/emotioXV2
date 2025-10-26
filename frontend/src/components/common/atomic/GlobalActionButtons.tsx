import React from 'react';
import { Eye, Save, Trash2 } from 'lucide-react';

interface GlobalActionButtonsProps {
  isSaving: boolean;
  isLoading: boolean;
  onSave: () => void;
  onPreview: () => void;
  onDelete?: () => void;
  isExisting?: boolean;
  saveText?: string;
  updateText?: string;
  savingText?: string;
  previewText?: string;
  deleteText?: string;
  className?: string;
}

/**
 * Botones globales de acción en una línea limpia
 * Estilo vambeai.com - minimalista y funcional
 */
export const GlobalActionButtons: React.FC<GlobalActionButtonsProps> = ({
  isSaving,
  isLoading,
  onSave,
  onPreview,
  onDelete,
  isExisting = false,
  saveText = "Guardar todo",
  updateText = "Actualizar todo",
  savingText = "Guardando...",
  previewText = "Vista Previa",
  deleteText = "Eliminar todo",
  className = ''
}) => {
  const isDisabled = isSaving || isLoading;
  const buttonText = isExisting ? updateText : saveText;
  const displayText = isSaving ? savingText : buttonText;

  return (
    <div className={`flex items-center justify-start gap-3 ${className}`}>
      {/* Botón Vista Previa */}
      <button
        onClick={onPreview}
        disabled={isDisabled}
        className="
          flex items-center gap-2 px-4 py-2.5 text-sm font-medium
          text-gray-700 bg-white border border-gray-300 rounded-lg
          hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 shadow-sm
        "
      >
        <Eye className="w-4 h-4" />
        {previewText}
      </button>

      {/* Botón Guardar/Actualizar */}
      <button
        onClick={onSave}
        disabled={isDisabled}
        className="
          flex items-center gap-2 px-6 py-2.5 text-sm font-medium
          text-white bg-blue-600 border border-blue-600 rounded-lg
          hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 shadow-sm
        "
      >
        <Save className="w-4 h-4" />
        {displayText}
      </button>

      {/* Botón Eliminar */}
      {onDelete && isExisting && (
        <button
          onClick={onDelete}
          disabled={isDisabled}
          className="
            flex items-center gap-2 px-4 py-2.5 text-sm font-medium
            text-red-600 bg-red-50 border border-red-200 rounded-lg
            hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 shadow-sm
          "
        >
          <Trash2 className="w-4 h-4" />
          {deleteText}
        </button>
      )}
    </div>
  );
};
