import React, { useState, useEffect } from 'react';
import { FeedbackViewProps } from '../../types/smart-voc.types';

const FeedbackView: React.FC<FeedbackViewProps> = ({
  questionText,
  instructions,
  placeholder = "Escribe tu respuesta aquí...", // Placeholder genérico
  initialValue = '', // NUEVO: Usar valor inicial
  onChange, // NUEVO
  onNext
}) => {
  const [feedback, setFeedback] = useState<string>(initialValue);

  useEffect(() => {
    setFeedback(initialValue);
  }, [initialValue]);

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setFeedback(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

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
          onChange={handleFeedbackChange}
        />
        
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-8 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleNextClick}
          disabled={!feedback.trim()}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default FeedbackView; 