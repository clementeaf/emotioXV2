import React, { useState, useEffect } from 'react';
// import StarRating from './StarRating'; // Ya no se usa

interface CSATViewProps {
  questionText: string;
  instructions?: string;
  companyName?: string; // Para posible inserción en el texto
  onNext: (selectedValue: number) => void; // Callback con el valor 1-5
  stepId?: string;
  stepType?: string; // Generalmente será 'smartvoc_csat'
  initialValue?: number | null; // Valor inicial que viene de props (en lugar de localStorage)
  config?: any; // Configuración adicional si necesaria
}

const CSATView: React.FC<CSATViewProps> = ({
  questionText,
  instructions,
  companyName,
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

  // Generar los botones de satisfacción 1-5
  const satisfactionLevels = [
    { value: 1, label: 'Muy insatisfecho' },
    { value: 2, label: 'Insatisfecho' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Satisfecho' },
    { value: 5, label: 'Muy satisfecho' }
  ];

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
      <div className="max-w-2xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">
          {formattedQuestionText}
        </h2>

        {instructions && (
          <p className="text-sm text-center text-neutral-600 mb-8">
            {instructions}
          </p>
        )}

        {/* Contenedor para los botones de satisfacción */}
        <div className="flex flex-col sm:flex-row justify-center gap-2 mb-8 w-full">
          {satisfactionLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => handleSelect(level.value)}
              className={`px-4 py-3 rounded-md border flex flex-col items-center justify-center transition-colors ${
                selectedValue === level.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              <span className="font-medium">{level.value}</span>
              <span className="text-xs mt-1">{level.label}</span>
            </button>
          ))}
        </div>

        <button
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleNextClick}
          disabled={selectedValue === null}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default CSATView; 