import React from 'react';

// Definiciones de tipo locales para SmartVOCQuestion y ConfigCSAT
interface ConfigCSAT {
  type?: 'stars' | 'numbers';
  companyName?: string;
  // Podrías añadir aquí más propiedades si son necesarias para ConfigCSAT
}

interface SmartVOCQuestion {
  id: string;
  description: string;
  config: ConfigCSAT;
  // Podrías añadir aquí más propiedades si son necesarias para SmartVOCQuestion
}

interface CSATQuestionProps {
  questionConfig: SmartVOCQuestion; // Ahora usa el tipo local SmartVOCQuestion
  value: number | string | undefined;
  onChange: (questionId: string, value: number | string) => void;
}

// --- Componente Placeholder para Estrellas (simple) ---
const StarRating: React.FC<{ value: number | undefined, count: number, onChange: (rating: number) => void }> = ({ value, count, onChange }) => {
    const stars = Array.from({ length: count }, (_, i) => i + 1);
    return (
        <div className="flex justify-center gap-1 md:gap-2">
            {stars.map(starValue => (
                <button
                    key={starValue}
                    type="button"
                    onClick={() => onChange(starValue)}
                    className={`text-3xl md:text-4xl transition-colors duration-150 ease-in-out 
                        ${value && starValue <= value ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}
                    `}
                    aria-label={`Rate ${starValue} out of ${count}`}
                >
                    ★
                </button>
            ))}
        </div>
    );
};

// --- Componente Principal CSAT --- 

export const CSATQuestion: React.FC<CSATQuestionProps> = ({ questionConfig, value, onChange }) => {
  const { id, description, config } = questionConfig;
  const displayType = config.type || 'stars'; // Default a estrellas si no se especifica

  return (
    <div className="space-y-4">
      <p className="text-base md:text-lg font-medium text-gray-800">{description}</p>

      {displayType === 'numbers' && (
        // Usar lógica similar a ScaleQuestion para números (asumimos 1-5)
        <div className="flex flex-wrap justify-center gap-2 p-2 border border-gray-200 rounded-md bg-gray-50">
          {[1, 2, 3, 4, 5].map((optionValue) => (
            <label 
              key={optionValue}
              className={`relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer transition-colors duration-150 ease-in-out 
                ${value === optionValue 
                  ? 'bg-blue-600 text-white shadow-md scale-105' 
                  : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-300'
                }`}
            >
              <input
                type="radio"
                name={`csat-number-${id}`}
                value={optionValue}
                checked={value === optionValue}
                onChange={() => onChange(id, optionValue)}
                className="absolute opacity-0 w-0 h-0"
              />
              <span className="text-sm md:text-base font-medium">{optionValue}</span>
            </label>
          ))}
        </div>
      )}

      {displayType === 'stars' && (
         // Usar el componente de estrellas (asumimos 5 estrellas)
          <StarRating 
             value={typeof value === 'number' ? value : undefined} 
             count={5} 
             onChange={(rating) => onChange(id, rating)} 
          />
      )}

      {/* Podríamos añadir el companyName aquí si fuera necesario en el texto */}
      {/* {config.companyName && <p className="text-xs text-gray-500 text-center mt-2">Empresa: {config.companyName}</p>} */}
    </div>
  );
}; 