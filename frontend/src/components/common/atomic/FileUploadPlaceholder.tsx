import React from 'react';

interface FileUploadPlaceholderProps {
  label: string;
  message: string;
  acceptedTypes?: string[];
  className?: string;
}

export const FileUploadPlaceholder: React.FC<FileUploadPlaceholderProps> = ({
  label,
  message,
  acceptedTypes = [],
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <p className="text-sm text-gray-500">
          {message}
        </p>
        {acceptedTypes.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Tipos permitidos: {acceptedTypes.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
};
