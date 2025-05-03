import React from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Save } from 'lucide-react';

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
    <div className="flex justify-end items-center gap-3 pt-4">
      {onPreview && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onPreview}
          disabled={isSaving}
        >
          Vista previa
        </Button>
      )}

<Button 
        type="button" 
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <span className="animate-spin mr-2">
              <Save className="h-4 w-4" />
            </span>
            Guardando...
          </>
        ) : isExistingForm ? (
          <>
            <Save className="h-4 w-4 mr-2" />
            Actualizar
          </>
        ) : (
          <>
            Guardar 
          </>
        )}
      </Button>
    </div>
  );
}; 