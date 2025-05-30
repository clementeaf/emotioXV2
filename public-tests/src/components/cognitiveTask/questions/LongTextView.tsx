import React, { useState, useEffect } from 'react';
import { CognitiveQuestion } from '../../../hooks/useCognitiveTask';
import QuestionHeader from '../common/QuestionHeader';
import TextAreaField from '../../common/TextAreaField';
import { useResponseAPI } from '../../../hooks/useResponseAPI';
import { useParticipantStore } from '../../../stores/participantStore';

interface LongTextViewProps {
  config: CognitiveQuestion;
  onStepComplete?: (answer?: unknown) => void;
  // Nuevas props desde CurrentStepRenderer
  savedResponse?: { id?: string; response?: unknown } | null;
  savedResponseId?: string | null;
}

export const LongTextView: React.FC<LongTextViewProps> = ({ 
  config, 
  onStepComplete,
  savedResponse,
  savedResponseId,
}) => {
  const id = config.id || '';
  const type = config.type || 'long_text';
  const title = config.title || 'Pregunta';
  const description = config.description;
  const answerPlaceholder = config.answerPlaceholder || 'Escribe tu respuesta detallada aquí...';
  const required = config.required;

  // IDs globales
  const researchId = useParticipantStore(state => state.researchId) || '';
  const participantId = useParticipantStore(state => state.participantId) || '';

  // Obtener valor previo desde la respuesta pasada desde CurrentStepRenderer
  const previousValue = React.useMemo(() => {
    console.log('[LongTextView] Respuesta guardada recibida:', savedResponse);
    
    if (savedResponse?.response) {
      const response = savedResponse.response;
      
      // Intentar extraer el valor de diferentes estructuras posibles
      if (typeof response === 'object' && response !== null) {
        const respObj = response as Record<string, unknown>;
        if ('value' in respObj && typeof respObj.value === 'string') {
          return respObj.value;
        } else if ('text' in respObj && typeof respObj.text === 'string') {
          return respObj.text;
        } else if ('questionId' in respObj && 'value' in respObj && typeof respObj.value === 'string') {
          return respObj.value;
        }
      } else if (typeof response === 'string') {
        return response;
      }
    }
    
    return '';
  }, [savedResponse]);

  // Estado local del textarea
  const [value, setValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo setear si el usuario no ha escrito nada
  useEffect(() => {
    if (previousValue && value === '') {
      console.log('[LongTextView] Cargando valor previo:', previousValue);
      setValue(previousValue);
    }
  }, [previousValue, value]);

  // Logs para depuración
  useEffect(() => {
    console.log('[LongTextView] id:', id, 'title:', title, 'type:', config.type, 'previousValue:', previousValue);
  }, [id, title, config.type, previousValue]);

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
      if (savedResponseId) {
        // Actualizar respuesta existente
        result = await saveOrUpdateResponse(
          id,
          type,
          title,
          { value, questionId: id },
          savedResponseId
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
      if (result && typeof result === 'object' && result !== null && 'error' in result && !(result as { error?: unknown }).error) {
        onStepComplete?.(result);
      } else {
        setError('Error guardando la respuesta. Intenta nuevamente.');
      }
    } catch {
      setIsSubmitting(false);
      setError('Error guardando la respuesta. Intenta nuevamente.');
    }
  };

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
        {savedResponseId ? 'Actualizar y continuar' : 'Guardar y continuar'}
      </button>
    </div>
  );
}; 