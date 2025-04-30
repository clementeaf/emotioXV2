import { useState } from 'react';
import RadioButtonGroup from '../common/RadioButtonGroup';

// Definir la interfaz para las opciones si no existe ya
interface ChoiceOption {
  id: string;
  label: string;
}

type CityId = 'Tallin' | 'Santiago' | 'Ciudad de México' | 'other';

// Opciones de ciudad para el RadioButtonGroup
const cityOptions: ChoiceOption[] = [
  { id: 'Tallin', label: 'Tallin' },
  { id: 'Santiago', label: 'Santiago' },
  { id: 'Ciudad de México', label: 'Ciudad de México' },
  { id: 'other', label: 'Otra' },
];

// Componente para la tarea cognitiva de selección de ciudad
const CitySelectionTask = ({ onContinue }: { onContinue: () => void }) => {
  // Mantener el tipo estricto para selectedCity
  const [selectedCity, setSelectedCity] = useState<CityId>('Tallin');
  const [otherCity, setOtherCity] = useState<string>('');

  const handleContinue = () => {
    // Aquí podrías procesar la respuesta (selectedCity, otherCity) antes de continuar
    console.log('Ciudad seleccionada:', selectedCity === 'other' ? otherCity : selectedCity);
    onContinue();
  };

  // Manejador para el cambio en RadioButtonGroup
  const handleCityChange = (selectedId: string) => {
    // Asegurarse de que el tipo es correcto antes de actualizar el estado
    if (['Tallin', 'Santiago', 'Ciudad de México', 'other'].includes(selectedId)) {
      setSelectedCity(selectedId as CityId);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white">
      <div className="max-w-xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-8">
          ¿En qué ciudad vives?
        </h2>

        <div className="w-full max-w-md">
          {/* Usar RadioButtonGroup para las opciones de ciudad */}
          <RadioButtonGroup
            name="city-selection" // Nombre para el grupo
            options={cityOptions} // Pasar las opciones definidas
            selectedValue={selectedCity} // Pasar el estado actual
            onChange={handleCityChange} // Pasar el nuevo manejador
            // Usar clases similares a las originales si es necesario
            className="space-y-2 mb-3" // Clase para el contenedor fieldset
            optionClassName="flex items-center space-x-3 cursor-pointer" // Clase para cada opción
            inputClassName="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500" // Clase para el input
            labelClassName="text-neutral-700" // Clase para la etiqueta
          />

          {selectedCity === 'other' && (
            <input
              type="text"
              className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 mt-4 mb-6" // Ajustar margen si es necesario
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