import React from 'react';
import { DemographicConfig, SelectOption } from '../../types/demographics';
import { GenericSelectQuestionProps } from '../../types/flow.types';

export const GenericSelectQuestion: React.FC<GenericSelectQuestionProps> = ({
  config,
  value,
  onChange,
}) => {
  console.log(`🔍 [GenericSelectQuestion] Rendering select for:`, {
    id: config.id,
    title: config.title,
    currentValue: value,
    options: config.options,
    optionsType: config.options?.map(opt => typeof opt),
    required: config.required
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    console.log(`📝 [GenericSelectQuestion] Value changed for ${config.id}:`, {
      oldValue: value,
      newValue: newValue,
      targetValue: e.target.value
    });
    onChange(config.id, newValue);
  };

  // Usar un título de fallback si config.title no está definido
  const title = config.title || config.id; // Como fallback, usa el id de la pregunta

  return (
    <div className="mb-4">
      <label htmlFor={config.id} className="block text-sm font-medium text-gray-700 mb-1">
        {title} {config.required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={config.id}
        value={value || ''}
        onChange={handleChange}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        required={config.required}
      >
        <option value="">Selecciona una opción</option>
        {/* Iterar sobre config.options si existen y son un array */}
        {Array.isArray(config.options) && config.options.map((option: SelectOption | string, index: number) => {
          if (typeof option === 'string') {
            // Caso: option es un string (ej. para technicalProficiency)
            return (
              <option key={`${option}-${index}`} value={option}>
                {option}
              </option>
            );
          } else {
            // Caso: option es un objeto SelectOption (con value y label)
            return (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            );
          }
        })}
      </select>
      {config.description && (
        <p className="mt-1 text-xs text-gray-500">{config.description}</p>
      )}
    </div>
  );
}; 