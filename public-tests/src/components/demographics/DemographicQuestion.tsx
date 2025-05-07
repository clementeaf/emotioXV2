import React from 'react';
import { DemographicConfig, SelectOption, GENDER_OPTIONS, EDUCATION_OPTIONS } from '../../types/demographics';

interface DemographicQuestionProps {
  config: DemographicConfig;
  value: any;
  onChange: (id: string, value: any) => void;
}

// Componente base para todas las preguntas demográficas
export const DemographicQuestion: React.FC<DemographicQuestionProps> = ({ 
  config, 
  value, 
  onChange 
}) => {
  // Si la pregunta no está habilitada, no mostrar nada
  if (!config.enabled) return null;

  // Renderizar el tipo de input según el ID de la pregunta
  switch (config.id) {
    case 'age':
      return <AgeQuestion config={config} value={value} onChange={onChange} />;
    case 'gender':
      return <GenderQuestion config={config} value={value} onChange={onChange} />;
    case 'education':
      return <EducationQuestion config={config} value={value} onChange={onChange} />;
    case 'occupation':
      return <TextQuestion config={config} value={value} onChange={onChange} />;
    case 'income':
      return <IncomeQuestion config={config} value={value} onChange={onChange} />;
    case 'location':
      return <TextQuestion config={config} value={value} onChange={onChange} />;
    case 'ethnicity':
      return <TextQuestion config={config} value={value} onChange={onChange} />;
    case 'language':
      return <TextQuestion config={config} value={value} onChange={onChange} />;
    default:
      return <TextQuestion config={config} value={value} onChange={onChange} />;
  }
};

// Componente para pregunta de edad
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
        value={value || ''}
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

// Componente para pregunta de género
export const GenderQuestion: React.FC<DemographicQuestionProps> = ({ 
  config, 
  value, 
  onChange 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(config.id, e.target.value);
  };

  return (
    <div className="mb-4">
      <label htmlFor={config.id} className="block text-sm font-medium text-gray-700 mb-1">
        {config.title || 'Género'} {config.required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={config.id}
        value={value || ''}
        onChange={handleChange}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        required={config.required}
      >
        <option value="">Selecciona una opción</option>
        {GENDER_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {config.description && (
        <p className="mt-1 text-xs text-gray-500">{config.description}</p>
      )}
    </div>
  );
};

// Componente para pregunta de educación
export const EducationQuestion: React.FC<DemographicQuestionProps> = ({ 
  config, 
  value, 
  onChange 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(config.id, e.target.value);
  };

  return (
    <div className="mb-4">
      <label htmlFor={config.id} className="block text-sm font-medium text-gray-700 mb-1">
        {config.title || 'Nivel educativo'} {config.required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={config.id}
        value={value || ''}
        onChange={handleChange}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        required={config.required}
      >
        <option value="">Selecciona una opción</option>
        {EDUCATION_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {config.description && (
        <p className="mt-1 text-xs text-gray-500">{config.description}</p>
      )}
    </div>
  );
};

// Componente para pregunta de ingresos
export const IncomeQuestion: React.FC<DemographicQuestionProps> = ({ 
  config, 
  value, 
  onChange 
}) => {
  const incomeOptions: SelectOption[] = [
    { value: 'below_20k', label: 'Menos de $20,000' },
    { value: '20k_40k', label: '$20,000 - $40,000' },
    { value: '40k_60k', label: '$40,000 - $60,000' },
    { value: '60k_80k', label: '$60,000 - $80,000' },
    { value: '80k_100k', label: '$80,000 - $100,000' },
    { value: 'above_100k', label: 'Más de $100,000' },
    { value: 'prefer_not_to_say', label: 'Prefiero no decirlo' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(config.id, e.target.value);
  };

  return (
    <div className="mb-4">
      <label htmlFor={config.id} className="block text-sm font-medium text-gray-700 mb-1">
        {config.title || 'Nivel de ingresos'} {config.required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={config.id}
        value={value || ''}
        onChange={handleChange}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        required={config.required}
      >
        <option value="">Selecciona una opción</option>
        {incomeOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {config.description && (
        <p className="mt-1 text-xs text-gray-500">{config.description}</p>
      )}
    </div>
  );
};

// Componente genérico para preguntas de texto
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
        value={value || ''}
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