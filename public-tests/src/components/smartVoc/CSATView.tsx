import React, { useState, useEffect } from 'react';
import { useResponseAPI } from '../../hooks/useResponseAPI';
import { useParticipantStore } from '../../stores/participantStore';
import { useModuleResponses } from '../../hooks/useModuleResponses';

interface CSATViewProps {
  questionText: string;
  researchId: string;
  token: string | null;
  stepId: string;
  stepName: string;
  stepType: string;
  onStepComplete: (data?: unknown) => void;
  instructions?: string;
  companyName?: string;
  config?: unknown;
  scaleSize?: number;
}

const CSATView: React.FC<CSATViewProps> = ({
  questionText,
  researchId,
  stepId,
  stepName,
  stepType,
  onStepComplete,
  instructions,
  companyName,
  config,
}) => {
  
  const participantIdFromStore = useParticipantStore(state => state.participantId);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [internalModuleResponseId, setInternalModuleResponseId] = useState<string | null>(null);
  const {
    saveOrUpdateResponse,
    isLoading: isSubmitting,
    error: submissionError,
    setError: setSubmissionError
  } = useResponseAPI({ researchId, participantId: participantIdFromStore || '' });
  const {
    data: moduleResponsesArray,
    isLoading: isLoadingInitialData,
    error: loadingError
  } = useModuleResponses({
    researchId,
    participantId: participantIdFromStore || undefined,
    autoFetch: true
  });

  useEffect(() => {
    if (!isLoadingInitialData && !loadingError && moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      const foundResponse = moduleResponsesArray.find((r: unknown) => {
        if (typeof r !== 'object' || r === null) return false;
        const resp = r as { stepType?: string; moduleId?: string; stepId?: string };
        return (resp.stepType === stepType && resp.moduleId === (typeof config === 'object' && config !== null && 'moduleId' in config ? (config as { moduleId?: string }).moduleId : undefined)) ||
          (resp.stepId === stepId);
      });

      if (foundResponse) {
        let value = null;
        if (foundResponse.response?.data?.response?.value !== undefined) {
          value = foundResponse.response.data.response.value;
        } else if (foundResponse.response?.value !== undefined) {
          value = foundResponse.response.value;
        }
        
        if (typeof value === 'number') {
          setSelectedValue(value);
        }
        setInternalModuleResponseId(foundResponse.id || null);
      } else {
        setSelectedValue(null);
        setInternalModuleResponseId(null);
      }
    }
  }, [moduleResponsesArray, isLoadingInitialData, loadingError, stepId, stepType, config]);

  const satisfactionLevels = [
    { value: 1, label: 'Muy insatisfecho' },
    { value: 2, label: 'Insatisfecho' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Satisfecho' },
    { value: 5, label: 'Muy satisfecho' }
  ];

  const handleSelect = (value: number) => {
    setSelectedValue(value);
    if (submissionError) setSubmissionError(null);
  };

  const handleSubmit = async () => {
    if (!participantIdFromStore || participantIdFromStore.trim() === '') {
      const errorMsg = "Error: participantIdFromStore vacío.";
      setSubmissionError(errorMsg);
      return;
    }
    if (selectedValue === null) {
      setSubmissionError("Por favor, selecciona una opción.");
      return;
    }

    const responseData = { value: selectedValue };
    const moduleIdForApi = (typeof config === 'object' && config !== null && 'moduleId' in config ? (config as { moduleId?: string }).moduleId : undefined);

    const result = await saveOrUpdateResponse(
      stepId,
      stepType,
      stepName,
      responseData,
      internalModuleResponseId || undefined,
      moduleIdForApi
    );

    if (result && !submissionError) {
      if (typeof result === 'object' && result !== null && 'id' in result && typeof (result as { id?: unknown }).id === 'string' && !internalModuleResponseId) {
        setInternalModuleResponseId((result as { id: string }).id);
        onStepComplete({ success: true, data: result, value: selectedValue });
      } else {
        onStepComplete({ success: true, data: result, value: selectedValue });
      }
    } else if (!result && !submissionError) {
      setSubmissionError("Ocurrió un error desconocido al guardar.");
    }
  };

  const formattedQuestionText = companyName
    ? questionText.replace(/\[company\]|\[empresa\]/gi, companyName)
    : questionText;

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
        <p>Cargando datos de CSAT...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-2xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">
          {formattedQuestionText}
        </h2>

        {instructions && (
          <p className="text-sm text-center text-neutral-600 mb-8">
            {instructions}
          </p>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-2 mb-8 w-full">
          {satisfactionLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => handleSelect(level.value)}
              className={`px-4 py-3 rounded-md border flex flex-col items-center justify-center transition-colors ${
                selectedValue === level.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              <span className="font-medium">{level.value}</span>
              <span className="text-xs mt-1">{level.label}</span>
            </button>
          ))}
        </div>

        {(submissionError || loadingError) && (
          <p className="text-sm text-red-600 mb-4 text-center">
            Error: {submissionError || loadingError}
          </p>
        )}

        <button
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={selectedValue === null || isSubmitting || isLoadingInitialData}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default CSATView; 