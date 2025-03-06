import { useState } from 'react';

// Componente para la escala de acuerdo (1-7)
const AgreementScaleView = ({ onContinue }: { onContinue: () => void }) => {
  const [selected, setSelected] = useState<number>(4); // Predefinido en 4 como en la imagen
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white">
      <div className="max-w-xl w-full p-8 flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-12">
          This was the best app my eyes had see
        </h2>
        
        <div className="flex space-x-4 justify-center w-full mb-4">
          {[1, 2, 3, 4, 5, 6, 7].map((value) => (
            <div key={value} className="flex flex-col items-center">
              <button
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium transition-colors ${
                  selected === value 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:border-indigo-400'
                }`}
                onClick={() => setSelected(value)}
              >
                {value}
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between w-full mt-2 px-1">
          <span className="text-sm text-neutral-500">Strongly Disagree</span>
          <span className="text-sm text-neutral-500">Strongly Agree</span>
        </div>
        
        <button
          className="mt-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-8 rounded-md w-fit transition-colors shadow-sm"
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default AgreementScaleView; 