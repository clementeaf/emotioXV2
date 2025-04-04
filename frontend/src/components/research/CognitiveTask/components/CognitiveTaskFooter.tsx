import React from 'react';

interface CognitiveTaskFooterProps {
  completionTimeText: string;
  previewButtonText: string;
  saveButtonText: string;
  onPreview: () => void;
  onSave: () => void;
  isSaving: boolean;
  disabled: boolean;
}

export const CognitiveTaskFooter: React.FC<CognitiveTaskFooterProps> = ({
  completionTimeText,
  previewButtonText,
  saveButtonText,
  onPreview,
  onSave,
  isSaving,
  disabled
}) => {
  return (
    <footer className="flex items-center justify-between px-8 py-4 mt-6 bg-neutral-50 rounded-lg border border-neutral-100">
      <p className="text-sm text-neutral-500">{completionTimeText}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={onPreview}
          disabled={disabled}
        >
          {previewButtonText}
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={onSave}
          disabled={disabled || isSaving}
        >
          {saveButtonText}
        </button>
      </div>
    </footer>
  );
}; 