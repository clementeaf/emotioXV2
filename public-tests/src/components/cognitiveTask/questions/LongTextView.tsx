import React, { useState, useEffect } from 'react';
import QuestionHeader from '../common/QuestionHeader';
import TextAreaField from '../../common/TextAreaField';
import { useResponseAPI } from '../../../hooks/useResponseAPI';
import { useParticipantStore } from '../../../stores/participantStore';
import { useModuleResponses } from '../../../hooks/useModuleResponses';

interface LongTextViewProps {
  config: any;
  onStepComplete?: (answer?: any) => void;
}

export const LongTextView: React.FC<LongTextViewProps> = ({ config, onStepComplete }) => {
  const id = config?.id;
  const type = config?.type || 'long_text';
  const title = config?.title || 'Pregunta';
  const description = config?.description;
  const answerPlaceholder = config?.answerPlaceholder || 'Escribe tu respuesta detallada aquí...';
  const required = config?.required;

  // IDs globales
  const researchId = useParticipantStore(state => state.researchId) || '';
  const participantId = useParticipantStore(state => state.participantId) || '';

  // Cargar todas las respuestas previas
  const { data: moduleResponsesArray, isLoading } = useModuleResponses({ researchId, participantId, autoFetch: true });
  console.log('moduleResponsesArray:', moduleResponsesArray); 

  // Buscar la respuesta previa para este step (más robusto)
  const previousResponseObj = Array.isArray(moduleResponsesArray)
    ? moduleResponsesArray.find(
        (r: any) =>
          (r.stepType === config.type || r.stepType === config.stepType) &&
          (r.response?.questionId === id || r.stepId === id || r.stepTitle === title)
      )
    : undefined;

  const previousValue = previousResponseObj?.response?.value ?? '';

  // Estado local del textarea
  const [value, setValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo setear si el usuario no ha escrito nada
  useEffect(() => {
    if (previousValue && value === '') {
      setValue(previousValue);
    }
    // eslint-disable-next-line
  }, [previousValue, id]);

  // Logs para depuración
  useEffect(() => {
    console.log('[LongTextView] moduleResponsesArray:', moduleResponsesArray, 'id:', id, 'title:', title, 'type:', config.type, 'previousValue:', previousValue);
  }, [moduleResponsesArray, id, title, config.type, previousValue]);

  // API para guardar/actualizar
  const { saveOrUpdateResponse } = useResponseAPI({ researchId, participantId });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setError(null);
  };

  const handleSubmit = async () => {
    if (required && !value.trim()) {
      setError('Por favor, escribe una respuesta.');
      return;
    }
    setIsSubmitting(true);
    try {
      let result;
      if (previousResponseObj?.id) {
        // Actualizar respuesta existente
        result = await saveOrUpdateResponse(
          id,
          type,
          title,
          { value, questionId: id },
          previousResponseObj.id
        );
      } else {
        // Crear nueva respuesta
        result = await saveOrUpdateResponse(
          id,
          type,
          title,
          { value, questionId: id }
        );
      }
      setIsSubmitting(false);
      if (result && !result.error) {
        onStepComplete?.(result);
      } else {
        setError('Error guardando la respuesta. Intenta nuevamente.');
      }
    } catch (err) {
      setIsSubmitting(false);
      setError('Error guardando la respuesta. Intenta nuevamente.');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando respuesta previa...</div>;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full mx-auto">
      <QuestionHeader title={title} description={description} required={required} />
      <TextAreaField
        id={`long-text-${id}`}
        value={value}
        onChange={handleChange}
        placeholder={answerPlaceholder}
        disabled={isSubmitting}
      />
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      <button
        className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg mt-4"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {previousResponseObj?.id ? 'Actualizar y continuar' : 'Guardar y continuar'}
      </button>
    </div>
  );
}; 