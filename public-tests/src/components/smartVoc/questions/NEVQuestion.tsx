import React from 'react';
// import { SmartVOCQuestion, ConfigNEV } from '../SmartVOCRouter'; // Importar SmartVOCQuestion
import type { SmartVOCQuestion } from '../SmartVOCRouter'; // Usar import type

// Mapeo de string a número para NEV
/* // Eliminado, no se usa
const nevValueMap: { [key: string]: number } = {
  negative: -1,
  neutral: 0,
  positive: 1,
};
const getValueFromNevNumber = (num: number | null): string | undefined => {
  return Object.keys(nevValueMap).find(key => nevValueMap[key] === num);
};
*/

interface NEVQuestionProps {
  questionConfig: SmartVOCQuestion; // Cambiar a SmartVOCQuestion
  value: number | null;
  onChange: (questionId: string, value: number | null) => void;
}

// Opciones básicas de Emojis
const emojiOptions = [
  { value: 'negative', label: '😞', numValue: -1 },
  { value: 'neutral', label: '😐', numValue: 0 },
  { value: 'positive', label: '😊', numValue: 1 },
];

export const NEVQuestion: React.FC<NEVQuestionProps> = ({ questionConfig, value, onChange }) => {
  // Desestructurar desde SmartVOCQuestion
  const { id, title: _title, description, required: _required } = questionConfig;
  // const nevType = config.type || 'emojis'; // config está dentro de questionConfig.config

  return (
    <div className="space-y-4">
      {/* Usar description directamente */}
      <p className="text-base md:text-lg font-medium text-gray-800">{description}</p>
      
      <div className="flex justify-center gap-4 md:gap-6">
        {emojiOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            // Pasar el valor numérico
            onClick={() => onChange(id, option.numValue)}
            className={`p-2 rounded-full transition-all duration-150 ease-in-out 
              // Comparar con valor numérico
              ${value === option.numValue 
                ? 'bg-blue-100 ring-2 ring-blue-500 scale-110' 
                : 'bg-gray-100 hover:bg-gray-200'
              }`}
             aria-label={`Select ${option.value}`}
          >
            <span className="text-3xl md:text-4xl">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Podríamos añadir el companyName aquí si fuera necesario en el texto */}
      {/* {config.companyName && <p className="text-xs text-gray-500 text-center mt-2">Empresa: {config.companyName}</p>} */}
    </div>
  );
}; 