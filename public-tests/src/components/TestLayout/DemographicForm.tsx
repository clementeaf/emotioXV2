import React, { useState } from 'react';
import { DemographicFormProps } from './types';

export const DemographicForm: React.FC<DemographicFormProps> = ({
  demographicQuestions,
  onSubmit
}) => {
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formValues);
    }
  };

  const questions = Object.entries(demographicQuestions)
    .filter(([_, questionData]) => questionData.enabled)
    .map(([key, questionData]) => ({
      key,
      enabled: questionData.enabled,
      required: questionData.required,
      options: questionData.options
    }));

  return (
    <div className='flex flex-col items-center justify-center h-full gap-10'>
      <div className='mb-2 text-center'>
        <h3 className='text-lg font-semibold mb-2'>Preguntas Demográficas</h3>
        <p className='text-sm text-gray-600'>Completa la información solicitada</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto flex flex-col gap-4">
        {questions.map(q => (
          <div key={q.key} className="flex flex-col">
            <label className="font-medium mb-1 text-gray-700">
              {q.key.charAt(0).toUpperCase() + q.key.slice(1)}
              {q.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              name={q.key}
              value={formValues[q.key] || ''}
              onChange={(e) => handleInputChange(q.key, e.target.value)}
              required={q.required}
              className="p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
            >
              <option value="">Selecciona una opción</option>
              {q.options.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ))}
      </form>
    </div>
  );
};
