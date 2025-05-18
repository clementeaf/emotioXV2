import { useEffect, useState } from "react";
import { useParticipantStore } from "../../../stores/participantStore";
import { useResponseAPI } from "../../../hooks/useResponseAPI";
import { useModuleResponses } from '../../../hooks/useModuleResponses';

interface SmartVocFeedbackQuestionProps {
    stepConfig: unknown;
    stepId?: string;
    stepName?: string;
    stepType: string;
    onStepComplete: (answer: unknown) => void;
}

export const SmartVocFeedbackQuestion: React.FC<SmartVocFeedbackQuestionProps> = ({ stepConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete }) => {
    // Unificar todas las props de config en un solo objeto seguro
    const cfg = (typeof stepConfig === 'object' && stepConfig !== null)
      ? stepConfig as {
          title?: string;
          description?: string;
          questionText?: string;
          savedResponses?: string;
          required?: boolean;
        }
      : {};

    const componentTitle = cfg.title || stepNameFromProps || 'Feedback';
    const description = cfg.description;
    const questionText = cfg.questionText || '¿Tienes algún comentario adicional?';
    const savedResponses = typeof cfg.savedResponses === 'string' ? cfg.savedResponses : '';
    const required = typeof cfg.required === 'boolean' ? cfg.required : false;

    const [currentResponse, setCurrentResponse] = useState(savedResponses);
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

        if (Array.isArray(moduleResponsesArray)) {
            type ModuleResponseItemType = { id: string; stepType: string; stepId?: string; stepTitle?: string; response: unknown; [key: string]: unknown };
            const foundStepData = moduleResponsesArray.find((item: unknown) => {
                if (typeof item !== 'object' || item === null) return false;
                const it = item as ModuleResponseItemType;
                return it.stepType === stepType && (it.stepId === stepIdFromProps || it.stepTitle === stepNameFromProps);
            });
            if (foundStepData && typeof (foundStepData as ModuleResponseItemType).response === 'string') {
                setCurrentResponse((foundStepData as ModuleResponseItemType).response as string);
            }
        }
    }, [moduleResponsesArray, isLoadingInitialData, initialLoadingError, stepType, stepIdFromProps, stepNameFromProps]);

    const handleSaveAndProceed = async () => {
        if (!researchId || !participantId) {
            console.error('[SmartVocFeedbackQuestion] Faltan researchId o participantId');
            setFormApiError('Faltan researchId o participantId.');
            return;
        }
        if (!currentResponse && required) {
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
                if (
                  result &&
                  typeof result === 'object' &&
                  result !== null &&
                  'id' in result &&
                  typeof (result as { id?: unknown }).id === 'string'
                ) {
                    setModuleResponseId((result as { id: string }).id);
                    setDataExisted(true);
                    success = true;
                }
            }
        } catch (error: unknown) {
            console.error('[SmartVocFeedbackQuestion] Error en operación de guardado/actualización:', error);
            if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
                setFormApiError((error as { message: string }).message);
            } else {
                setFormApiError('Error desconocido al guardar feedback.');
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
            <h2 className="text-xl font-medium text-center mb-4">{componentTitle}</h2>
            <p className="text-center mb-6">{description}</p>

            {(formApiError || apiHookError) && (
                <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span>{formApiError || apiHookError}</span>
                </div>
            )}

            <textarea
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-400 focus:border-primary-400 mb-6"
                placeholder={questionText}
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