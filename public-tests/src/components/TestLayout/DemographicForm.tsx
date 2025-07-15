import { useEffect, useState } from 'react';
import { useQuestionResponse } from '../../hooks/useQuestionResponse';
import { DemographicFormProps } from './types';

export function DemographicForm({ questions, previousResponse }: DemographicFormProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const { response } = useQuestionResponse({
    questionKey: 'demographics',
    stepType: 'module_response',
    stepTitle: 'demographics'
  });

  useEffect(() => {
    // Cargar valores desde la respuesta del hook o respuesta previa
    const sourceData = response || previousResponse;

    if (sourceData && typeof sourceData === 'object') {
      const initialValues: Record<string, string> = {};

      Object.entries(sourceData).forEach(([key, value]) => {
        if (typeof value === 'string' && !['submitted', 'timestamp', 'stepType', 'stepTitle'].includes(key)) {
          initialValues[key] = value;
        }
      });

      setFormValues(initialValues);
    } else {
      setFormValues({});
    }
  }, [response, previousResponse]);

  const handleInputChange = (key: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
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
  );
}
