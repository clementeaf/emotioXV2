import React, { useState, useEffect } from 'react';
// import StarRating from './StarRating'; // Ya no se usa

interface CSATViewProps {
  questionText: string;
  instructions?: string;
  companyName?: string; // Para posible inserción en el texto
  scaleSize?: number; // Cuántos números mostrar (e.g., 5, 7, 10)
  onNext: (selectedValue: number) => void; // Callback con el valor seleccionado
  // Props para localStorage
  stepId?: string;
  stepType?: string; // Generalmente será 'smartvoc_csat'
}

const CSATView: React.FC<CSATViewProps> = ({
  questionText,
  instructions,
  companyName,
  scaleSize = 5, // Valor por defecto 5 si no se provee
  onNext,
  stepId,
  stepType
}) => {
  const localStorageKey = `form-${stepType || 'csat'}-${stepId || 'default'}`;

  const [selectedValue, setSelectedValue] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        return typeof parsed === 'number' ? parsed : null;
      }
    } catch (e) { console.error("Error reading CSAT from localStorage", e); }
    return null; // No hay valor inicial por defecto si no está en localStorage
  });

  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(selectedValue));
    } catch (e) { console.error("Error saving CSAT to localStorage", e); }
  }, [selectedValue, localStorageKey]);

  // Generar los botones numéricos
  const scaleButtons = Array.from({ length: scaleSize }, (_, i) => i + 1); // Crea [1, 2, 3, 4, 5]

  const handleSelect = (value: number) => {
    setSelectedValue(value);
  };

  const handleNextClick = () => {
    if (selectedValue !== null) {
      onNext(selectedValue);
      // Opcional: localStorage.removeItem(localStorageKey);
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
        {/* DEBUG: Mostrar datos de localStorage */}
        <details className="mt-4 text-xs">
            <summary className="cursor-pointer font-medium">localStorage Data ({localStorageKey})</summary>
            <pre className="mt-1 bg-gray-100 p-2 rounded text-gray-700 overflow-auto text-xs">
                {JSON.stringify(JSON.parse(localStorage.getItem(localStorageKey) || 'null'), null, 2)}
            </pre>
        </details>
      </div>
    </div>
  );
};

export default CSATView; 