import React, { useState, useEffect } from 'react';
import { SmartVOCQuestion } from '../../../types/smart-voc.interface';
import { useParticipantStore } from '../../../stores/participantStore';
import { useModuleResponses } from '../../../hooks/useModuleResponses';
import { useResponseAPI } from '../../../hooks/useResponseAPI';
import { getStandardButtonText, getButtonDisabledState, getErrorDisplayProps, formSpacing } from '../../../utils/formHelpers';

interface VOCTextQuestionProps {
  questionConfig: SmartVOCQuestion;
  researchId: string;
  moduleId: string;
  onSaveSuccess: (questionId: string, value: string, moduleResponseId: string | null) => void;
}

export const VOCTextQuestion: React.FC<VOCTextQuestionProps> = ({ questionConfig, researchId, moduleId, onSaveSuccess }) => {
  const { id: questionId, description, type: questionType, title: questionTitle } = questionConfig;
  const participantId = useParticipantStore(state => state.participantId);

  const [textValue, setTextValue] = useState<string>('');
  const [internalModuleResponseId, setInternalModuleResponseId] = useState<string | null>(null);
  const [hasExistingData, setHasExistingData] = useState<boolean>(false);

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

  // Cargar valor inicial desde la API
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
        
        // Buscar por múltiples criterios para máxima compatibilidad
        return (
          // Por stepType + moduleId (nuevo formato)
          (resp.stepType === questionType && resp.moduleId === moduleId) ||
          // Por stepId + moduleId (formato anterior)
          (resp.stepId === questionId && resp.moduleId === moduleId) ||
          // Por stepType solamente si coincide con el questionType
          (resp.stepType === questionType) ||
          // Por stepTitle si contiene el questionId
          (typeof resp.stepTitle === 'string' && resp.stepTitle.includes(questionId)) ||
          // Por id si coincide con questionId
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
        typeof (foundResponse as { response?: { value?: unknown } }).response?.value === 'string'
      ) {
        const responseValue = (foundResponse as { response: { value: string } }).response.value;
        console.log(`[VOCTextQuestion] Cargando respuesta existente para ${questionId}:`, responseValue);
        setTextValue(responseValue);
        setHasExistingData(!!responseValue); // Marcar como existente si hay valor
        setInternalModuleResponseId(
          'id' in foundResponse && typeof (foundResponse as { id?: unknown }).id === 'string'
            ? (foundResponse as { id: string }).id
            : null
        );
      } else {
        console.log(`[VOCTextQuestion] No se encontró respuesta previa para ${questionId}`);
        setTextValue('');
        setHasExistingData(false);
        setInternalModuleResponseId(null);
      }
    }
  }, [moduleResponsesArray, isLoadingInitialData, loadingError, questionId, moduleId, questionType]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextValue(e.target.value);
    if (submissionError) setSubmissionError(null);
  };

  const handleSaveOrUpdateClick = async () => {
    if (!participantId || participantId.trim() === '') {
      setSubmissionError('Error: participantId vacío.');
      return;
    }
    if (!textValue.trim()) {
      setSubmissionError('Por favor, escribe tu respuesta.');
      return;
    }
    const responseData = { value: textValue };
    const result = await saveOrUpdateResponse(
      questionId,
      questionType,
      questionTitle || description || questionId,
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
      onSaveSuccess(questionId, textValue, newId || internalModuleResponseId || null);
    } else if (!result && !submissionError) {
      setSubmissionError('Ocurrió un error desconocido al guardar.');
    }
  };

  // Usar sistema estandarizado para determinar texto del botón
  const buttonText = getStandardButtonText({ 
    isSaving: isSubmitting, 
    isLoading: isLoadingInitialData, 
    hasExistingData: hasExistingData && !!textValue.trim()
  });

  const isButtonDisabled = getButtonDisabledState({
    isRequired: true,
    value: textValue,
    isSaving: isSubmitting,
    isLoading: isLoadingInitialData,
    hasError: !!(submissionError || loadingError)
  });

  const errorDisplay = getErrorDisplayProps(submissionError || loadingError);

  if (!description) {
    return <div className="text-red-600">Error: Falta la descripción de la pregunta.</div>;
  }

  if (isLoadingInitialData) {
    return <div className="p-4 text-center text-gray-500">Cargando pregunta...</div>;
  }

  return (
    <div className="space-y-3 flex flex-col items-center w-full">
      <label htmlFor={`voc-text-${questionId}`} className={`block text-base md:text-lg font-medium text-gray-800 ${formSpacing.field}`}>
        {description}
      </label>
      <textarea
        id={`voc-text-${questionId}`}
        rows={4}
        className="w-full max-w-xl px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
        value={textValue}
        onChange={handleChange}
        placeholder="Escribe tu respuesta aquí..."
        disabled={isSubmitting || isLoadingInitialData}
      />
      
      {errorDisplay.hasError && (
        <p className={errorDisplay.errorClassName}>
          Error: {errorDisplay.errorMessage}
        </p>
      )}
      
      <button
        className={`${formSpacing.button} bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={handleSaveOrUpdateClick}
        disabled={isButtonDisabled}
      >
        {buttonText}
      </button>
    </div>
  );
}; 