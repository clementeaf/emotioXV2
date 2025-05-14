import { useEffect, useState } from "react";
import { useParticipantStore } from "../../../stores/participantStore";
import { useResponseAPI } from "../../../hooks/useResponseAPI";
import { useModuleResponses } from '../../../hooks/useModuleResponses';
// import { ApiClient, APIStatus } from "../../../lib/api"; // ApiClient y APIStatus ya no son necesarios aquí para cargar

// Componente para SmartVOC Feedback
export const SmartVocFeedbackQuestion: React.FC<{
    stepConfig: any;
    stepId?: string;
    stepName?: string;
    stepType: string;
    onStepComplete: (answer: any) => void;
}> = ({ stepConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete }) => {
    const [currentResponse, setCurrentResponse] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    // const [dataLoading, setDataLoading] = useState(true); // Manejado por useModuleResponses
    const [formApiError, setFormApiError] = useState<string | null>(null); // Renombrado desde apiError para errores de formulario/guardado
    // const [documentId, setDocumentId] = useState<string | null>(null); // Probablemente ya no es necesario directamente aquí
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null);
    const [dataExisted, setDataExisted] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);

    const {
        data: moduleResponsesArray,
        isLoading: isLoadingInitialData,
        error: initialLoadingError
      } = useModuleResponses({
        researchId: researchId === null ? undefined : researchId,
        participantId: participantId === null ? undefined : participantId,
        autoFetch: !!(researchId && participantId)
      });

    // console.log('moduleResponsesArray desde hook:', moduleResponsesArray); // Útil para debug

    const {
        saveResponse,
        updateResponse,
        isLoading: isApiLoading, // Este es el isLoading para las operaciones de save/update
        error: apiHookError, // Este es el error para las operaciones de save/update
    } = useResponseAPI({
        researchId: researchId || '',
        participantId: participantId || ''
    });

    // Texto dinámico para el botón
    let buttonText = 'Siguiente';
    if (isNavigating) {
        buttonText = 'Pasando al siguiente módulo...';
    } else if (isSaving || isApiLoading) {
        buttonText = 'Guardando...';
    } else if (dataExisted && moduleResponseId) {
        buttonText = 'Actualizar y continuar';
    } else {
        buttonText = 'Guardar y continuar';
    }

    // useEffect para procesar las respuestas cargadas por useModuleResponses
    useEffect(() => {
        if (isLoadingInitialData) {
            // Esperar a que el hook termine de cargar
            return;
        }

        setFormApiError(null); // Limpiar errores de formulario de renderizados previos

        if (initialLoadingError) {
            console.error('[SmartVocFeedbackQuestion] Error cargando datos con useModuleResponses:', initialLoadingError);
            setFormApiError(typeof initialLoadingError === 'string' ? initialLoadingError : 'Error al cargar datos previos del módulo.');
            setCurrentResponse('');
            setModuleResponseId(null);
            setDataExisted(false);
            return;
        }

        if (moduleResponsesArray) {
            // Definir un tipo para el item aquí para claridad y para el linter
            type ModuleResponseItemType = { id: string; stepType: string; stepId?: string; stepTitle?: string; response: any; [key: string]: any };

            let foundStepData = moduleResponsesArray.find((item: ModuleResponseItemType) => 
                item.stepType === stepType && item.stepId === stepIdFromProps
            );

            // Fallback: Si no se encontró por stepId, y es un tipo relevante, intentar por stepTitle
            if (!foundStepData && stepType === 'smartvoc_feedback' && stepNameFromProps) {
                console.log(`[SmartVocFeedbackQuestion] Fallback: Buscando por stepType ('${stepType}') y stepNameFromProps ('${stepNameFromProps}')`);
                foundStepData = moduleResponsesArray.find((item: ModuleResponseItemType) => 
                    item.stepType === stepType && item.stepTitle === stepNameFromProps
                );
            }

            if (foundStepData) {
                setCurrentResponse(typeof foundStepData.response === 'string' ? foundStepData.response : '');
                setModuleResponseId(foundStepData.id || null);
                setDataExisted(true);
                // console.log('[SmartVocFeedbackQuestion] Respuesta encontrada y cargada:', foundStepData);
            } else {
                setCurrentResponse('');
                setModuleResponseId(null);
                setDataExisted(false);
                // console.log('[SmartVocFeedbackQuestion] No se encontró respuesta para este stepId/stepType en moduleResponsesArray.');
            }
        } else {
            // moduleResponsesArray es null/undefined, pero no está cargando y no hay error del hook.
            // Puede ser el caso de un nuevo participante sin documento de respuestas aún.
            setCurrentResponse('');
            setModuleResponseId(null);
            setDataExisted(false);
        }
    }, [moduleResponsesArray, isLoadingInitialData, initialLoadingError, stepType, stepIdFromProps]);

    const handleSaveAndProceed = async () => {
        if (!researchId || !participantId) {
            console.error('[SmartVocFeedbackQuestion] Faltan researchId o participantId');
            setFormApiError('Faltan researchId o participantId.');
            return;
        }
        if (!currentResponse && stepConfig.required) {
            setFormApiError('Por favor, ingresa una respuesta.');
            return;
        }

        setIsSaving(true);
        setFormApiError(null); // Limpiar error de formulario antes de intentar guardar

        const payload = { response: currentResponse };
        let success = false;

        try {
            if (dataExisted && moduleResponseId) {
                await updateResponse(moduleResponseId, payload);
                if (apiHookError) throw new Error(apiHookError); // apiHookError se actualiza por el hook useResponseAPI
                success = true;
            } else {
                const result = await saveResponse(stepIdFromProps || '', stepType, stepNameFromProps || 'Feedback Corto', payload);
                if (apiHookError) throw new Error(apiHookError);
                if (result && result.id) {
                    setDataExisted(true);
                    setModuleResponseId(result.id);
                }
                success = true;
            }
        } catch (error: any) {
            console.error('[SmartVocFeedbackQuestion] Error en operación de guardado/actualización:', error);
            // Si el error viene del hook (ya que lo lanzamos), no lo seteamos de nuevo para evitar duplicados en UI
            if (!apiHookError) {
                setFormApiError(error.message || 'Error al guardar la respuesta.');
            }
            success = false;
        } finally {
            setIsSaving(false);
        }

        if (success) {
            setIsNavigating(true);
            setTimeout(() => {
                onStepComplete(currentResponse);
                 setIsNavigating(false); // Resetear estado de navegación
            }, 500);
        }
    };

    if (isLoadingInitialData) {
        return (
            <div className="w-full p-6 text-center">
                <p className="text-gray-600">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <h2 className="text-xl font-medium text-center mb-4">{stepNameFromProps || 'Feedback'}</h2>
            <p className="text-center mb-6">{stepType === 'smartvoc_feedback' ? 'Por favor, cuéntanos más sobre tu experiencia.' : 'Por favor, escribe tu respuesta aquí...'}</p>

            {(formApiError || apiHookError) && (
                <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span>{formApiError || apiHookError}</span>
                </div>
            )}

            <textarea
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-400 focus:border-primary-400 mb-6"
                placeholder={stepType === 'smartvoc_feedback' ? 'Por favor, cuéntanos más sobre tu experiencia...' : 'Por favor, escribe tu respuesta aquí...'}
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                disabled={isSaving || isApiLoading || isLoadingInitialData || isNavigating}
            />
            <div className="flex justify-center">
                <button
                    onClick={handleSaveAndProceed}
                    disabled={isSaving || isApiLoading || isLoadingInitialData || isNavigating}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {buttonText}
                </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-2 bg-gray-50 text-xs text-gray-500 border rounded">
                    <p className="font-semibold">[Debug SmartVocFeedbackQuestion]</p>
                    <p>Research ID: {researchId || 'N/A'}, Participant ID: {participantId || 'N/A'}</p>
                    <p>StepType Prop: {stepType}, StepId Prop: {stepIdFromProps || 'N/A'}, StepName Prop: {stepNameFromProps || 'N/A'}</p>
                    <p>Hook isLoadingInitialData: {isLoadingInitialData.toString()}</p>
                    <p>Hook initialLoadingError: {initialLoadingError ? JSON.stringify(initialLoadingError) : 'No'}</p>
                    <p>Data Existed (este módulo específico): {dataExisted.toString()}</p>
                    <p>ModuleResponse ID (este módulo): {moduleResponseId || 'N/A'}</p>
                    <hr className="my-1" />
                    <p>Form API Error: {formApiError || 'No'}</p>
                    <p>Hook (Save/Update) isApiLoading: {isApiLoading.toString()}</p>
                    <p>Hook (Save/Update) apiHookError: {apiHookError || 'No'}</p>
                    <p>Form isSaving: {isSaving.toString()}</p>
                    <p>Método a usar (al guardar): {(dataExisted && moduleResponseId) ? 'PUT (actualizar)' : 'POST (crear)'}</p>
                    <hr className="my-1" />
                    <div>Respuesta actual en estado: <pre className="whitespace-pre-wrap">{JSON.stringify(currentResponse, null, 2)}</pre></div>
                </div>
            )}
        </div>
    );
};