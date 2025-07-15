import { useEffect, useState } from 'react';
import { useQuestionResponse } from '../../hooks/useQuestionResponse';
import { DemographicFormProps } from './types';

export function DemographicForm({ questions, previousResponse }: DemographicFormProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // NUEVO: Logs de debug
  console.log('[DemographicForm] Renderizando con:', { questions, previousResponse });

  const { response, hasResponse, saveResponse, updateResponse } = useQuestionResponse({
    questionKey: 'demographics',
    stepType: 'module_response',
    stepTitle: 'demographics',
    onResponseChange: (response) => {
      console.log('[DemographicForm] Respuesta cambiada:', response);
    }
  });

  // NUEVO: Log de debug para response
  console.log('[DemographicForm] Response del hook:', response, 'hasResponse:', hasResponse);

  useEffect(() => {
    // NUEVO: Manejar respuesta del nuevo hook con validaciones adicionales
    if (response && typeof response === 'object' && response !== null) {
      const responseData = response as Record<string, unknown>;
      const initialValues: Record<string, string> = {};

      // NUEVO: Validación adicional para asegurar que responseData sea un objeto válido
      if (responseData && typeof responseData === 'object') {
        Object.entries(responseData).forEach(([key, value]) => {
          if (typeof value === 'string' && key !== 'submitted' && key !== 'timestamp' && key !== 'stepType' && key !== 'stepTitle') {
            initialValues[key] = value;
          }
        });
      }

      setFormValues(initialValues);
      console.log('[DemographicForm] Valores cargados desde hook:', initialValues);
    } else if (previousResponse && typeof previousResponse === 'object' && previousResponse !== null) {
      // Fallback para respuesta previa con validación adicional
      const initialValues: Record<string, string> = {};

      // NUEVO: Validación adicional para asegurar que previousResponse sea un objeto válido
      if (previousResponse && typeof previousResponse === 'object') {
        Object.entries(previousResponse).forEach(([key, value]) => {
          if (typeof value === 'string' && key !== 'submitted' && key !== 'timestamp' && key !== 'stepType' && key !== 'stepTitle') {
            initialValues[key] = value;
          }
        });
      }

      setFormValues(initialValues);
      console.log('[DemographicForm] Valores cargados desde previousResponse:', initialValues);
    } else {
      setFormValues({});
      console.log('[DemographicForm] Sin valores previos, formulario vacío');
    }
  }, [response, previousResponse]);

  const handleInputChange = (key: string, value: string) => {
    const newValues = {
      ...formValues,
      [key]: value
    };

    setFormValues(newValues);

    // NUEVO: Solo actualizar el estado local, NO guardar automáticamente
    // El guardado se hará cuando el usuario haga click en el botón
    console.log('[DemographicForm] Valor cambiado:', key, value);
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
