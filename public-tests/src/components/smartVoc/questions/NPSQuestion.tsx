import React, { useState, useEffect } from 'react';
import { SmartVOCQuestion, /*NPSConfig*/ CESConfig as NPSConfig } from '../SmartVOCRouter'; // Usar NPSConfig si existe
import { useParticipantStore } from '../../../stores/participantStore';
import { useModuleResponses } from '../../../hooks/useModuleResponses';
import { useResponseAPI } from '../../../hooks/useResponseAPI';

interface NPSQuestionProps { // Renombrado
  questionConfig: SmartVOCQuestion & { config: NPSConfig }; // Usar NPSConfig
  researchId: string;
  moduleId: string;
  onSaveSuccess: (questionId: string, responseValue: number, moduleResponseId: string | null) => void;
}

export const NPSQuestion: React.FC<NPSQuestionProps> = ({ // Renombrado
  questionConfig, 
  researchId,
  moduleId,
  onSaveSuccess 
}) => {
  const { id: questionId, description, type: questionType, title: questionTitle, config } = questionConfig;
  // Asumir que NPSConfig también tiene scaleRange, startLabel, endLabel
  const { scaleRange, startLabel, endLabel } = config; 

  const participantId = useParticipantStore(state => state.participantId);

  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [internalModuleResponseId, setInternalModuleResponseId] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

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
    const log = (msg: string, data?: any) => setDebugLogs(prev => [...prev, data ? `[NPSQuestion] ${msg}: ${JSON.stringify(data)}` : `[NPSQuestion] ${msg}`]);
    log(`useEffect [moduleResponsesArray] for Q_ID: ${questionId}, Mod_ID: ${moduleId}`);
    // ... (lógica del useEffect igual, solo cambia el prefijo del log)
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
        log('No se encontró respuesta para esta pregunta NPS.');
        setSelectedValue(null);
        setInternalModuleResponseId(null);
      }
    }
  }, [moduleResponsesArray, isLoadingInitialData, loadingError, questionId, moduleId]);

  const handleScaleSelection = (valueToSelect: number) => {
    setSelectedValue(valueToSelect);
    if (submissionError) setSubmissionError(null);
    setDebugLogs(prev => [...prev, `[NPSQuestion] Valor seleccionado (sin guardar aún): ${valueToSelect}`]);
  };

  const handleSaveOrUpdateClick = async () => {
    // ... (lógica igual, solo cambia el prefijo del log)
    if (selectedValue === null) {
      setSubmissionError("Por favor, selecciona un valor en la escala.");
      setDebugLogs(prev => [...prev, "[NPSQuestion] Intento de submit sin valor seleccionado."]);
      return;
    }
    const log = (msg: string, data?: any) => setDebugLogs(prev => [...prev, data ? `[NPSQuestion] ${msg}: ${JSON.stringify(data)}` : `[NPSQuestion] ${msg}`]);
    log(`--- handleSaveOrUpdateClick (Q_ID: ${questionId}) ---`, { selectedValue });
    if (!participantId) {
      const errorMsg = "Error: Participant ID no disponible.";
      setSubmissionError(errorMsg);
      log(errorMsg);
      return;
    }
    const result = await saveOrUpdateResponse(
      questionId, 
      questionType, 
      questionTitle || description || questionId, 
      selectedValue,
      internalModuleResponseId === null ? undefined : internalModuleResponseId
    );
    log('Resultado de saveOrUpdateResponse', result);
    if (result && !submissionError) {
      log('Respuesta enviada/actualizada.');
      const newModuleResponseId = result.id || null;
      if (newModuleResponseId && newModuleResponseId !== internalModuleResponseId) {
        setInternalModuleResponseId(newModuleResponseId);
        log(`Nuevo internalModuleResponseId seteado a: ${newModuleResponseId}`);
      }
      onSaveSuccess(questionId, selectedValue, newModuleResponseId);
    } else if (!result && !submissionError) {
      log('Error: Ocurrió un error desconocido (resultado nulo sin error de API).');
      setSubmissionError("Ocurrió un error desconocido al guardar.");
    }
  };

  const scaleOptions: number[] = [];
  // NPS suele ser de 0 a 10
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
    // ... (JSX igual a CESQuestion, solo cambia el prefijo del log en el bloque de debug y el texto descriptivo)
    <div className="space-y-4 flex flex-col items-center">
      <p className="text-base md:text-lg font-medium text-gray-800 text-center">{description || questionTitle || '¿Qué tan probable es que recomiendes...?'}</p>
      
      {(submissionError || loadingError) && (
          <p className="text-sm text-red-600 my-2 text-center">Error: {submissionError || loadingError}</p>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-lg"> {/* Max-width un poco mayor para NPS */}
        {startLabel && <span className="text-sm text-gray-600">{startLabel}</span>}
        
        <div className="flex flex-wrap justify-center gap-1 p-1 md:gap-2 md:p-2"> {/* Menos gap para más números */}
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
              <span className="text-xs md:text-sm font-medium">{optionValue}</span> {/* Tamaño de fuente más pequeño */}
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

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-gray-50 text-xs text-gray-400 border rounded max-h-32 overflow-y-auto w-full max-w-lg">
          <h5 className="font-semibold">[Debug NPSQuestion - {questionId}]</h5>
          <p>ModID: {moduleId}, SelVal: {selectedValue === null ? 'N/A' : selectedValue}, RespID: {internalModuleResponseId || 'N/A'}</p>
          <p>LoadState: InitLoad: {isLoadingInitialData.toString()}, SubmitLoad: {isSubmitting.toString()}</p>
          <p>Errors: LoadErr: {loadingError || 'No'}, SubmitErr: {submissionError || 'No'}</p>
          <p>Logs:</p>
          <pre className="whitespace-pre-wrap break-all">{debugLogs.slice(-5).join('\n')}</pre>
        </div>
      )}
    </div>
  );
}; 