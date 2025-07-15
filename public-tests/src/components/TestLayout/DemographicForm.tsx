import React, { useState } from 'react';
import { DemographicQuestion } from './types';

interface DemographicFormProps {
  questions: DemographicQuestion[];
}

export const DemographicForm: React.FC<DemographicFormProps> = ({ questions }) => {
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className='flex flex-col items-center justify-center h-full gap-10'>
      <div className='mb-2 text-center'>
        <h3 className='text-lg font-semibold mb-2'>Preguntas Demográficas</h3>
        <p className='text-sm text-gray-600'>Completa la información solicitada</p>
      </div>

      <form className="w-full max-w-lg mx-auto flex flex-col gap-4">
        {questions.map(q =>
          q.enabled ? (
            <div key={q.key} className="flex flex-col">
              <label className="font-medium mb-1 text-gray-700">{q.key}</label>
              <select
                name={q.key}
                value={formValues[q.key] || ''}
                onChange={(e) => handleInputChange(q.key, e.target.value)}
                required={q.required}
                className="p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              >
                <option value="">Selecciona una opción</option>
                {q.options.map((opt, i) =>
                  typeof opt === 'string'
                    ? <option key={i} value={opt}>{opt}</option>
                    : <option key={i} value={opt.value}>{opt.label}</option>
                )}
              </select>
            </div>
          ) : null
        )}
      </form>
    </div>
  );
};
