import React, { useState, useEffect } from 'react';
import { useParticipantStore } from '../../stores/participantStore';
import { useModuleResponses } from '../../hooks/useModuleResponses';
import { useResponseAPI } from '../../hooks/useResponseAPI';
import { getStandardButtonText } from '../../utils/formHelpers';
import { AgreementScaleViewComponentProps } from '../../types/smart-voc.types';

const AgreementScaleView: React.FC<AgreementScaleViewComponentProps> = ({
  questionText,
  instructions,
  scaleSize = 7, // Defecto 7 según la imagen
  leftLabel = "No en absoluto", // Defecto en español
  rightLabel = "Totalmente", // Defecto en español
  researchId,
  stepId,
  stepName,
  stepType,
  onStepComplete
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
    autoFetch: !!(researchId && participantIdFromStore)
  });

  // Cargar valor inicial desde la API
  useEffect(() => {
    if (!isLoadingInitialData && !loadingError && moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      // Type guard robusto para evitar any
      const foundResponse = moduleResponsesArray.find((r: unknown) => {
        if (typeof r !== 'object' || r === null) return false;
        const resp = r as { 
          stepType?: unknown; 
          stepTitle?: unknown; 
          id?: unknown;
          stepId?: unknown; 
          moduleId?: unknown 
        };
        
        // Buscar por múltiples criterios para máxima compatibilidad
        return (
          // Por stepType exacto
          (resp.stepType === stepType) ||
          // Por stepId si coincide
          (resp.stepId === stepId) ||
          // Por stepTitle si contiene el stepName
          (typeof resp.stepTitle === 'string' && resp.stepTitle.includes(stepName)) ||
          // Por id si coincide con stepId
          (resp.id === stepId)
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
        console.log(`[AgreementScaleView] Cargando respuesta existente para ${stepId}:`, responseValue);
        setSelectedValue(responseValue);
        setInternalModuleResponseId(
          'id' in foundResponse && typeof (foundResponse as { id?: unknown }).id === 'string'
            ? (foundResponse as { id: string }).id
            : null
        );
      } else {
        console.log(`[AgreementScaleView] No se encontró respuesta previa para ${stepId}`);
        setSelectedValue(null);
        setInternalModuleResponseId(null);
      }
    }
  }, [moduleResponsesArray, isLoadingInitialData, loadingError, stepId, stepType, stepName]);

  const scaleButtons = Array.from({ length: scaleSize }, (_, i) => i + 1); // [1, ..., scaleSize]

  const handleSelect = (value: number) => {
    setSelectedValue(value);
    if (submissionError) setSubmissionError(null);
  };

  const handleSubmit = async () => {
    if (!participantIdFromStore || participantIdFromStore.trim() === '') {
      setSubmissionError("Error: participantIdFromStore vacío.");
      return;
    }
    if (selectedValue === null) {
      setSubmissionError("Por favor, selecciona una opción.");
      return;
    }

    const responseData = { value: selectedValue };
    const result = await saveOrUpdateResponse(
      stepId,
      stepType,
      stepName,
      responseData,
      internalModuleResponseId || undefined
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

  const buttonText = getStandardButtonText({
    isSaving: isSubmitting,
    isLoading: isLoadingInitialData,
    hasExistingData: !!internalModuleResponseId && selectedValue !== null
  });

  if (isLoadingInitialData) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">
          {questionText}
        </h2>
        
        {instructions && (
          <p className="text-sm text-center text-neutral-600 mb-8">
            {instructions}
          </p>
        )}
        
        <div className="flex space-x-4 justify-center w-full mb-4">
          {scaleButtons.map((value) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center font-medium transition-colors ${selectedValue === value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
              }`}
              disabled={isSubmitting}
            >
              {value}
            </button>
          ))}
        </div>
        
        <div className="flex justify-between w-full mt-2 px-1">
          <span className="text-sm text-neutral-500">{leftLabel}</span>
          <span className="text-sm text-neutral-500">{rightLabel}</span>
        </div>
        
        {(submissionError || loadingError) && (
          <p className="text-sm text-red-600 my-2 text-center">Error: {submissionError || loadingError}</p>
        )}
        
        <button
          className="mt-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-8 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={selectedValue === null || isSubmitting}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default AgreementScaleView; 