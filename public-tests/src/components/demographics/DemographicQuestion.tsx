import React from 'react';
import { DemographicQuestionProps } from './types';
import { GenericSelectQuestion } from './GenericSelectQuestion';

export const DemographicQuestion: React.FC<DemographicQuestionProps> = ({ 
  config, 
  value, 
  onChange 
}) => {
  console.log(`🔍 [DemographicQuestion] Rendering question:`, {
    id: config.id,
    enabled: config.enabled,
    required: config.required,
    title: config.title,
    currentValue: value,
    hasOptions: !!config.options,
    optionsCount: config.options?.length || 0
  });

  if (!config.enabled) {
    console.log(`⏭️ [DemographicQuestion] Question ${config.id} is disabled, skipping render`);
    return null;
  }

  switch (config.id) {
    case 'age':
      return <AgeQuestion config={config} value={value} onChange={onChange} />;
    case 'gender':
    case 'education':
    case 'educationLevel':
      if (Array.isArray(config.options) && config.options.length > 0) {
        return <GenericSelectQuestion config={config} value={typeof value === 'boolean' ? undefined : value} onChange={onChange} />;
      }
      console.warn(`Pregunta de tipo select (id: '${config.id}') esperaba opciones pero no las encontró. Usando TextQuestion.`);
      return <TextQuestion config={config} value={value} onChange={onChange} />;
    case 'occupation':
      return <TextQuestion config={config} value={value} onChange={onChange} />;
    case 'income': 
    case 'householdIncome':
      if (Array.isArray(config.options) && config.options.length > 0) {
        return <GenericSelectQuestion config={config} value={typeof value === 'boolean' ? undefined : value} onChange={onChange} />;
      }
      console.warn(`Pregunta de ingresos (id: '${config.id}') esperaba opciones pero no las encontró. Usando TextQuestion.`);
      return <TextQuestion config={config} value={value} onChange={onChange} />;
    case 'location':
    case 'ethnicity':
    case 'language':
    case 'country':
    case 'employmentStatus':
    case 'dailyHoursOnline':
    case 'technicalProficiency':
      if (Array.isArray(config.options) && config.options.length > 0) {
        return <GenericSelectQuestion config={config} value={typeof value === 'boolean' ? undefined : value} onChange={onChange} />;
      }
      return <TextQuestion config={config} value={value} onChange={onChange} />;
    default:
      console.warn(`Pregunta demográfica con id no reconocido: '${config.id}'.`);
      if (Array.isArray(config.options) && config.options.length > 0) {
        return <GenericSelectQuestion config={config} value={typeof value === 'boolean' ? undefined : value} onChange={onChange} />;
      }
      return <TextQuestion config={config} value={value} onChange={onChange} />;
  }
};

export const AgeQuestion: React.FC<DemographicQuestionProps> = ({ 
  config, 
  value, 
  onChange 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(config.id, e.target.value);
  };

  return (
    <div className="mb-4">
      <label htmlFor={config.id} className="block text-sm font-medium text-gray-700 mb-1">
        {config.title || 'Edad'} {config.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="number"
        id={config.id}
        value={typeof value === 'boolean' ? '' : value || ''}
        onChange={handleChange}
        min="0"
        max="120"
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        required={config.required}
        placeholder="Ingresa tu edad"
      />
      {config.description && (
        <p className="mt-1 text-xs text-gray-500">{config.description}</p>
      )}
    </div>
  );
};

export const TextQuestion: React.FC<DemographicQuestionProps> = ({ 
  config, 
  value, 
  onChange 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(config.id, e.target.value);
  };

  return (
    <div className="mb-4">
      <label htmlFor={config.id} className="block text-sm font-medium text-gray-700 mb-1">
        {config.title} {config.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        id={config.id}
        value={typeof value === 'boolean' ? '' : value || ''}
        onChange={handleChange}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        required={config.required}
        placeholder={`Ingresa tu ${config.title?.toLowerCase() || 'respuesta'}`}
      />
      {config.description && (
        <p className="mt-1 text-xs text-gray-500">{config.description}</p>
      )}
    </div>
  );
}; 