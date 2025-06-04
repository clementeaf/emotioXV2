import React, { useState, useEffect } from 'react';
import { useParticipantStore } from '../../../stores/participantStore';
import { useModuleResponses } from '../../../hooks/useModuleResponses';
import { useResponseAPI } from '../../../hooks/useResponseAPI';
import { getStandardButtonText } from '../../../utils/formHelpers';

interface CVConfig {
  scaleRange?: { start: number; end: number };
  startLabel?: string;
  endLabel?: string;
}

interface CVQuestionConfig {
  id: string;
  title?: string;
  description?: string;
  type: string;
  config: CVConfig;
}

interface CVQuestionProps {
  questionConfig: CVQuestionConfig;
  researchId: string;
  moduleId: string;
  onSaveSuccess: (questionId: string, responseValue: number, moduleResponseId: string | null) => void;
}

export const CVQuestion: React.FC<CVQuestionProps> = ({
  questionConfig, 
  researchId,
  moduleId,
  onSaveSuccess 
}) => {
  const { id: questionId, description, type: questionType, title: questionTitleFromConfig, config: specificConfig } = questionConfig;
  const mainQuestionText = description || questionTitleFromConfig || '¿Cómo calificarías el valor recibido?';

  const scaleRange = specificConfig?.scaleRange || { start: 1, end: 7 };
  const leftLabel = specificConfig?.startLabel || "Poco valor";
  const rightLabel = specificConfig?.endLabel || "Mucho valor";

  const participantIdFromStore = useParticipantStore(state => state.participantId);

  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [internalModuleResponseId, setInternalModuleResponseId] = useState<string | null>(null);

  const {
    data: moduleResponsesArray,
    isLoading: isLoadingInitialData,
    error: loadingError
  } = useModuleResponses({
    researchId,
    participantId: participantIdFromStore || undefined,
    autoFetch: !!(researchId && participantIdFromStore)
  });

  const {
    saveOrUpdateResponse,
    isLoading: isSubmitting,
    error: submissionError,
    setError: setSubmissionError
  } = useResponseAPI({ researchId, participantId: participantIdFromStore || '' });

  useEffect(() => {
    if (!isLoadingInitialData && !loadingError && moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      const foundResponse = moduleResponsesArray.find((r: unknown) => {
        if (typeof r !== 'object' || r === null) return false;
        const resp = r as { 
          stepType?: unknown; 
          stepTitle?: unknown; 
          id?: unknown;
          stepId?: unknown; 
          moduleId?: unknown 
        };
        
        return (
          (resp.stepType === questionType && resp.moduleId === moduleId) ||
          (resp.stepId === questionId && resp.moduleId === moduleId) ||
          (resp.stepType === questionType) ||
          (typeof resp.stepTitle === 'string' && resp.stepTitle.includes(questionId)) ||
          (resp.id === questionId)
        );
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
        const responseValue = (foundResponse as { response: { value: number } }).response.value;
        console.log(`[CVQuestion] Cargando respuesta existente para ${questionId}:`, responseValue);
        setSelectedValue(responseValue);
        setInternalModuleResponseId(
          'id' in foundResponse && typeof (foundResponse as { id?: unknown }).id === 'string'
            ? (foundResponse as { id: string }).id
            : null
        );
      } else {
        console.log(`[CVQuestion] No se encontró respuesta previa para ${questionId}`);
        setSelectedValue(null);
        setInternalModuleResponseId(null);
      }
    }
  }, [moduleResponsesArray, isLoadingInitialData, loadingError, questionId, moduleId, questionType]);

  const handleSelect = (value: number) => {
    setSelectedValue(value);
    if (submissionError) setSubmissionError(null);
  };

  const handleSaveOrUpdateClick = async () => {
    if (!participantIdFromStore || participantIdFromStore.trim() === '') {
      setSubmissionError("Error: participantIdFromStore vacío.");
      return;
    }
    if (selectedValue === null) {
      setSubmissionError("Por favor, selecciona una opción.");
      return;
    }

    const responseData = { value: selectedValue };
    const stepNameForApi = questionTitleFromConfig || description || questionId;

    const result = await saveOrUpdateResponse(
      questionId,
      questionType,
      stepNameForApi,
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
      setSubmissionError("Ocurrió un error desconocido al guardar la respuesta (CVQuestion).");
    }
  };

  const scaleOptions: number[] = [];
  for (let i = scaleRange.start; i <= scaleRange.end; i++) {
    scaleOptions.push(i);
  }
  if (scaleOptions.length === 0) {
    console.warn(`[CVQuestion] scaleOptions vacío para ${questionId}, usando 1-7 por defecto.`);
    for (let i = 1; i <= 7; i++) { scaleOptions.push(i); }
  }
  
  const buttonText = getStandardButtonText({
    isSaving: isSubmitting,
    isLoading: isLoadingInitialData,
    hasExistingData: !!internalModuleResponseId && selectedValue !== null
  });

  if (isLoadingInitialData && !moduleResponsesArray) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
        <p>Cargando pregunta CV...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">
          {mainQuestionText}
        </h2>
        
        {(submissionError || loadingError) && (
          <p className="text-sm text-red-600 my-2 text-center">Error: {submissionError || loadingError}</p>
        )}

        <div className="flex justify-center gap-2 mb-4">
          {scaleOptions.map((value) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={isSubmitting || isLoadingInitialData}
              className={`w-9 h-9 rounded-full border flex items-center justify-center font-medium transition-colors ${ 
                selectedValue === value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
              } ${(isSubmitting || isLoadingInitialData) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="flex justify-between w-full mt-2 px-1 max-w-xs sm:max-w-sm">
          <span className="text-xs text-neutral-500">{leftLabel}</span>
          <span className="text-xs text-neutral-500">{rightLabel}</span>
        </div>

        <button
          className="mt-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSaveOrUpdateClick}
          disabled={selectedValue === null || isSubmitting || isLoadingInitialData}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}; 