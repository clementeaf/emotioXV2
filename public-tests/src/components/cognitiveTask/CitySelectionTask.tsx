import { useState } from 'react';

type City = 'Tallin' | 'Santiago' | 'Ciudad de México' | 'other';

// Componente para la tarea cognitiva de selección de ciudad
const CitySelectionTask = ({ onContinue }: { onContinue: () => void }) => {
  const [selectedCity, setSelectedCity] = useState<City>('Tallin');
  const [otherCity, setOtherCity] = useState<string>('');
  
  const handleContinue = () => {
    // Aquí podrías procesar la respuesta antes de continuar
    onContinue();
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white">
      <div className="max-w-xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-8">
          ¿En qué ciudad vives?
        </h2>
        
        <div className="w-full max-w-md">
          <div className="space-y-2 mb-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={selectedCity === 'Tallin'}
                onChange={() => setSelectedCity('Tallin')}
              />
              <span className="text-neutral-700">Tallin</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={selectedCity === 'Santiago'}
                onChange={() => setSelectedCity('Santiago')}
              />
              <span className="text-neutral-700">Santiago</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={selectedCity === 'Ciudad de México'}
                onChange={() => setSelectedCity('Ciudad de México')}
              />
              <span className="text-neutral-700">Ciudad de México</span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={selectedCity === 'other'}
                onChange={() => setSelectedCity('other')}
              />
              <span className="text-neutral-700">Otra</span>
            </label>
          </div>
          
          {selectedCity === 'other' && (
            <input
              type="text"
              className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 mb-6"
              placeholder="Escribe tu ciudad"
              value={otherCity}
              onChange={(e) => setOtherCity(e.target.value)}
            />
          )}
          
          <div className="flex justify-center mt-8">
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-8 rounded-md w-fit transition-colors shadow-sm"
              onClick={handleContinue}
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitySelectionTask; 