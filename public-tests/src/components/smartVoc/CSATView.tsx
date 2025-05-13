import React, { useState, useEffect } from 'react';
import { useResponseAPI } from '../../hooks/useResponseAPI';
import { useParticipantStore } from '../../stores/participantStore';
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
  initialValue?: number | null;
  config?: {
    moduleResponseId?: string;
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
  initialValue = null,
  config,
  scaleSize
}) => {
  
  const participantIdFromStore = useParticipantStore(state => state.participantId);
  
  console.log('[CSATView] Renderizando con props.researchId:', researchId, 'participantIdFromStore:', participantIdFromStore);

  const [selectedValue, setSelectedValue] = useState<number | null>(initialValue);
  const {
    saveOrUpdateResponse,
    isLoading: isSubmitting,
    error: apiError,
    setError: setApiError
  } = useResponseAPI({ researchId, participantId: participantIdFromStore as string });
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  useEffect(() => {
    console.log('[CSATView] useEffect - researchId:', researchId, 'participantIdFromStore:', participantIdFromStore);
    if (initialValue !== null) {
      setSelectedValue(initialValue);
    }
  }, [initialValue, researchId, participantIdFromStore]);

  const satisfactionLevels = [
    { value: 1, label: 'Muy insatisfecho' },
    { value: 2, label: 'Insatisfecho' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Satisfecho' },
    { value: 5, label: 'Muy satisfecho' }
  ];

  const handleSelect = (value: number) => {
    setSelectedValue(value);
    if (apiError) setApiError(null);
    setDebugLogs(prev => [...prev, `Seleccionado: ${value}`]);
  };

  const handleSubmit = async () => {
    const newLogs: string[] = [];
    newLogs.push('--- handleSubmit iniciado ---');

    if (!participantIdFromStore || participantIdFromStore.trim() === '') {
      const errorMsg = "Error: participantIdFromStore está vacío en CSATView al intentar enviar. No se puede enviar.";
      setApiError(errorMsg);
      newLogs.push(errorMsg);
      console.error('[CSATView] handleSubmit ERROR:', errorMsg, 'Valor de participantIdFromStore:', participantIdFromStore);
      setDebugLogs(prev => [...prev, ...newLogs]);
      return;
    }

    if (selectedValue === null) {
      setApiError("Por favor, selecciona una opción.");
      newLogs.push('Error: Ninguna opción seleccionada.');
      setDebugLogs(prev => [...prev, ...newLogs]);
      return;
    }

    const responseData = { value: selectedValue };
    const existingResponseId = config?.moduleResponseId;
    
    const apiCallParams = {
      researchId,
      participantId: participantIdFromStore,
      stepId,
      stepType,
      stepName,
      responseData,
      existingResponseId
    };
    newLogs.push(`Llamando a saveOrUpdateResponse con: ${JSON.stringify(apiCallParams, null, 2)}`);
    console.log('[CSATView] handleSubmit - Llamando a saveOrUpdateResponse con:', apiCallParams);

    const result = await saveOrUpdateResponse(
      stepId,
      stepType,
      stepName,
      responseData,
      existingResponseId
    );
    newLogs.push(`Resultado de saveOrUpdateResponse: ${JSON.stringify(result, null, 2)}`);

    if (result && !apiError) {
      newLogs.push('Respuesta enviada/actualizada correctamente.');
      console.log('[CSATView] Respuesta enviada/actualizada correctamente:', result);
      onStepComplete({ success: true, data: result });
    } else if (!result && !apiError) {
      newLogs.push('Error: Ocurrió un error desconocido al guardar la respuesta (resultado nulo sin error de API).');
      setApiError("Ocurrió un error desconocido al guardar la respuesta.");
    }
    newLogs.push('--- handleSubmit finalizado ---');
    setDebugLogs(prev => [...prev, ...newLogs]);
  };

  const formattedQuestionText = companyName
    ? questionText.replace(/\[company\]|\[empresa\]/gi, companyName)
    : questionText;

  const currentExistingResponseId = config?.moduleResponseId;
  let buttonText = 'Siguiente';
  if (isSubmitting) {
    buttonText = 'Enviando...';
  } else if (currentExistingResponseId) {
    buttonText = 'Actualizar y continuar';
  } else {
    buttonText = 'Guardar y continuar';
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

        {apiError && (
          <p className="text-sm text-red-600 mb-4 text-center">Error: {apiError}</p>
        )}

        <button
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={selectedValue === null || isSubmitting}
        >
          {buttonText}
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 border rounded bg-gray-50 text-xs text-gray-700 w-full max-w-2xl">
          <h4 className="font-semibold mb-2">[Debug CSATView]</h4>
          <p>Research ID: {researchId}</p>
          <p>Participant ID (from Store): {participantIdFromStore}</p>
          <p>Step ID: {stepId}, Step Name: {stepName}, Step Type: {stepType}</p>
          <p>Existing ModuleResponseID (config): {config?.moduleResponseId || 'N/A'}</p>
          <p>Selected Value: {selectedValue === null ? 'N/A' : selectedValue}</p>
          <p>Is Submitting: {isSubmitting.toString()}</p>
          <p>API Error (Hook): {apiError || 'No'}</p>
          <h5 className="font-semibold mt-2 mb-1">Logs de Eventos:</h5>
          <pre className="whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
            {debugLogs.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CSATView; 