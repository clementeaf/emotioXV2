import React from 'react';
import { SingleAndMultipleChoiceQuestion } from './QuestionesComponents';

export const CognitiveMultipleChoiceTest: React.FC = () => {
  const [value, setValue] = React.useState<string[]>([]);

  const choices = [
    { id: "1", text: "rojo" },
    { id: "2", text: "azul" },
    { id: "3", text: "marron" }
  ];

  const handleChange = (newValue: any) => {
    console.log('[CognitiveMultipleChoiceTest] 🔄 Cambio de valor:', {
      newValue,
      newValueType: typeof newValue,
      isArray: Array.isArray(newValue)
    });
    setValue(newValue);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <h2 className="text-2xl font-bold text-gray-800 text-center">Test: Selección Múltiple</h2>
      <p className="text-gray-600 text-center max-w-2xl">Selecciona múltiples opciones</p>

      <div className="w-full max-w-2xl">
        <SingleAndMultipleChoiceQuestion
          choices={choices}
          value={value}
          onChange={handleChange}
          multiple={true}
        />
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">
          <strong>Valor actual:</strong> {JSON.stringify(value)}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Tipo:</strong> {typeof value}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Es array:</strong> {Array.isArray(value) ? 'Sí' : 'No'}
        </p>
      </div>
    </div>
  );
};

export default CognitiveMultipleChoiceTest;
