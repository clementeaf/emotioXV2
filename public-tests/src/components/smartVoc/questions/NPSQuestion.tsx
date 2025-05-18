import React, { useState, useEffect } from 'react';
import { useParticipantStore } from '../../../stores/participantStore';
import { useModuleResponses } from '../../../hooks/useModuleResponses';
import { useResponseAPI } from '../../../hooks/useResponseAPI';

interface NPSConfig {
  scaleRange?: { start: number; end: number };
  startLabel?: string;
  endLabel?: string;
}

interface NPSQuestionProps {
  questionConfig: { id: string; description?: string; type: string; title?: string; config: NPSConfig };
  researchId: string;
  moduleId: string;
  onSaveSuccess: (questionId: string, responseValue: number, moduleResponseId: string | null) => void;
}

export const NPSQuestion: React.FC<NPSQuestionProps> = ({
  questionConfig, 
  researchId,
  moduleId,
  onSaveSuccess 
}) => {
  const { id: questionId, description, type: questionType, title: questionTitle, config } = questionConfig;
  const { scaleRange, startLabel, endLabel } = config; 

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

  useEffect(() => {
    if (!isLoadingInitialData && !loadingError && moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      const foundResponse = moduleResponsesArray.find((r: unknown) => {
        if (typeof r !== 'object' || r === null) return false;
        const resp = r as { stepId?: unknown; moduleId?: unknown };
        return resp.stepId === questionId && resp.moduleId === moduleId;
      });
      if (foundResponse && typeof foundResponse === 'object' && foundResponse !== null) {
        let value: number | null = null;
        if (
          typeof (foundResponse as { response?: unknown }).response === 'number'
        ) {
          value = (foundResponse as { response: number }).response;
        } else if (
          typeof (foundResponse as { response?: unknown }).response === 'object' &&
          (foundResponse as { response?: { value?: unknown } }).response !== null &&
          typeof (foundResponse as { response?: { value?: unknown } }).response?.value === 'number'
        ) {
          value = (foundResponse as { response: { value: number } }).response?.value;
        }
        if (value !== null) {
          setSelectedValue(value);
        }
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

  const handleScaleSelection = (valueToSelect: number) => {
    setSelectedValue(valueToSelect);
    if (submissionError) setSubmissionError(null);
  };

  const handleSaveOrUpdateClick = async () => {
    if (selectedValue === null) {
      setSubmissionError("Por favor, selecciona un valor en la escala.");
      return;
    }
    if (!participantId) {
      setSubmissionError("Error: Participant ID no disponible.");
      return;
    }
    const responseData = { value: selectedValue };
    const result = await saveOrUpdateResponse(
      questionId, 
      questionType, 
      questionTitle || description || questionId, 
      responseData,
      internalModuleResponseId === null ? undefined : internalModuleResponseId
    );
    if (result && !submissionError) {
      let newModuleResponseId: string | null = null;
      if (
        typeof result === 'object' &&
        result !== null &&
        'id' in result &&
        typeof (result as { id?: unknown }).id === 'string'
      ) {
        newModuleResponseId = (result as { id: string }).id;
        if (newModuleResponseId !== internalModuleResponseId) {
          setInternalModuleResponseId(newModuleResponseId);
        }
      }
      onSaveSuccess(questionId, selectedValue, newModuleResponseId);
    } else if (!result && !submissionError) {
      setSubmissionError("Ocurrió un error desconocido al guardar.");
    }
  };

  const scaleOptions: number[] = [];
  const defaultNPSScale = { start: 0, end: 10 };
  const currentScaleRange = (scaleRange && typeof scaleRange.start === 'number' && typeof scaleRange.end === 'number') 
                            ? scaleRange 
                            : defaultNPSScale;

  for (let i = currentScaleRange.start; i <= currentScaleRange.end; i++) {
    scaleOptions.push(i);
  }
  if (!(scaleRange && typeof scaleRange.start === 'number' && typeof scaleRange.end === 'number')){
      console.warn(`[NPSQuestion] scaleRange no definido correctamente para ${questionId}, usando ${defaultNPSScale.start}-${defaultNPSScale.end} por defecto.`);
  }
  
  let buttonText = 'Siguiente';
  if (isSubmitting) {
    buttonText = 'Enviando...';
  } else if (internalModuleResponseId) {
    buttonText = 'Actualizar y continuar';
  } else {
    buttonText = 'Guardar y continuar';
  }

  if (isLoadingInitialData && !moduleResponsesArray) {
    return <div className="p-4 text-center text-gray-500">Cargando pregunta NPS...</div>;
  }

  return (
    <div className="space-y-4 flex flex-col items-center">
      <p className="text-base md:text-lg font-medium text-gray-800 text-center">{description || questionTitle || '¿Qué tan probable es que recomiendes...?'} </p>
      
      {(submissionError || loadingError) && (
          <p className="text-sm text-red-600 my-2 text-center">Error: {submissionError || loadingError}</p>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-lg">
        {startLabel && <span className="text-sm text-gray-600">{startLabel}</span>}
        
        <div className="flex flex-wrap justify-center gap-1 p-1 md:gap-2 md:p-2">
          {scaleOptions.map((optionValue) => (
            <label 
              key={optionValue}
              className={`relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full cursor-pointer transition-colors duration-150 ease-in-out 
                ${selectedValue === optionValue 
                  ? 'bg-blue-600 text-white shadow-md scale-105' 
                  : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-300'
                } ${isSubmitting || isLoadingInitialData ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name={`scale-${questionId}`}
                value={optionValue}
                checked={selectedValue === optionValue}
                onChange={() => handleScaleSelection(optionValue)}
                disabled={isSubmitting || isLoadingInitialData}
                className="absolute opacity-0 w-0 h-0"
              />
              <span className="text-xs md:text-sm font-medium">{optionValue}</span>
            </label>
          ))}
        </div>

        {endLabel && <span className="text-sm text-gray-600">{endLabel}</span>}
      </div>
      
      <button
        onClick={handleSaveOrUpdateClick}
        disabled={selectedValue === null || isSubmitting || isLoadingInitialData}
        className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonText}
      </button>

      {(startLabel || endLabel) && (
           <div className="w-full flex justify-between text-xs text-gray-500 sm:hidden mt-2 max-w-lg">
               <span>{startLabel || ''}</span>
               <span>{endLabel || ''}</span>
           </div>
       )}
    </div>
  );
}; 