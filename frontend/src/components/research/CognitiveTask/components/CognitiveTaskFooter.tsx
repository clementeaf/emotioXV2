import React from 'react';

import { FormFooter } from '@/components/ui/FormFooter';

interface CognitiveTaskFooterProps {
  onSave: () => void;
  onPreview?: () => void;
  onDelete?: () => void;
  isSaving?: boolean;
  isEditing?: boolean;
  cognitiveTaskId?: string | null;
  researchId?: string;
}

export const CognitiveTaskFooter: React.FC<CognitiveTaskFooterProps> = ({
  onSave,
  onPreview,
  onDelete,
  isSaving = false,
  isEditing = false,
  cognitiveTaskId = null,
  researchId
}) => {
  // Determinar si estamos editando un formulario existente
  const isExistingForm = !!cognitiveTaskId;

  // Log para depuración
  React.useEffect(() => {
    console.log('[CognitiveTaskFooter] Estado del botón:', {
      isSaving,
      isExistingForm,
      cognitiveTaskId
    });
  }, [isSaving, isExistingForm, cognitiveTaskId]);

  return (
    <div className="flex flex-col gap-4">
      <FormFooter
        onSave={onSave}
        onPreview={onPreview}
        isSaving={isSaving}
        isDisabled={false}
        isUpdate={isExistingForm}
        saveText="Guardar"
        updateText="Actualizar"
        savingText="Guardando..."
        previewText="Vista previa"
      />

      {/* Botón de eliminar datos - Solo mostrar si hay datos guardados en el backend */}
      {onDelete && cognitiveTaskId && (
        <div className="flex justify-center pt-4 border-t border-gray-200">
          <button
            onClick={onDelete}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🗑️ Eliminar datos Cognitive Tasks
          </button>
        </div>
      )}
    </div>
  );
};
