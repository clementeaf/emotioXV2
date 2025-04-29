import React from 'react';
import { SmartVOCQuestion, ConfigNEV } from '../SmartVOCRouter'; // Importar tipos

interface NEVQuestionProps {
  questionConfig: SmartVOCQuestion & { config: ConfigNEV }; // Asegura config es ConfigNEV
  value: string | undefined; // Valor seleccionado (ej: 'negative', 'neutral', 'positive')
  onChange: (questionId: string, value: string) => void;
}

// Opciones básicas de Emojis
const emojiOptions = [
  { value: 'negative', label: '😞' },
  { value: 'neutral', label: '😐' },
  { value: 'positive', label: '😊' },
];

export const NEVQuestion: React.FC<NEVQuestionProps> = ({ questionConfig, value, onChange }) => {
  const { id, description, config } = questionConfig;
  const nevType = config.type || 'emojis'; // Usar el tipo específico si es necesario en el futuro

  // TODO: Implementar lógica diferente basada en nevType si es necesario
  // (emojis_detailed, emotional_scale, quadrants)

  return (
    <div className="space-y-4">
      <p className="text-base md:text-lg font-medium text-gray-800">{description}</p>
      
      <div className="flex justify-center gap-4 md:gap-6">
        {emojiOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(id, option.value)}
            className={`p-2 rounded-full transition-all duration-150 ease-in-out 
              ${value === option.value 
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