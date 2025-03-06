import { useState } from 'react';
import StarRating from './StarRating';

// Componente para la pantalla de CSAT (Customer Satisfaction)
const CSATView = ({ onNext }: { onNext: () => void }) => {
  const [rating, setRating] = useState(0);
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white">
      <div className="max-w-xl w-full p-8 flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-8">
          How would you rate your overall<br />
          satisfaction level with [company]?
        </h2>
        
        <StarRating rating={rating} setRating={setRating} />
        
        <button
          className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm"
          onClick={onNext}
          disabled={rating === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CSATView; 