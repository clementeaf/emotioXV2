import React, { useState } from 'react';

interface FeedbackViewProps {
  questionText: string;
  instructions?: string;
  placeholder?: string; // Placeholder para el textarea
  onNext: (feedback: string) => void;
}

const FeedbackView: React.FC<FeedbackViewProps> = ({
  questionText,
  instructions,
  placeholder = "Escribe tu respuesta aquí...", // Placeholder genérico
  onNext
}) => {
  const [feedback, setFeedback] = useState("");

  const handleNextClick = () => {
    // Se podría validar si el feedback es vacío si fuera requerido
    onNext(feedback);
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
        
        <textarea
          className="w-full h-32 p-4 border border-neutral-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 mb-8" // Añadir margen inferior
          placeholder={placeholder}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
        
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-8 rounded-md w-fit transition-colors shadow-sm" // Botón siempre habilitado por defecto
          onClick={handleNextClick}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default FeedbackView; 