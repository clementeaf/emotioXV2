import { useState, useEffect } from 'react';

interface PrioritizationTaskProps {
  onContinue: () => void;
  question?: string;
  options?: string[];
}

const PrioritizationTask = ({ 
  onContinue, 
  question = '¿Cómo priorizarías las siguientes opciones?',
  options = ['Opción 1', 'Opción 2', 'Opción 3']
}: PrioritizationTaskProps) => {
  // Estado para almacenar las respuestas del usuario (valor para cada opción)
  const [values, setValues] = useState<Array<string>>(Array(options.length).fill(''));
  const [error, setError] = useState<string | null>(null);

  // Manejar cambios en los campos de entrada
  const handleInputChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);
    setError(null);
  };

  // Validar y continuar
  const handleContinue = () => {
    // Verificar que se hayan llenado todos los campos
    if (values.some(value => value.trim() === '')) {
      setError('Por favor, completa todos los campos antes de continuar');
      return;
    }

    // Registrar las respuestas en la consola
    console.log('Priorización completada:', values);
    
    // Llamar a la función de continuar
    onContinue();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-6">
      <div className="max-w-md w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-10">
          {question}
        </h2>
        
        <div className="w-full space-y-4 mb-8">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-lg font-medium text-neutral-700 w-6 text-center">
                {index + 1}
              </span>
              <input 
                type="text"
                value={values[index]}
                onChange={(e) => handleInputChange(index, e.target.value)}
                placeholder={`Opción ${index + 1}`}
                className="flex-1 p-2.5 border border-neutral-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>
          ))}
        </div>
        
        {error && (
          <p className="text-red-500 text-sm mt-1 mb-4">
            {error}
          </p>
        )}
        
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
  );
};

export default PrioritizationTask; 