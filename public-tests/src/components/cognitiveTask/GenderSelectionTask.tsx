import { useState } from 'react';

type Gender = 'Masculino' | 'Femenino' | 'Prefiero no decirlo';

interface GenderSelectionTaskProps {
  onContinue: () => void;
}

// Componente para la tarea de selección de género
const GenderSelectionTask = ({ onContinue }: GenderSelectionTaskProps) => {
  const [selectedGender, setSelectedGender] = useState<Gender>('Masculino');
  
  const handleContinue = () => {
    // Aquí podríamos procesar la respuesta antes de continuar
    console.log('Género seleccionado:', selectedGender);
    onContinue();
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-md w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-8">
          ¿Con qué género te identificas?
        </h2>
        
        <div className="w-full max-w-sm">
          <div className="space-y-4 mb-8">
            <label className="flex items-center space-x-3 p-2 cursor-pointer">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={selectedGender === 'Masculino'}
                onChange={() => setSelectedGender('Masculino')}
              />
              <span className="text-neutral-700">Masculino</span>
            </label>
            
            <label className="flex items-center space-x-3 p-2 cursor-pointer">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={selectedGender === 'Femenino'}
                onChange={() => setSelectedGender('Femenino')}
              />
              <span className="text-neutral-700">Femenino</span>
            </label>
            
            <label className="flex items-center space-x-3 p-2 cursor-pointer">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={selectedGender === 'Prefiero no decirlo'}
                onChange={() => setSelectedGender('Prefiero no decirlo')}
              />
              <span className="text-neutral-700">Prefiero no decirlo</span>
            </label>
          </div>
          
          <div className="flex justify-center mt-6">
            <button
              onClick={handleContinue}
              className="bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-2.5 px-10 rounded w-32 transition-colors shadow-sm"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenderSelectionTask; 