import React, { useState, useEffect } from 'react';
import { useParticipantStore } from '../../stores/participantStore';
import { useModuleResponses } from '../../hooks/useModuleResponses';
import { useResponseAPI } from '../../hooks/useResponseAPI';

interface DifficultyScaleViewProps {
  questionText: string;
  instructions?: string;
  companyName?: string;
  leftLabel?: string; // Etiqueta izquierda (CES)
  rightLabel?: string; // Etiqueta derecha (CES)
  onNext: (responsePayload: { value: number, feedback?: string, moduleResponseId?: string | null }) => void;
  researchId: string;
  stepId: string;
  stepType: string;
  moduleId: string;
  config?: any; // Configuración adicional si necesaria
}

const DifficultyScaleView: React.FC<DifficultyScaleViewProps> = ({
  questionText,
  instructions,
  companyName,
  leftLabel = "Muy fácil", // Valor por defecto CES
  rightLabel = "Muy difícil", // Valor por defecto CES
  onNext,
  researchId,
  stepId,
  stepType,
  moduleId,
  config
}) => {
  const participantId = useParticipantStore(state => state.participantId);

  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [internalModuleResponseId, setInternalModuleResponseId] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Hook para cargar datos iniciales
  const {
    data: moduleResponsesArray,
    isLoading: isLoadingInitialData,
    error: loadingError
  } = useModuleResponses({
    researchId,
    participantId: participantId || undefined,
    autoFetch: !!(researchId && participantId) 
  });

  // Hook para guardar/actualizar respuestas
  const {
    saveOrUpdateResponse,
    isLoading: isSubmitting,
    error: submissionError,
    setError: setSubmissionError
  } = useResponseAPI({ researchId, participantId: participantId || '' });

  // Efecto para procesar las respuestas cargadas
  useEffect(() => {
    const log = (msg: string, data?: any) => setDebugLogs(prev => [...prev, data ? `[DifficultyScale-${stepId}] ${msg}: ${JSON.stringify(data)}` : `[DifficultyScale-${stepId}] ${msg}`]);
    log(`useEffect [moduleResponsesArray] Mod_ID: ${moduleId}`);
    log(`isLoadingInitialData: ${isLoadingInitialData}, loadingError: ${loadingError}, moduleResponsesArray exists: ${!!moduleResponsesArray}`);

    if (!isLoadingInitialData && !loadingError && moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      log('Datos de API recibidos', moduleResponsesArray);
      // Buscar por stepId (ID de esta pregunta) Y moduleId (ID del módulo padre)
      const foundResponse = moduleResponsesArray.find((r: any) => 
        r.stepId === stepId && r.moduleId === moduleId
      );

      if (foundResponse) {
        log('Respuesta encontrada', foundResponse);
        let value = null;
        // La respuesta para una escala simple suele ser directamente el número o un objeto con { value: numero }
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
        log('No se encontró respuesta para esta pregunta de escala.');
        setSelectedValue(null);
        setInternalModuleResponseId(null);
      }
    }
  }, [moduleResponsesArray, isLoadingInitialData, loadingError, stepId, moduleId]);

  const handleSelect = (value: number) => {
    setSelectedValue(value);
    if (submissionError) setSubmissionError(null); // Limpiar error si el usuario cambia la selección
    setDebugLogs(prev => [...prev, `[DifficultyScale-${stepId}] Valor seleccionado (sin guardar aún): ${value}`]);
  };

  const handleSaveOrUpdateClick = async () => {
    const newLogs: string[] = []; // Array para los logs locales del submit
    newLogs.push(`--- handleSubmit iniciado (DifficultyScaleView: ${stepId}) ---`);

    if (!participantId || participantId.trim() === '') { // Usar participantId del store
      const errorMsg = "Error: participantId está vacío. No se puede enviar.";
      setSubmissionError(errorMsg);
      newLogs.push(errorMsg);
      setDebugLogs(prev => [...prev, ...newLogs]);
      return;
    }

    if (selectedValue === null) {
      setSubmissionError("Por favor, selecciona un valor en la escala.");
      newLogs.push('Error: Ninguna opción seleccionada.');
      setDebugLogs(prev => [...prev, ...newLogs]);
      return;
    }

    const responseData = { value: selectedValue }; // Payload específico de la respuesta
    const moduleIdForApi = moduleId; // Ya tenemos moduleId como prop

    // Log del payload que se pasará a saveOrUpdateResponse del hook
    const apiCallParams = {
      researchId,
      participantId,
      stepId,           // ID de esta pregunta de escala
      stepType,
      stepName: questionText, // Usar questionText como stepName/stepTitle
      responseData,
      existingResponseId: internalModuleResponseId || undefined,
      moduleId: moduleIdForApi
    };
    newLogs.push(`Llamando a saveOrUpdateResponse con (apiCallParams): ${JSON.stringify(apiCallParams, null, 2)}`);
    
    // Log del payload que el hook useResponseAPI (función saveResponse) construiría para un POST
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

    setDebugLogs(prev => [...prev, ...newLogs]); // Muestra logs ANTES de la llamada

    const result = await saveOrUpdateResponse(
      stepId,                       
      stepType,                     
      questionText, // Usar questionText como stepName para el hook                 
      responseData,                 
      internalModuleResponseId || undefined, 
      moduleIdForApi                 
    );
    
    // El resto de los logs del resultado
    const finalNewLogs: string[] = [];
    finalNewLogs.push(`Resultado de saveOrUpdateResponse: ${JSON.stringify(result, null, 2)}`);

    if (result && !submissionError) { // submissionError es el error del hook useResponseAPI
      finalNewLogs.push('Respuesta enviada/actualizada correctamente por DifficultyScaleView.');
      if (result.id && !internalModuleResponseId) {
        setInternalModuleResponseId(result.id);
        finalNewLogs.push(`Nuevo internalModuleResponseId seteado a: ${result.id}`);
      }
      // Usar la estructura de onNext que espera DifficultyScaleViewProps
      onNext({ value: selectedValue, moduleResponseId: result.id || internalModuleResponseId || null }); 
    } else if (!result && !submissionError) {
      finalNewLogs.push('Error desde DifficultyScaleView: Ocurrió un error desconocido al guardar (resultado nulo sin error de API explícito del hook).');
      setSubmissionError("Ocurrió un error desconocido al guardar la respuesta (DifficultyScaleView).");
    } else if (submissionError) {
      finalNewLogs.push(`Error reportado por useResponseAPI: ${submissionError}`);
    }
    finalNewLogs.push(`--- handleSubmit finalizado (DifficultyScaleView: ${stepId}) ---`);
    setDebugLogs(prev => [...prev, ...finalNewLogs]);
  };

  // Formatear el texto de la pregunta (reemplazo simple)
  const formattedQuestionText = companyName
    ? questionText.replace(/\[company\]|\[empresa\]/gi, companyName)
    : questionText;

  const scaleButtons = Array.from({ length: config?.scaleSize === 5 ? 5 : 7 }, (_, i) => i + 1); // Ajusta a config.scaleSize o default 7

  // Lógica para el texto del botón
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
        <p>Cargando pregunta...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">
          {formattedQuestionText}
        </h2>

        {instructions && (
          <p className="text-sm text-center text-neutral-600 mb-8">
            {instructions}
          </p>
        )}
        
        {(submissionError || loadingError) && (
          <p className="text-sm text-red-600 my-2 text-center">Error: {submissionError || loadingError}</p>
        )}

        <div className="flex justify-center gap-2 mb-4">
          {scaleButtons.map((value) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={isSubmitting || isLoadingInitialData} // Deshabilitar si está cargando/enviando
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

        <div className="flex justify-between w-full mt-2 px-1 max-w-xs sm:max-w-sm"> {/* Ajustar max-width para etiquetas */}
          <span className="text-xs text-neutral-500">{leftLabel}</span>
          <span className="text-xs text-neutral-500">{rightLabel}</span>
        </div>

        <button
          className="mt-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSaveOrUpdateClick} // CAMBIADO: Llama a la nueva función de guardado
          disabled={selectedValue === null || isSubmitting || isLoadingInitialData}
        >
          {buttonText} {/* Texto dinámico */}
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 border rounded bg-gray-50 text-xs text-gray-700 w-full max-w-xl">
          <h5 className="font-semibold mb-2">[Debug DifficultyScaleView - {stepId}]</h5>
          <p>ResearchID: {researchId}, ParticipantID: {participantId}</p>
          <p>ModuleID (prop): {moduleId}, StepType (prop): {stepType}</p>
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

export default DifficultyScaleView; 