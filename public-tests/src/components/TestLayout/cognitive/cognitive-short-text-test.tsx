import React from 'react';
import { VOCTextQuestion } from '../QuestionesComponents';

// 🧪 Componente de test para cognitive_short_text
export const CognitiveShortTextTest: React.FC = () => {
  const [value, setValue] = React.useState<string>('');

  const handleChange = (newValue: string) => {
    console.log('[CognitiveShortTextTest] 🔄 Cambio de valor:', newValue);
    setValue(newValue);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <h2 className="text-2xl font-bold text-gray-800 text-center">
        Test: Pregunta Corta
      </h2>
      <p className="text-gray-600 text-center max-w-2xl">
        Escribe tu respuesta
      </p>

      <div className="w-full max-w-2xl">
        <VOCTextQuestion
          value={value}
          onChange={handleChange}
          placeholder="Escribe tu respuesta aquí..."
        />
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">
          <strong>Valor actual:</strong> {value || '(vacío)'}
        </p>
      </div>
    </div>
  );
};

export default CognitiveShortTextTest;
