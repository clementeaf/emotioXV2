import { useState } from 'react';

// Componente para la retroalimentación de texto
const FeedbackView = ({ onContinue }: { onContinue: () => void }) => {
  const [feedback, setFeedback] = useState("");
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white">
      <div className="max-w-xl w-full p-8 flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-10">
          ¿Cómo podemos mejorar el servicio?
        </h2>
        
        <textarea
          className="w-full h-32 p-4 border border-neutral-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          placeholder="Me siento honrado de opinar..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
        
        <div className="w-full flex justify-end mt-1">
          <span className="text-xs text-neutral-400">0/100</span>
        </div>
        
        <button
          className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-8 rounded-md w-fit transition-colors shadow-sm"
          onClick={onContinue}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default FeedbackView; 