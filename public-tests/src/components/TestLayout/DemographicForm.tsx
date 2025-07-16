import React, { useEffect, useState } from 'react';
import { useModuleResponsesQuery } from '../../hooks/useApiQueries';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useTestStore } from '../../stores/useTestStore';
import { DemographicFormProps } from './types';

export const DemographicForm: React.FC<DemographicFormProps> = ({
  demographicQuestions,
  onSubmit
}) => {
  const { setFormData, getFormData, formData } = useFormDataStore();
  const { researchId, participantId } = useTestStore();
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Query para obtener respuestas existentes del backend
  const { data: moduleResponses } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  useEffect(() => {
    // Buscar respuesta existente para demographics en el backend
    if (moduleResponses?.responses && Array.isArray(moduleResponses.responses)) {
      const demographicsResponse = (moduleResponses.responses as any[]).find(
        (response: any) => response.questionKey === 'demographics'
      );

      if (demographicsResponse?.response) {
        setFormValues(demographicsResponse.response as Record<string, string>);
        // También guardar en el store local para persistencia
        setFormData('demographics', demographicsResponse.response as Record<string, string>);
        return;
      }
    }

    // Si no hay datos en el backend, cargar del store local
    const existingData = getFormData('demographics');
    if (existingData && Object.keys(existingData).length > 0) {
      setFormValues(existingData as Record<string, string>);
    }
  }, [moduleResponses, getFormData, setFormData]);

  // Efecto para detectar cuando se limpia el store y resetear el estado local
  useEffect(() => {
    const demographicsData = formData['demographics'];
    if (!demographicsData || Object.keys(demographicsData).length === 0) {
      console.log('[DemographicForm] Store limpiado, reseteando estado local');
      setFormValues({});
    }
  }, [formData]);

  const handleInputChange = (key: string, value: string) => {
    const newValues = {
      ...formValues,
      [key]: value
    };
    setFormValues(newValues);

    // Guardar en el store
    setFormData('demographics', newValues);
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
