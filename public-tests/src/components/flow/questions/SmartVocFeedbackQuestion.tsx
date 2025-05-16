import { useEffect, useState } from "react";
import { useParticipantStore } from "../../../stores/participantStore";
import { useResponseAPI } from "../../../hooks/useResponseAPI";
import { useModuleResponses } from '../../../hooks/useModuleResponses';

export const SmartVocFeedbackQuestion: React.FC<{
    stepConfig: any;
    stepId?: string;
    stepName?: string;
    stepType: string;
    onStepComplete: (answer: any) => void;
}> = ({ stepConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete }) => {
    const [currentResponse, setCurrentResponse] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [formApiError, setFormApiError] = useState<string | null>(null);
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

    const {
        saveResponse,
        updateResponse,
        isLoading: isApiLoading,
        error: apiHookError,
    } = useResponseAPI({
        researchId: researchId || '',
        participantId: participantId || ''
    });

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

    useEffect(() => {
        if (isLoadingInitialData) {
            return;
        }

        setFormApiError(null);

        if (initialLoadingError) {
            console.error('[SmartVocFeedbackQuestion] Error cargando datos con useModuleResponses:', initialLoadingError);
            setFormApiError(typeof initialLoadingError === 'string' ? initialLoadingError : 'Error al cargar datos previos del módulo.');
            setCurrentResponse('');
            setModuleResponseId(null);
            setDataExisted(false);
            return;
        }

        if (moduleResponsesArray) {
            type ModuleResponseItemType = { id: string; stepType: string; stepId?: string; stepTitle?: string; response: any; [key: string]: any };

            let foundStepData = moduleResponsesArray.find((item: ModuleResponseItemType) => 
                item.stepType === stepType && item.stepId === stepIdFromProps
            );

            if (!foundStepData && stepType === 'smartvoc_feedback' && stepNameFromProps) {
                foundStepData = moduleResponsesArray.find((item: ModuleResponseItemType) => 
                    item.stepType === stepType && item.stepTitle === stepNameFromProps
                );
            }

            if (foundStepData) {
                setCurrentResponse(typeof foundStepData.response === 'string' ? foundStepData.response : '');
                setModuleResponseId(foundStepData.id || null);
                setDataExisted(true);
            } else {
                setCurrentResponse('');
                setModuleResponseId(null);
                setDataExisted(false);
            }
        } else {
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
        setFormApiError(null);

        const payload = { response: currentResponse };
        let success = false;

        try {
            if (dataExisted && moduleResponseId) {
                await updateResponse(moduleResponseId, payload);
                if (apiHookError) throw new Error(apiHookError);
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
                 setIsNavigating(false);
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
        </div>
    );
};