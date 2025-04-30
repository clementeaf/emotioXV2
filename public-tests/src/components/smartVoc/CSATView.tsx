import React, { useState } from 'react';
// import StarRating from './StarRating'; // Ya no se usa

interface CSATViewProps {
  questionText: string;
  instructions?: string;
  companyName?: string; // Para posible inserción en el texto
  scaleSize?: number; // Cuántos números mostrar (e.g., 5, 7, 10)
  onNext: (selectedValue: number) => void; // Callback con el valor seleccionado
}

const CSATView: React.FC<CSATViewProps> = ({
  questionText,
  instructions,
  companyName,
  scaleSize = 5, // Valor por defecto 5 si no se provee
  onNext
}) => {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  // Generar los botones numéricos
  const scaleButtons = Array.from({ length: scaleSize }, (_, i) => i + 1); // Crea [1, 2, 3, 4, 5]

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
      <div className="max-w-md w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">
          {formattedQuestionText}
        </h2>

        {instructions && (
          <p className="text-sm text-center text-neutral-600 mb-8">
            {instructions}
          </p>
        )}

        {/* Contenedor para los botones numéricos */}
        <div className="flex space-x-2 mb-8">
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

        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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