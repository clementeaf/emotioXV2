import React from 'react';
// import { ChoiceOption } from '../../types';
import { CheckboxGroupProps } from '../../types/common.types';

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  name,
  options,
  selectedIds,
  onChange,
  disabled = false,
  className = 'space-y-3', // Clases por defecto para el espaciado
  optionClassName = 'relative flex items-start',
  inputClassName = 'focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer',
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
              name={`${name}-${option.id}`} // Nombre único, aunque no es crucial para checkboxes individuales fuera de un form tradicional
              type="checkbox"
              checked={selectedIds.includes(option.id)}
              onChange={(e) => onChange(option.id, e.target.checked)}
              className={inputClassName}
              disabled={disabled} // Propagar disabled al input
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

export default CheckboxGroup; 