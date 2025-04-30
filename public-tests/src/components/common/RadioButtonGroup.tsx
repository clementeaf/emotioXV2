import React from 'react';

interface ChoiceOption {
  id: string;
  label: string;
}

interface RadioButtonGroupProps {
  name: string; // Crucial para agrupar los radio buttons
  options: ChoiceOption[];
  selectedValue: string | undefined; // El ID de la opción actualmente seleccionada
  onChange: (selectedId: string) => void;
  disabled?: boolean;
  className?: string; // Estilos para el contenedor fieldset
  optionClassName?: string; // Estilos para cada contenedor de opción (div)
  inputClassName?: string; // Estilos para el input radio
  labelClassName?: string; // Estilos para la etiqueta label
}

const RadioButtonGroup: React.FC<RadioButtonGroupProps> = ({
  name,
  options,
  selectedValue,
  onChange,
  disabled = false,
  className = 'space-y-3',
  optionClassName = 'relative flex items-start',
  inputClassName = 'focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 cursor-pointer',
  labelClassName = 'font-medium text-gray-700 cursor-pointer',
}) => {
  return (
    <fieldset className={className} disabled={disabled}>
      <legend className="sr-only">Opciones</legend> {/* Leyenda para accesibilidad */}
      {options.map((option) => (
        <div key={option.id} className={optionClassName}>
          <div className="flex items-center h-5">
            <input
              id={`option-${name}-${option.id}`} // ID único
              name={name} // Nombre común para el grupo
              type="radio"
              checked={selectedValue === option.id}
              onChange={() => onChange(option.id)} // Llamar al handler con el ID
              className={inputClassName}
              disabled={disabled}
              aria-describedby={option.label} // Mejorar accesibilidad
            />
          </div>
          <div className="ml-3 text-sm">
            <label
              htmlFor={`option-${name}-${option.id}`}
              className={labelClassName}
              id={option.label} // Usado por aria-describedby
            >
              {option.label}
            </label>
          </div>
        </div>
      ))}
    </fieldset>
  );
};

export default RadioButtonGroup; 