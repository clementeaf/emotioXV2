import React from 'react';

interface QuestionSaveButtonProps {
  questionId: string;
  onSave: (questionId: string) => Promise<void>;
  isModified: boolean;
  isSaving?: boolean;
  className?: string;
}

/**
 * Botón para guardar una pregunta específica (granular)
 */
export const QuestionSaveButton: React.FC<QuestionSaveButtonProps> = ({
  questionId,
  onSave,
  isModified,
  isSaving = false,
  className = ''
}) => {
  const handleSave = async () => {
    try {
      await onSave(questionId);
    } catch (error) {
      console.error('Error guardando pregunta:', error);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={!isModified || isSaving}
      className={`
        px-3 py-1.5 text-xs font-medium rounded-md transition-colors
        ${isModified 
          ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500' 
          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }
        ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      title={isModified ? 'Guardar cambios de esta pregunta' : 'No hay cambios para guardar'}
    >
      {isSaving ? 'Guardando...' : 'Guardar'}
    </button>
  );
};
