import React, { useState, useEffect } from 'react';
import { useParticipantStore } from '../../stores/participantStore';
import { useModuleResponses } from '../../hooks/useModuleResponses';
import { useResponseAPI } from '../../hooks/useResponseAPI';
import { SmartVOCQuestion, BaseScaleConfig } from '../../types/smart-voc.interface';
import { smartVOCTypeMap } from '../../hooks/utils';

interface DifficultyScaleViewProps {
  questionConfig: SmartVOCQuestion;
  researchId: string;
  moduleId: string;
  onNext: (responsePayload: { value: number, feedback?: string, moduleResponseId?: string | null }) => void;
}

const DifficultyScaleView: React.FC<DifficultyScaleViewProps> = ({
  questionConfig,
  researchId,
  moduleId,
  onNext,
}) => {
  const actualStepId = questionConfig.id;
  const actualDescription = questionConfig.description || questionConfig.title || 'Califica tu experiencia';
  const specificConfig = questionConfig.config as BaseScaleConfig || {};
  const {
    scaleRange = { start: 1, end: 7 },
    startLabel = 'Mínimo',
    endLabel = 'Máximo'
  } = specificConfig;

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

  const apiKey = moduleId.toUpperCase();

  const frontendStepType = smartVOCTypeMap[apiKey];

  useEffect(() => {
    if (!isLoadingInitialData && !loadingError && moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      const foundResponse = moduleResponsesArray.find((r: unknown) => {
        if (typeof r !== 'object' || r === null) return false;
        return 'stepType' in r && (r as { stepType?: string }).stepType === frontendStepType;
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
  }, [moduleResponsesArray, isLoadingInitialData, loadingError, frontendStepType]);

  useEffect(() => {
    if (submissionError) {
      // Loguea el error de envío
       
      console.error('[DifficultyScaleView] submissionError:', submissionError);
    }
    if (loadingError) {
      // Loguea el error de carga
       
      console.error('[DifficultyScaleView] loadingError:', loadingError);
    }
  }, [submissionError, loadingError]);

  const handleSelect = (value: number) => {
    setSelectedValue(value);
    if (submissionError) setSubmissionError(null);
  };

  const handleSaveOrUpdateClick = async () => {
    const newLogs: string[] = [];
    newLogs.push(`--- handleSubmit (DifficultyScale-${actualStepId}) ---`);

    if (!participantIdFromStore) {
      const errorMsg = "Error: participantIdFromStore vacío.";
      setSubmissionError(errorMsg);
      newLogs.push(errorMsg);
      return;
    }
    if (selectedValue === null) {
      setSubmissionError("Por favor, selecciona una opción.");
      newLogs.push('Error: Ninguna opción seleccionada.');
      return;
    }

    const responseData = { value: selectedValue };
    const stepNameForApi = questionConfig.title || actualDescription || actualStepId;

    const apiCallParams = { researchId, participantId: participantIdFromStore, stepId: actualStepId, stepType: frontendStepType, stepName: stepNameForApi, responseData, existingResponseId: internalModuleResponseId || undefined, moduleId };
    newLogs.push(`Llamando saveOrUpdateResponse con: ${JSON.stringify(apiCallParams, null, 2)}`);
    const payloadParaPost = { researchId, participantId: participantIdFromStore, stepId: actualStepId, stepType: frontendStepType, stepTitle: stepNameForApi, response: responseData, moduleId };
    newLogs.push(`Payload POST: ${JSON.stringify(payloadParaPost, null, 2)}`);

    const result = await saveOrUpdateResponse(
      actualStepId,
      frontendStepType,
      stepNameForApi,
      responseData,
      internalModuleResponseId || undefined,
      moduleId
    );

    const finalNewLogs: string[] = [];
    finalNewLogs.push(`Resultado: ${JSON.stringify(result, null, 2)}`);
    if (result && !submissionError) {
      finalNewLogs.push('Éxito.');
      let newId: string | null = null;
      if (typeof result === 'object' && result !== null && 'id' in result && typeof (result as { id?: unknown }).id === 'string') {
        newId = (result as { id: string }).id;
        if (!internalModuleResponseId) setInternalModuleResponseId(newId);
      }
      onNext({ value: selectedValue, moduleResponseId: newId || internalModuleResponseId || null });
      // SOLO LOGUEA EN CONSOLA, NO EN EL ESTADO DE ERROR
       
      console.log(finalNewLogs.join('\n'));
    } else if (!result && !submissionError) {
      finalNewLogs.push('Error desde DifficultyScaleView: Ocurrió un error desconocido al guardar (resultado nulo sin error de API explícito del hook).');
      setSubmissionError("Ocurrió un error desconocido al guardar la respuesta (DifficultyScaleView).");
    } else if (submissionError) {
      finalNewLogs.push(`Error reportado por useResponseAPI: ${submissionError}`);
      setSubmissionError(submissionError); // Solo setea el error real
    }
    finalNewLogs.push(`--- handleSubmit fin (DifficultyScale-${actualStepId}) ---`);
     
    console.log(finalNewLogs.join('\n'));
  };

  const scaleOptions: number[] = [];
  for (let i = scaleRange.start; i <= scaleRange.end; i++) scaleOptions.push(i);
  if (scaleOptions.length === 0) for (let i = 1; i <= 7; i++) scaleOptions.push(i);

  let buttonText = internalModuleResponseId ? 'Actualizar y continuar' : 'Guardar y continuar';
  if (isSubmitting) buttonText = 'Enviando...';

  const mainQuestionTextForDisplay = actualDescription;

  if (isLoadingInitialData && !moduleResponsesArray) return <div className="p-4 text-center">Cargando...</div>;

  return (
    <div className="flex flex-col items-center justify-center w-full p-8 bg-white">
      <div className="max-w-xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">{mainQuestionTextForDisplay}</h2>
        {(submissionError || loadingError) && (
          <p className="text-sm text-red-600 my-2 text-center">Error: {submissionError || loadingError}</p>
        )}
        <div className="flex justify-center gap-2 mb-4">
          {scaleOptions.map((value) => (
            <button key={value} onClick={() => handleSelect(value)} disabled={isSubmitting || isLoadingInitialData}
              className={`w-9 h-9 rounded-full border flex items-center justify-center font-medium transition-colors 
                ${selectedValue === value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'}
                ${(isSubmitting || isLoadingInitialData) ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {value}
            </button>
          ))}
        </div>
        <div className="flex justify-between w-full mt-2 px-1 max-w-xs sm:max-w-sm">
          <span className="text-xs text-neutral-500">{startLabel}</span>
          <span className="text-xs text-neutral-500">{endLabel}</span>
        </div>
        <button onClick={handleSaveOrUpdateClick} disabled={selectedValue === null || isSubmitting || isLoadingInitialData}
          className="mt-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default DifficultyScaleView; 