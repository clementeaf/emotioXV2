import React from 'react';
import { SmartVOCQuestion, ConfigScale } from '../SmartVOCRouter'; // Importar tipos definidos en el padre

interface ScaleQuestionProps {
  questionConfig: SmartVOCQuestion & { config: ConfigScale }; // Asegura que config es ConfigScale
  value: number | undefined; // El valor numérico seleccionado
  onChange: (questionId: string, value: number) => void;
}

export const ScaleQuestion: React.FC<ScaleQuestionProps> = ({ questionConfig, value, onChange }) => {
  const { id, description, config } = questionConfig;
  const { scaleRange, startLabel, endLabel } = config;

  // Generar las opciones de la escala
  const scaleOptions: number[] = [];
  for (let i = scaleRange.start; i <= scaleRange.end; i++) {
    scaleOptions.push(i);
  }

  return (
    <div className="space-y-4">
      <p className="text-base md:text-lg font-medium text-gray-800">{description}</p>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {startLabel && <span className="text-sm text-gray-600 hidden sm:block">{startLabel}</span>}
        
        {/* Contenedor de los botones de escala */}
        <div className="flex flex-wrap justify-center gap-2 p-2 border border-gray-200 rounded-md bg-gray-50">
          {scaleOptions.map((optionValue) => (
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
                name={`scale-${id}`}
                value={optionValue}
                checked={value === optionValue}
                onChange={() => onChange(id, optionValue)}
                className="absolute opacity-0 w-0 h-0" // Ocultar el radio button real
              />
              <span className="text-sm md:text-base font-medium">{optionValue}</span>
            </label>
          ))}
        </div>

        {endLabel && <span className="text-sm text-gray-600 hidden sm:block">{endLabel}</span>}
        
        {/* Mostrar etiquetas debajo en móvil */}
         {(startLabel || endLabel) && (
             <div className="w-full flex justify-between text-xs text-gray-500 sm:hidden">
                 <span>{startLabel || ''}</span>
                 <span>{endLabel || ''}</span>
             </div>
         )}
      </div>
    </div>
  );
}; 