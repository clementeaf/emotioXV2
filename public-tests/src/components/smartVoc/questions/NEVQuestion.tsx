import React, { useState, useEffect } from 'react';
import { useParticipantStore } from '../../../stores/participantStore';
import { useModuleResponses } from '../../../hooks/useModuleResponses';
import { useResponseAPI } from '../../../hooks/useResponseAPI';

interface NEVQuestionConfig {
  id: string;
  title?: string;
  description?: string;
  required?: boolean;
  type?: string;
}

interface NEVQuestionProps {
  questionConfig: NEVQuestionConfig;
  researchId: string;
  moduleId: string;
  onSaveSuccess: (questionId: string, value: number, moduleResponseId: string | null) => void;
}

const emojiOptions = [
  { value: 'negative', label: '😞', numValue: -1 },
  { value: 'neutral', label: '😐', numValue: 0 },
  { value: 'positive', label: '😊', numValue: 1 },
];

export const NEVQuestion: React.FC<NEVQuestionProps> = ({ questionConfig, researchId, moduleId, onSaveSuccess }) => {
  const { id: questionId, description, type: questionType, title: questionTitle } = questionConfig;
  const participantId = useParticipantStore(state => state.participantId);

  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [internalModuleResponseId, setInternalModuleResponseId] = useState<string | null>(null);

  const {
    data: moduleResponsesArray,
    isLoading: isLoadingInitialData,
    error: loadingError
  } = useModuleResponses({
    researchId,
    participantId: participantId || undefined,
    autoFetch: !!(researchId && participantId)
  });

  const {
    saveOrUpdateResponse,
    isLoading: isSubmitting,
    error: submissionError,
    setError: setSubmissionError
  } = useResponseAPI({ researchId, participantId: participantId || '' });

  // Cargar valor inicial desde la API
  useEffect(() => {
    if (!isLoadingInitialData && !loadingError && moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      const foundResponse = moduleResponsesArray.find((r: unknown) => {
        if (typeof r !== 'object' || r === null) return false;
        const resp = r as { stepId?: unknown; moduleId?: unknown };
        return resp.stepId === questionId && resp.moduleId === moduleId;
      });
      if (
        foundResponse &&
        typeof foundResponse === 'object' &&
        foundResponse !== null &&
        'response' in foundResponse &&
        typeof (foundResponse as { response?: unknown }).response === 'object' &&
        (foundResponse as { response?: { value?: unknown } }).response !== null &&
        typeof (foundResponse as { response?: { value?: unknown } }).response?.value === 'number'
      ) {
        setSelectedValue((foundResponse as { response: { value: number } }).response.value);
        setInternalModuleResponseId(
          'id' in foundResponse && typeof (foundResponse as { id?: unknown }).id === 'string'
            ? (foundResponse as { id: string }).id
            : null
        );
      } else {
        setSelectedValue(null);
        setInternalModuleResponseId(null);
      }
    }
  }, [moduleResponsesArray, isLoadingInitialData, loadingError, questionId, moduleId]);

  const handleSelect = (numValue: number) => {
    setSelectedValue(numValue);
    if (submissionError) setSubmissionError(null);
  };

  const handleSaveOrUpdateClick = async () => {
    if (!participantId || participantId.trim() === '') {
      setSubmissionError('Error: participantId vacío.');
      return;
    }
    if (selectedValue === null) {
      setSubmissionError('Por favor, selecciona una opción.');
      return;
    }
    const responseData = { value: selectedValue };
    const result = await saveOrUpdateResponse(
      questionId,
      questionType || '',
      questionTitle || description || questionId,
      responseData,
      internalModuleResponseId || undefined,
      moduleId
    );
    if (result && !submissionError) {
      let newId: string | null = null;
      if (
        typeof result === 'object' &&
        result !== null &&
        'id' in result &&
        typeof (result as { id?: unknown }).id === 'string'
      ) {
        newId = (result as { id: string }).id;
        if (!internalModuleResponseId) {
          setInternalModuleResponseId(newId);
        }
      }
      onSaveSuccess(questionId, selectedValue, newId || internalModuleResponseId || null);
    } else if (!result && !submissionError) {
      setSubmissionError('Ocurrió un error desconocido al guardar.');
    }
  };

  let buttonText = 'Guardar y continuar';
  if (isSubmitting) {
    buttonText = 'Enviando...';
  } else if (internalModuleResponseId) {
    buttonText = 'Actualizar y continuar';
  }

  if (!description) {
    return <div className="text-red-600">Error: Falta la descripción de la pregunta.</div>;
  }

  if (isLoadingInitialData) {
    return <div className="p-4 text-center text-gray-500">Cargando pregunta...</div>;
  }

  return (
    <div className="space-y-4 flex flex-col items-center w-full">
      <p className="text-base md:text-lg font-medium text-gray-800">{description}</p>
      <div className="flex justify-center gap-4 md:gap-6">
        {emojiOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.numValue)}
            className={`p-2 rounded-full transition-all duration-150 ease-in-out 
              ${selectedValue === option.numValue 
                ? 'bg-blue-100 ring-2 ring-blue-500 scale-110' 
                : 'bg-gray-100 hover:bg-gray-200'
              }`}
            aria-label={`Seleccionar ${option.value}`}
            disabled={isSubmitting || isLoadingInitialData}
          >
            <span className="text-3xl md:text-4xl">{option.label}</span>
          </button>
        ))}
      </div>
      {(submissionError || loadingError) && (
        <p className="text-sm text-red-600 my-2 text-center">Error: {submissionError || loadingError}</p>
      )}
      <button
        className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSaveOrUpdateClick}
        disabled={isSubmitting || isLoadingInitialData || selectedValue === null}
      >
        {buttonText}
      </button>
    </div>
  );
}; 