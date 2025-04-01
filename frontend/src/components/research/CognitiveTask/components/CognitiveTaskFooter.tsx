import React from 'react';
import { Button } from '@/components/ui/Button';
import { CognitiveTaskFooterProps } from '../types';
import { UI_TEXTS } from '../constants';

/**
 * Componente para el pie de página con acciones del formulario
 */
export const CognitiveTaskFooter: React.FC<CognitiveTaskFooterProps> = ({
  isSaving,
  isLoading,
  cognitiveTaskId,
  onSave,
  onPreview
}) => {
  // Determinar el texto de estado
  const getStatusText = () => {
    if (isSaving || isLoading) {
      return UI_TEXTS.FOOTER.SAVING_TEXT;
    }
    
    return cognitiveTaskId 
      ? UI_TEXTS.FOOTER.UPDATE_EXISTING_TEXT 
      : UI_TEXTS.FOOTER.CREATE_NEW_TEXT;
  };

  return (
    <footer className="flex items-center justify-between px-8 py-4 mt-6 bg-neutral-50 rounded-lg border border-neutral-100">
      <p className="text-sm text-neutral-500">
        {getStatusText()}
      </p>
      <div className="flex space-x-2">
        <Button
          type="button"
          onClick={onPreview}
          disabled={isLoading || isSaving}
          variant="outline"
          className="px-4 py-2"
        >
          {UI_TEXTS.FOOTER.PREVIEW_BUTTON}
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={isLoading || isSaving}
          className="px-4 py-2"
        >
          {isSaving ? UI_TEXTS.FOOTER.SAVING_BUTTON : UI_TEXTS.FOOTER.SAVE_BUTTON}
        </Button>
      </div>
    </footer>
  );
}; 