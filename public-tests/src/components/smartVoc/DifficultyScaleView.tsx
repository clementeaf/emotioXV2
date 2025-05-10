import React, { useState, useEffect } from 'react';

interface DifficultyScaleViewProps {
  questionText: string;
  instructions?: string;
  companyName?: string;
  leftLabel?: string; // Etiqueta izquierda (CES)
  rightLabel?: string; // Etiqueta derecha (CES)
  onNext: (selectedValue: number) => void; // Callback con el valor 1-7
  stepId?: string;
  stepType?: string;
  initialValue?: number | null; // Valor inicial que viene de props (en lugar de localStorage)
  config?: any; // Configuración adicional si necesaria
}

const DifficultyScaleView: React.FC<DifficultyScaleViewProps> = ({
  questionText,
  instructions,
  companyName,
  leftLabel = "Muy fácil", // Valor por defecto CES
  rightLabel = "Muy difícil", // Valor por defecto CES
  onNext,
  stepId,
  stepType,
  initialValue = null,
  config
}) => {
  // Usar el valor inicial proporcionado por el padre
  const [selectedValue, setSelectedValue] = useState<number | null>(initialValue);

  // Efecto para actualizar el valor seleccionado si cambia initialValue
  useEffect(() => {
    if (initialValue !== null) {
      setSelectedValue(initialValue);
    }
  }, [initialValue]);

  // Generar los botones de dificultad 1-7
  const scaleButtons = Array.from({ length: 7 }, (_, i) => i + 1); // Crea [1, 2, ..., 7]

  const handleSelect = (value: number) => {
    setSelectedValue(value);
  };

  const handleNextClick = () => {
    if (selectedValue !== null) {
      onNext(selectedValue);
    }
  };

  // Formatear el texto de la pregunta (reemplazo simple)
  const formattedQuestionText = companyName
    ? questionText.replace(/\[company\]|\[empresa\]/gi, companyName)
    : questionText;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">
          {formattedQuestionText}
        </h2>

        {instructions && (
          <p className="text-sm text-center text-neutral-600 mb-8">
            {instructions}
          </p>
        )}

        {/* Contenedor para los botones numéricos 1-7 */}
        <div className="flex justify-center gap-2 mb-4">
          {scaleButtons.map((value) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className={`w-9 h-9 rounded-full border flex items-center justify-center font-medium transition-colors ${
                selectedValue === value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        {/* Etiquetas de los extremos */}
        <div className="flex justify-between w-full mt-2 px-1">
          <span className="text-xs text-neutral-500">{leftLabel}</span>
          <span className="text-xs text-neutral-500">{rightLabel}</span>
        </div>

        <button
          className="mt-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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