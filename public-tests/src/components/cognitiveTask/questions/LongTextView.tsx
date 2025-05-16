import React, { useState, useEffect } from 'react';
import QuestionHeader from '../common/QuestionHeader';
import TextAreaField from '../../common/TextAreaField';
import { useResponseAPI } from '../../../hooks/useResponseAPI';
import { useParticipantStore } from '../../../stores/participantStore';
import { useModuleResponses } from '../../../hooks/useModuleResponses';

interface LongTextViewProps {
  config: any;
  value?: string;
  onChange: (questionId: string, value: string) => void;
  onStepComplete?: (answer: any) => void;
}

export const LongTextView: React.FC<LongTextViewProps> = ({ config, value: valueProp, onChange, onStepComplete }) => {
  const id = config?.id;
  const title = config?.title;
  const description = config?.description;
  const answerPlaceholder = config?.answerPlaceholder;
  const required = config?.required;
  const type = config?.type || 'long_text';
  const moduleId = config?.moduleId;

  const researchId = useParticipantStore(state => state.researchId) || '';
  const participantId = useParticipantStore(state => state.participantId) || '';

  // Cargar respuesta previa
  const { data: moduleResponsesArray, isLoading: isLoadingInitialData, error: loadingError } = useModuleResponses({
    researchId,
    participantId,
    autoFetch: true
  });

  const [textValue, setTextValue] = useState<string>('');
  const [internalModuleResponseId, setInternalModuleResponseId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    saveOrUpdateResponse,
    isLoading: isSubmitting,
    error: submissionError,
    setError: setSubmissionError
  } = useResponseAPI({ researchId, participantId });

  // Cargar respuesta previa al montar
  useEffect(() => {
    if (!isLoadingInitialData && Array.isArray(moduleResponsesArray)) {
      const found = moduleResponsesArray.find((r: any) => r.stepId === id);
      let value = '';
      if (found) {
        if (found.response?.data?.response?.value !== undefined) {
          value = found.response.data.response.value;
        } else if (found.response?.value !== undefined) {
          value = found.response.value;
        } else if (typeof found.response === 'string') {
          value = found.response;
        }
        setTextValue(value);
        setInternalModuleResponseId(found.id || null);
      } else {
        setTextValue('');
        setInternalModuleResponseId(null);
      }
    }
  }, [isLoadingInitialData, moduleResponsesArray, id]);

  // Sincronizar con prop externa si cambia
  useEffect(() => {
    if (valueProp !== undefined) setTextValue(valueProp);
  }, [valueProp]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextValue(e.target.value);
    setLocalError(null);
    if (submissionError) setSubmissionError(null);
    onChange(id, e.target.value);
  };

  const handleSubmit = async () => {
    setLocalError(null);
    if (!participantId || participantId.trim() === '') {
      setLocalError('Error: participantId vacío.');
      return;
    }
    if (required && !textValue.trim()) {
      setLocalError('Por favor, escribe una respuesta.');
      return;
    }
    const responseData = { value: textValue };
    const moduleIdForApi = moduleId;
    let result;
    if (internalModuleResponseId) {
      // Actualizar (PUT)
      result = await saveOrUpdateResponse(
        id,
        type,
        title || id,
        responseData,
        internalModuleResponseId,
        moduleIdForApi
      );
    } else {
      // Crear (POST)
      result = await saveOrUpdateResponse(
        id,
        type,
        title || id,
        responseData,
        undefined,
        moduleIdForApi
      );
    }
    if (result && result.id) {
      setInternalModuleResponseId(result.id);
      if (onStepComplete) onStepComplete({ success: true, data: result, value: textValue });
    } else if (!result && !submissionError) {
      setLocalError('Ocurrió un error desconocido al guardar.');
    }
  };

  let buttonText = 'Siguiente';
  if (isSubmitting) {
    buttonText = 'Enviando...';
  } else if (internalModuleResponseId) {
    buttonText = 'Actualizar y continuar';
  } else {
    buttonText = 'Guardar y continuar';
  }

  if (isLoadingInitialData) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
        <p>Cargando datos de la pregunta...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-2xl w-full flex flex-col items-center">
        <QuestionHeader
          title={title}
          description={description}
          required={required}
        />
        <TextAreaField
          id={`long-text-${id}`}
          label={title || description || 'Respuesta de texto largo'}
          value={textValue}
          onChange={handleChange}
          placeholder={answerPlaceholder || 'Escribe tu respuesta detallada aquí...'}
          required={required}
          disabled={isSubmitting || isLoadingInitialData}
        />
        {(localError || submissionError || loadingError) && (
          <p className="text-sm text-red-600 mb-4 text-center">
            Error: {localError || submissionError || loadingError}
          </p>
        )}
        <button
          className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={isSubmitting || isLoadingInitialData}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}; 