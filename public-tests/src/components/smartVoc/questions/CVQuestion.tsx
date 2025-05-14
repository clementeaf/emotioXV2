import React, { useState, useEffect } from 'react';
import { SmartVOCQuestion, /*CVConfig*/ CESConfig as CVConfig } from '../SmartVOCRouter'; // Usar CVConfig si existe, sino adaptar
import { useParticipantStore } from '../../../stores/participantStore';
import { useModuleResponses } from '../../../hooks/useModuleResponses';
import { useResponseAPI } from '../../../hooks/useResponseAPI';

interface CVQuestionProps { // Renombrado
  questionConfig: SmartVOCQuestion & { config: CVConfig }; // Usar CVConfig
  researchId: string;
  moduleId: string;
  onSaveSuccess: (questionId: string, responseValue: number, moduleResponseId: string | null) => void;
}

export const CVQuestion: React.FC<CVQuestionProps> = ({ // Renombrado
  questionConfig, 
  researchId,
  moduleId,
  onSaveSuccess 
}) => {
  const { id: questionId, description, type: questionType, title: questionTitleFromConfig, config: specificConfig } = questionConfig;
  // Usar description o title de questionConfig como texto principal, o un default
  const mainQuestionText = description || questionTitleFromConfig || '¿Cómo calificarías el valor recibido?';

  // Obtener scaleRange, startLabel, endLabel de specificConfig (el CVConfig)
  // Establecer defaults apropiados para CV si no se proporcionan en la config
  const scaleRange = specificConfig?.scaleRange || { start: 1, end: 7 }; // Ejemplo: default 1-7, ajustar según necesidad para CV
  const leftLabel = specificConfig?.startLabel || "Poco valor";
  const rightLabel = specificConfig?.endLabel || "Mucho valor";

  const participantIdFromStore = useParticipantStore(state => state.participantId);

  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [internalModuleResponseId, setInternalModuleResponseId] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

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
    const log = (msg: string, data?: any) => setDebugLogs(prev => [...prev, data ? `[CVQuestion-${questionId}] ${msg}: ${JSON.stringify(data)}` : `[CVQuestion-${questionId}] ${msg}`]);
    log(`useEffect [moduleResponsesArray] Mod_ID: ${moduleId}`);
    log(`isLoadingInitialData: ${isLoadingInitialData}, loadingError: ${loadingError}, moduleResponsesArray exists: ${!!moduleResponsesArray}`);

    if (!isLoadingInitialData && !loadingError && moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      log('Datos de API recibidos', moduleResponsesArray);
      const foundResponse = moduleResponsesArray.find((r: any) => 
        r.stepId === questionId && r.moduleId === moduleId
      );

      if (foundResponse) {
        log('Respuesta encontrada', foundResponse);
        let value = null;
        if (typeof foundResponse.response === 'number') {
          value = foundResponse.response;
        } else if (foundResponse.response?.value !== undefined && typeof foundResponse.response.value === 'number') {
          value = foundResponse.response.value;
        }
        
        if (value !== null) {
          setSelectedValue(value);
          log(`SelectedValue seteado a: ${value}`);
        }
        setInternalModuleResponseId(foundResponse.id || null);
        log(`InternalModuleResponseId seteado a: ${foundResponse.id}`);
      } else {
        log('No se encontró respuesta para esta pregunta CV.');
        setSelectedValue(null);
        setInternalModuleResponseId(null);
      }
    }
  }, [moduleResponsesArray, isLoadingInitialData, loadingError, questionId, moduleId]);

  const handleSelect = (value: number) => {
    setSelectedValue(value);
    if (submissionError) setSubmissionError(null);
    setDebugLogs(prev => [...prev, `[CVQuestion-${questionId}] Valor seleccionado (sin guardar aún): ${value}`]);
  };

  const handleSaveOrUpdateClick = async () => {
    const newLogs: string[] = [];
    newLogs.push(`--- handleSubmit iniciado (CVQuestion: ${questionId}) ---`);

    if (!participantIdFromStore || participantIdFromStore.trim() === '') {
      const errorMsg = "Error: participantIdFromStore vacío.";
      setSubmissionError(errorMsg);
      newLogs.push(errorMsg);
      setDebugLogs(prev => [...prev, ...newLogs]);
      return;
    }
    if (selectedValue === null) {
      setSubmissionError("Por favor, selecciona una opción.");
      newLogs.push('Error: Ninguna opción seleccionada.');
      setDebugLogs(prev => [...prev, ...newLogs]);
      return;
    }

    const responseData = { value: selectedValue };
    const stepNameForApi = questionTitleFromConfig || description || questionId; // Usar título o descripción de questionConfig

    const apiCallParams = {
      researchId,
      participantId: participantIdFromStore,
      stepId: questionId, 
      stepType: questionType, // Este es el tipo de la pregunta CV, ej. 'smartvoc_cv'
      stepName: stepNameForApi,
      responseData,
      existingResponseId: internalModuleResponseId || undefined,
      moduleId: moduleId // Este es el ID del módulo padre SmartVOCRouter
    };
    newLogs.push(`Llamando a saveOrUpdateResponse con (apiCallParams): ${JSON.stringify(apiCallParams, null, 2)}`);
    
    const payloadParaPost = {
        researchId: apiCallParams.researchId,
        participantId: apiCallParams.participantId,
        stepId: apiCallParams.stepId,
        stepType: apiCallParams.stepType,
        stepTitle: apiCallParams.stepName,
        response: apiCallParams.responseData,
        moduleId: apiCallParams.moduleId
      };
    newLogs.push(`Payload que se construiría para POST en useResponseAPI: ${JSON.stringify(payloadParaPost, null, 2)}`);

    setDebugLogs(prev => [...prev, ...newLogs]);

    const result = await saveOrUpdateResponse(
      questionId,
      questionType, 
      stepNameForApi, 
      responseData,
      internalModuleResponseId || undefined,
      moduleId 
    );
    
    const finalNewLogs: string[] = [];
    finalNewLogs.push(`Resultado de saveOrUpdateResponse: ${JSON.stringify(result, null, 2)}`);

    if (result && !submissionError) {
      finalNewLogs.push('Respuesta enviada/actualizada correctamente por CVQuestion.');
      if (result.id && !internalModuleResponseId) {
        setInternalModuleResponseId(result.id);
        finalNewLogs.push(`Nuevo internalModuleResponseId seteado a: ${result.id}`);
      }
      onSaveSuccess(questionId, selectedValue, result.id || internalModuleResponseId || null);
    } else if (!result && !submissionError) {
      finalNewLogs.push('Error desde CVQuestion: Ocurrió un error desconocido al guardar.');
      setSubmissionError("Ocurrió un error desconocido al guardar la respuesta (CVQuestion).");
    } else if (submissionError) {
      finalNewLogs.push(`Error reportado por useResponseAPI: ${submissionError}`);
    }
    finalNewLogs.push(`--- handleSubmit finalizado (CVQuestion: ${questionId}) ---`);
    setDebugLogs(prev => [...prev, ...finalNewLogs]);
  };

  const scaleOptions: number[] = [];
  for (let i = scaleRange.start; i <= scaleRange.end; i++) {
    scaleOptions.push(i);
  }
  if (scaleOptions.length === 0) { // Fallback si scaleRange no generó opciones válidas
    console.warn(`[CVQuestion] scaleOptions vacío para ${questionId}, usando 1-7 por defecto.`);
    for (let i = 1; i <= 7; i++) { scaleOptions.push(i); }
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
          {mainQuestionText} {/* Usar mainQuestionText */}
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

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 border rounded bg-gray-50 text-xs text-gray-700 w-full max-w-xl">
          <h5 className="font-semibold mb-2">[Debug CVQuestion - {questionId}]</h5>
          <p>ResearchID: {researchId}, ParticipantID: {participantIdFromStore}</p>
          <p>ModuleID (prop): {moduleId}, StepType (prop): {questionType} (de qConfig)</p> {/* Usar questionType de qConfig */}
          <p>Hook isLoading: {isLoadingInitialData.toString()}, Hook Error: {loadingError || 'No'}</p>
          <p>InternalModuleResponseID (state): {internalModuleResponseId || 'N/A'}</p>
          <p>Selected Value (state): {selectedValue === null ? 'N/A' : selectedValue}</p>
          <p>Submit isLoading: {isSubmitting.toString()}, Submit Error: {submissionError || 'No'}</p>
          <h5 className="font-semibold mt-2 mb-1">Logs:</h5>
          <pre className="whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
            {debugLogs.slice(-10).join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}; 