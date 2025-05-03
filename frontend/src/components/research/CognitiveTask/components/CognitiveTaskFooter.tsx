import React from 'react';
import { FormFooter } from '@/components/ui/FormFooter';
import { Save } from 'lucide-react';

interface CognitiveTaskFooterProps {
  onSave: () => void;
  onPreview?: () => void;
  isSaving?: boolean;
  isEditing?: boolean;
  cognitiveTaskId?: string | null;
}

export const CognitiveTaskFooter: React.FC<CognitiveTaskFooterProps> = ({
  onSave,
  onPreview,
  isSaving = false,
  isEditing = false,
  cognitiveTaskId = null
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
  );
}; 