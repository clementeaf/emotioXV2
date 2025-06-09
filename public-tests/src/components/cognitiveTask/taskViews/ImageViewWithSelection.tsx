import React from 'react';
import { ChoiceOption } from '../../../types/common.types';
import { ImageViewWithSelectionComponentProps } from '../../../types/cognitive-task.types';

// Componente interno para el placeholder de la imagen
const ImagePlaceholder: React.FC<{ type: 'desktop' | 'mobile' }> = ({ type }) => {
  const isMobile = type === 'mobile';
  const bgColor = isMobile ? 'bg-blue-100' : 'bg-gray-100';
  const title = isMobile ? 'Interfaz móvil de Capital' : 'Interfaz desktop de Capital';
  const description = `Esta es una representación del diseño de la interfaz ${isMobile ? 'móvil' : 'de escritorio'} para la autorización de transacciones.`;

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className={`w-full h-64 ${bgColor} flex items-center justify-center`}>
        <div className="text-center p-6">
          <div className="text-xl font-semibold mb-2">{title}</div>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
      <div className="p-3 flex justify-end">
        <button className="text-xs text-indigo-600 flex items-center gap-1">
          Expandir imagen
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

const ImageViewWithSelection: React.FC<ImageViewWithSelectionComponentProps> = ({
  imageType,
  options,
  selectedOption,
  onOptionSelect,
}) => {
  return (
    <>
      <ImagePlaceholder type={imageType} />
      
      {/* Grupo de Radio Buttons (estilo específico de TransactionAuthTask) */}
      <div className="w-full max-w-lg space-y-3 mb-6">
        {options.map((option: ChoiceOption) => (
          <label 
            key={option.id}
            className={`flex items-center p-3 rounded-lg border ${
              selectedOption === option.id 
                ? 'border-indigo-600 bg-indigo-50' 
                : 'border-neutral-300 hover:bg-neutral-50'
            } cursor-pointer transition-colors`}
          >
            <input
              type="radio"
              name="transaction-auth-option" // Mismo nombre para agrupar
              className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500 shrink-0" // shrink-0 para evitar que se encoja
              checked={selectedOption === option.id}
              onChange={() => onOptionSelect(option.id)}
            />
            <span className="ml-3 text-neutral-700">{option.label}</span>
          </label>
        ))}
      </div>
    </>
  );
};

export default ImageViewWithSelection; 