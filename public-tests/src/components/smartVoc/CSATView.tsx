import React, { useState, useEffect, useMemo } from 'react';
import { useResponseAPI } from '../../hooks/useResponseAPI';
import { useParticipantStore } from '../../stores/participantStore';
import { useModuleResponses } from '../../hooks/useModuleResponses';
// import StarRating from './StarRating'; // Ya no se usa

interface CSATViewProps {
  questionText: string;
  researchId: string;
  token: string | null;
  stepId: string;
  stepName: string;
  stepType: string;
  onStepComplete: (data?: any) => void;
  instructions?: string;
  companyName?: string;
  config?: {
    moduleId?: string;
    [key: string]: any; 
  };
  scaleSize?: number;
}

const CSATView: React.FC<CSATViewProps> = ({
  questionText,
  researchId,
  token,
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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  useEffect(() => {
    setDebugLogs(prev => [...prev, `CSATView useEffect [moduleResponsesArray]: isLoadingInitialData=${isLoadingInitialData}, loadingError=${loadingError}, moduleResponsesArray exists: ${!!moduleResponsesArray}`]);
    if (!isLoadingInitialData && !loadingError && moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      setDebugLogs(prev => [...prev, `Datos de API recibidos en CSATView: ${JSON.stringify(moduleResponsesArray)}`]);
      const foundResponse = moduleResponsesArray.find((r: any) => 
        (r.stepType === stepType && r.moduleId === config?.moduleId) ||
        (r.stepId === stepId)
      );

      if (foundResponse) {
        setDebugLogs(prev => [...prev, `Respuesta encontrada para CSAT (${stepId}/${stepType}): ${JSON.stringify(foundResponse)}`]);
        let value = null;
        if (foundResponse.response?.data?.response?.value !== undefined) {
          value = foundResponse.response.data.response.value;
        } else if (foundResponse.response?.value !== undefined) {
          value = foundResponse.response.value;
        }
        
        if (typeof value === 'number') {
          setSelectedValue(value);
          setDebugLogs(prev => [...prev, `SelectedValue seteado a: ${value}`]);
        }
        setInternalModuleResponseId(foundResponse.id || null);
        setDebugLogs(prev => [...prev, `InternalModuleResponseId seteado a: ${foundResponse.id}`]);
      } else {
        setDebugLogs(prev => [...prev, `No se encontró respuesta para CSAT (${stepId}/${stepType}) en moduleResponsesArray.`]);
        setSelectedValue(null);
        setInternalModuleResponseId(null);
      }
    }
  }, [moduleResponsesArray, isLoadingInitialData, loadingError, stepId, stepType, config?.moduleId]);

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
    setDebugLogs(prev => [...prev, `Seleccionado: ${value}`]);
  };

  const handleSubmit = async () => {
    const newLogs: string[] = [];
    newLogs.push('--- handleSubmit iniciado (CSATView self-managed) ---');

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
    const moduleIdForApi = config?.moduleId;

    const apiCallParams = {
      researchId,
      participantId: participantIdFromStore,
      stepId,
      stepType,
      stepName,
      responseData,
      existingResponseId: internalModuleResponseId || undefined,
      moduleId: moduleIdForApi
    };
    newLogs.push(`Llamando a saveOrUpdateResponse con: ${JSON.stringify(apiCallParams, null, 2)}`);

    const result = await saveOrUpdateResponse(
      stepId,
      stepType,
      stepName,
      responseData,
      internalModuleResponseId || undefined,
      moduleIdForApi
    );
    newLogs.push(`Resultado de saveOrUpdateResponse: ${JSON.stringify(result, null, 2)}`);

    if (result && !submissionError) {
      newLogs.push('Respuesta enviada/actualizada.');
      if (result.id && !internalModuleResponseId) {
        setInternalModuleResponseId(result.id);
        newLogs.push(`Nuevo internalModuleResponseId seteado a: ${result.id}`);
      }
      onStepComplete({ success: true, data: result, value: selectedValue });
    } else if (!result && !submissionError) {
      newLogs.push('Error: Ocurrió un error desconocido (resultado nulo sin error de API).');
      setSubmissionError("Ocurrió un error desconocido al guardar.");
    }
    newLogs.push('--- handleSubmit finalizado ---');
    setDebugLogs(prev => [...prev, ...newLogs]);
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

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 border rounded bg-gray-50 text-xs text-gray-700 w-full max-w-2xl">
          <h4 className="font-semibold mb-2">[Debug CSATView - Self-Managed Data]</h4>
          <p>Research ID: {researchId}, Participant ID: {participantIdFromStore}</p>
          <p>Step ID: {stepId}, Step Name: {stepName}, Step Type: {stepType}, ModuleID (from config): {config?.moduleId || 'N/A'}</p>
          <p>Hook isLoading: {isLoadingInitialData.toString()}, Hook Error: {loadingError || 'No'}</p>
          <p>InternalModuleResponseID (state): {internalModuleResponseId || 'N/A'}</p>
          <p>Selected Value (state): {selectedValue === null ? 'N/A' : selectedValue}</p>
          <p>Submit isLoading: {isSubmitting.toString()}, Submit Error: {submissionError || 'No'}</p>
          <h5 className="font-semibold mt-2 mb-1">Logs de Eventos (CSATView):</h5>
          <pre className="whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
            {debugLogs.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CSATView; 