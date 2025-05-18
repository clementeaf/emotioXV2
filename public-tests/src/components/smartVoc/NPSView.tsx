import React, { useState, useEffect } from 'react';

interface NPSViewProps {
  questionText: string;
  instructions?: string;
  companyName?: string;
  leftLabel?: string; // Etiqueta izquierda (NPS)
  rightLabel?: string; // Etiqueta derecha (NPS)
  onNext: (selectedValue: number) => void; // Callback con el valor 0-10
  stepId?: string;
  stepType?: string; 
  initialValue?: number | null; // Valor inicial que viene de props (en lugar de localStorage)
  config?: unknown; // Configuración adicional si necesaria
}

const NPSView: React.FC<NPSViewProps> = ({
  questionText,
  instructions,
  companyName,
  leftLabel = "Not at all likely",
  rightLabel = "Extremely likely",
  onNext,
  initialValue = null,
}) => {
  const [selectedValue, setSelectedValue] = useState<number | null>(initialValue);
  
  useEffect(() => {
    if (initialValue !== null) {
      setSelectedValue(initialValue);
    }
  }, [initialValue]);

  const scaleButtons = Array.from({ length: 11 }, (_, i) => i); // Crea [0, 1, ..., 10]

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
      <div className="max-w-2xl w-full flex flex-col items-center"> {/* Max-width un poco mayor para acomodar 11 botones */}
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">
          {formattedQuestionText}
        </h2>

        {instructions && (
          <p className="text-sm text-center text-neutral-600 mb-8">
            {instructions}
          </p>
        )}

        {/* Contenedor para los botones numéricos 0-10 */}
        {/* Usar flex-wrap para que se ajusten en pantallas pequeñas si es necesario */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {scaleButtons.map((value) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              // Estilo ligeramente más pequeño para acomodar 11 botones
              className={`w-9 h-9 rounded-full border flex items-center justify-center font-medium transition-colors text-sm ${selectedValue === value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        {/* Etiquetas de los extremos */}
        <div className="flex justify-between w-full mt-2 px-1 max-w-lg"> {/* Limitar ancho de etiquetas */}
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

export default NPSView; 