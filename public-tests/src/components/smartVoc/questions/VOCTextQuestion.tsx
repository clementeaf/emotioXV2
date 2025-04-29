import React from 'react';
import { SmartVOCQuestion, ConfigVOC } from '../SmartVOCRouter'; // Importar tipos

interface VOCTextQuestionProps {
  questionConfig: SmartVOCQuestion & { config: ConfigVOC }; // Asegura config es ConfigVOC
  value: string | undefined;
  onChange: (questionId: string, value: string) => void;
}

export const VOCTextQuestion: React.FC<VOCTextQuestionProps> = ({ questionConfig, value, onChange }) => {
  const { id, description } = questionConfig;

  return (
    <div className="space-y-3">
      <label htmlFor={`voc-text-${id}`} className="block text-base md:text-lg font-medium text-gray-800">
        {description}
      </label>
      <textarea
        id={`voc-text-${id}`}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
        value={value || ''}
        onChange={(e) => onChange(id, e.target.value)}
        placeholder="Escribe tu respuesta aquí..."
      />
    </div>
  );
}; 