import React, { useState } from 'react';

interface DifficultyScaleViewProps {
  questionText: string;
  instructions?: string;
  scaleSize?: number; // Para CES suele ser 7
  leftLabel?: string; // Etiqueta izquierda
  rightLabel?: string; // Etiqueta derecha
  onNext: (selectedValue: number) => void;
}

const DifficultyScaleView: React.FC<DifficultyScaleViewProps> = ({
  questionText,
  instructions,
  scaleSize = 7, // Defecto 7 para CES
  leftLabel = "Muy difícil", // Defecto en español
  rightLabel = "Muy fácil", // Defecto en español
  onNext
}) => {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  const scaleButtons = Array.from({ length: scaleSize }, (_, i) => i + 1); // [1, ..., scaleSize]

  const handleSelect = (value: number) => {
    setSelectedValue(value);
  };

  const handleNextClick = () => {
    if (selectedValue !== null) {
      onNext(selectedValue);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">
          {questionText}
        </h2>

        {instructions && (
          <p className="text-sm text-center text-neutral-600 mb-8">
            {instructions}
          </p>
        )}

        <div className="flex space-x-4 justify-center w-full mb-4">
          {scaleButtons.map((value) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center font-medium transition-colors ${selectedValue === value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="flex justify-between w-full mt-2 px-1">
          <span className="text-sm text-neutral-500">{leftLabel}</span>
          <span className="text-sm text-neutral-500">{rightLabel}</span>
        </div>

        <button
          className="mt-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-8 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleNextClick}
          disabled={selectedValue === null}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default DifficultyScaleView; 