import React from 'react';

interface PreviewHeaderProps {
  logoText?: string; // Texto corto para el logo (ej. 'E')
  brandName?: string; // Nombre de la marca (ej. 'Emolo')
  previewMessage?: string; // Mensaje a mostrar (ej. 'This is a preview...')
}

const PreviewHeader: React.FC<PreviewHeaderProps> = ({
  logoText = 'E', // Valor por defecto
  brandName = 'Emolo', // Valor por defecto
  previewMessage = 'This is a preview. Your response will not be saved.', // Valor por defecto
}) => {
  return (
    <div className="bg-indigo-700 text-white p-2.5 flex items-center justify-between">
      {/* Logo y Nombre */}
      <div className="flex items-center">
        <div className="w-6 h-6 rounded-full bg-yellow-300 flex items-center justify-center mr-2">
          <span className="text-indigo-800 text-xs font-bold">{logoText}</span>
        </div>
        <span className="text-sm font-medium">{brandName}</span>
      </div>

      {/* Mensaje de Preview */}
      <div className="text-xs">{previewMessage}</div>

      {/* Dropdown Estático/Deshabilitado (Placeholder) */}
      <div className="bg-indigo-600 rounded px-3 py-1 text-xs flex items-center opacity-50 cursor-not-allowed">
        Jump to section
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default PreviewHeader; 