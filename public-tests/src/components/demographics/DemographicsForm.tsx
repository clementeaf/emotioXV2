import React, { useState, useEffect } from 'react';
import { 
  DemographicsSection, 
  DemographicConfig, 
  DemographicResponses,
  DEFAULT_DEMOGRAPHICS_CONFIG
} from '../../types/demographics';
import { DemographicQuestion } from './DemographicQuestion';

interface DemographicsFormProps {
  config?: DemographicsSection;
  initialValues?: DemographicResponses;
  onSubmit: (responses: DemographicResponses) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const DemographicsForm: React.FC<DemographicsFormProps> = ({
  config = DEFAULT_DEMOGRAPHICS_CONFIG,
  initialValues = {},
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [responses, setResponses] = useState<DemographicResponses>(initialValues);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Si la configuración cambia, actualizar las respuestas para mantener solo campos relevantes
  useEffect(() => {
    const updatedResponses: DemographicResponses = {};
    
    // Mantener solo las respuestas de preguntas habilitadas
    Object.entries(config.questions).forEach(([key, questionConfig]) => {
      if (questionConfig.enabled && responses[key] !== undefined) {
        updatedResponses[key] = responses[key];
      }
    });
    
    setResponses(updatedResponses);
  }, [config]);

  // Función para manejar cambios en las respuestas
  const handleChange = (id: string, value: any) => {
    setResponses(prev => ({ ...prev, [id]: value }));
    
    // Limpiar error si el campo ahora tiene valor
    if (value && formErrors[id]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  // Función para validar el formulario antes de enviar
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Verificar si todos los campos requeridos tienen valor
    Object.entries(config.questions).forEach(([key, questionConfig]) => {
      if (questionConfig.enabled && questionConfig.required && !responses[key]) {
        errors[key] = `El campo ${questionConfig.title || key} es obligatorio.`;
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(responses);
    }
  };

  // Si la sección no está habilitada, no mostrar nada
  if (!config.enabled) {
    return null;
  }

  // Obtener solo las preguntas habilitadas y ordenarlas si tienen orden
  const enabledQuestions = Object.entries(config.questions)
    .filter(([_, questionConfig]) => questionConfig.enabled)
    .sort(([_, a], [__, b]) => {
      // Ordenar por la propiedad order si existe, de lo contrario mantener el orden original
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return 0;
    })
    .map(([key, questionConfig]) => ({ key, config: questionConfig }));

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">{config.title}</h2>
      {config.description && (
        <p className="text-gray-600 text-center mb-6">{config.description}</p>
      )}
      
      <form onSubmit={handleSubmit}>
        {enabledQuestions.map(({ key, config: questionConfig }) => (
          <div key={key} className={formErrors[key] ? 'has-error' : ''}>
            <DemographicQuestion
              config={questionConfig}
              value={responses[key]}
              onChange={handleChange}
            />
            {formErrors[key] && (
              <p className="text-red-500 text-xs mt-1">{formErrors[key]}</p>
            )}
          </div>
        ))}
        
        <div className="flex justify-between mt-8">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Continuar'}
          </button>
        </div>
      </form>
    </div>
  );
}; 