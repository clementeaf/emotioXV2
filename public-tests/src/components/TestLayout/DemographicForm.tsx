import { useEffect, useState } from 'react';
import { DemographicFormProps } from './types';

export function DemographicForm({ questions, previousResponse }: DemographicFormProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    console.log('[DemographicForm] previousResponse recibido:', previousResponse);

    if (previousResponse) {
      const initialValues: Record<string, string> = {};

      Object.entries(previousResponse).forEach(([key, value]) => {
        console.log(`[DemographicForm] Procesando campo: ${key} = ${value} (tipo: ${typeof value})`);
        if (typeof value === 'string' && key !== 'submitted' && key !== 'timestamp' && key !== 'stepType' && key !== 'stepTitle') {
          initialValues[key] = value;
          console.log(`[DemographicForm] ✅ Campo válido agregado: ${key} = ${value}`);
        }
      });

      console.log('[DemographicForm] Valores iniciales:', initialValues);
      setFormValues(initialValues);
    } else {
      console.log('[DemographicForm] No hay previousResponse');
      setFormValues({});
    }
  }, [previousResponse]);

  const handleInputChange = (key: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  console.log('[DemographicForm] Renderizando con formValues:', formValues);

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
            {/* Debug info */}
            <small className="text-xs text-gray-500">
              Valor actual: {formValues[q.key] || 'vacío'}
            </small>
          </div>
        ) : null
      )}
    </form>
  );
}
