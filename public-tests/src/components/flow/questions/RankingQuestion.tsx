import { useEffect, useMemo, useState } from "react";
import { useResponseAPI } from "../../../hooks/useResponseAPI";
import { ApiClient, APIStatus } from "../../../lib/api";
import { useParticipantStore } from "../../../stores/participantStore";
import { getStandardButtonText } from '../../../utils/formHelpers';

export const RankingQuestion: React.FC<{
    config: unknown;
    stepId?: string;
    stepName?: string;
    stepType: string;
    onStepComplete: (answer: unknown) => void;
    isApiDisabled: boolean;
}> = ({ config: initialConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete, isApiDisabled = false }) => {
    const cfg = (typeof initialConfig === 'object' && initialConfig !== null)
      ? initialConfig as {
          title?: string;
          description?: string;
          questionText?: string;
          options?: string[];
          savedResponses?: string[];
          required?: boolean;
        }
      : {};



    const componentTitle = cfg.title || stepNameFromProps || '';
    const description = cfg.description;
    const questionText = cfg.questionText || '';
    const itemsFromConfig = useMemo(() => {
                // Primero intentar con options
        if (Array.isArray(cfg.options)) {
            return cfg.options.filter((item): item is string => typeof item === 'string');
        }

        // Si no hay options, intentar con choices (formato del backend)
        const choices = (cfg as any).choices;
        if (Array.isArray(choices)) {
            // choices podría ser array de objetos con { text: string } o strings directos
            return choices.map((choice: any) => {
                if (typeof choice === 'string') return choice;
                if (choice && typeof choice.text === 'string') return choice.text;
                return '';
            }).filter((item: string) => item.trim() !== '');
        }

        return [];
    }, [cfg.options, (cfg as any).choices]);

    const [rankedItems, setRankedItems] = useState<string[]>([]);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataExisted, setDataExisted] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null);

    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);

    const {
        saveResponse,
        updateResponse,
        isLoading: isApiLoading,
        error: apiHookError,
    } = useResponseAPI({
        researchId: researchId || '',
        participantId: participantId || ''
    });

    useEffect(() => {

        if (isApiDisabled) {
            setRankedItems([...itemsFromConfig]);
            setDataExisted(false);
            setModuleResponseId(null);
            setDocumentId(null);
            setDataLoading(false);
            return;
        }

        if (!researchId || !participantId || !stepType) {
            console.warn('[RankingQuestion Load] API enabled, but missing IDs/Type. Using items from config.');
            setRankedItems([...itemsFromConfig]);
            setDataLoading(false);
            setDataExisted(false);
            setModuleResponseId(null);
            setDocumentId(null);
            return;
        }

        const apiClient = new ApiClient();
        setDataLoading(true);
        setApiError(null);
        setRankedItems([]);
        setDataExisted(false);
        setModuleResponseId(null);
        setDocumentId(null);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                let finalOrderToSet: string[] = [...itemsFromConfig];

                if (
                  !apiResponse.error &&
                  typeof apiResponse.data === 'object' && apiResponse.data !== null &&
                  'data' in apiResponse.data &&
                  typeof (apiResponse.data as { data?: unknown }).data === 'object' &&
                  (apiResponse.data as { data?: unknown }).data !== null
                ) {
                    const fullDocument = (apiResponse.data as { data: { id: string, responses: Array<{id: string, stepType: string, response: unknown}> } }).data;
                    setDocumentId(fullDocument.id);
                    const foundStepData = fullDocument.responses.find(item => item.stepType === stepType);

                    if (foundStepData && Array.isArray(foundStepData.response) && foundStepData.response.length > 0) {
                        const savedOrderFromApi = foundStepData.response as string[];

                        if (savedOrderFromApi.every(item => typeof item === 'string')) {
                            finalOrderToSet = savedOrderFromApi;
                            setModuleResponseId(foundStepData.id || null);
                            setDataExisted(true);
                        } else {
                             console.warn('[RankingQuestion Load] API response for step exists, but response format is invalid (not array of strings). Using order from config as fallback.');
                             setDataExisted(false);
                             setModuleResponseId(null);
                        }
                    } else {
                        setDataExisted(false);
                        setModuleResponseId(null);
                    }
                } else {
                    if (apiResponse.apiStatus !== APIStatus.NOT_FOUND) {
                        setApiError(apiResponse.message || 'Error cargando datos del módulo.');
                    }

                     setDataExisted(false);
                     setModuleResponseId(null);
                }

                setRankedItems(finalOrderToSet);
            })
            .catch(error => {
                console.error('[RankingQuestion Load] EXCEPTION during API call:', error);
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                setDataExisted(false);
                setModuleResponseId(null);
                const finalFallback = [...itemsFromConfig];
                setRankedItems(finalFallback);
            })
            .finally(() => {
                setDataLoading(false);
            });
    }, [researchId, participantId, stepType, isApiDisabled, itemsFromConfig]);

    const hasExistingData = !!moduleResponseId && rankedItems.length > 0;

    const buttonText = getStandardButtonText({
        isSaving: isSaving,
        isLoading: false,
        hasExistingData,
        customCreateText: 'Guardar y continuar',
        customUpdateText: 'Actualizar y continuar'
    });

    const handleSaveAndProceed = async () => {
        if (isApiDisabled) {
            return;
        }

        if (!researchId || !participantId) {
            setApiError("Faltan researchId o participantId para guardar.");
            return;
        }

        const currentStepIdForApi = stepIdFromProps || stepType;
        const currentStepNameForApi = componentTitle;

        setIsSaving(true);
        setApiError(null);

        try {
            setApiError(null);
            let success = false;
            const payload = { response: rankedItems };
            let operationResult: unknown;

            if (dataExisted && moduleResponseId) {
                operationResult = await updateResponse(moduleResponseId, payload.response);
            } else {
                 operationResult = await saveResponse(currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                 if (hasSuccess(operationResult) && operationResult.success === true) {
                    if (hasData(operationResult) && typeof (operationResult.data as { moduleResponseId?: unknown }).moduleResponseId === 'string') {
                        setModuleResponseId((operationResult.data as { moduleResponseId: string }).moduleResponseId);
                        setDataExisted(true);
                    }
                    if (hasData(operationResult) && typeof (operationResult.data as { documentId?: unknown }).documentId === 'string' && !documentId) {
                        setDocumentId((operationResult.data as { documentId: string }).documentId);
                    }
                 }
            }

            if (apiHookError) {
                console.error('[RankingQuestion Save] Hook reported error:', apiHookError);
                setApiError(typeof apiHookError === 'string' ? apiHookError : (hasMessage(operationResult) ? operationResult.message : 'Error en la operación de guardado.'));
                success = false;
            } else if (operationResult) {
                success = true;
                setApiError(null);
            } else {
                console.warn('[RankingQuestion Save] Operation failed (hook clear, but no result received).', { operationResult });
                setApiError('La operación de guardado falló o no devolvió resultado.');
                success = false;
            }

            if (success) {
                onStepComplete(payload.response);
            } else if (!apiError) {
                 console.warn('[RankingQuestion Save] Operation failed, setting generic error.');
                 setApiError('La operación de guardado no parece haber tenido éxito.');
            }

        } catch (error: unknown) {
            console.error('[RankingQuestion Save] EXCEPTION during save/update:', error);
            if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
                setApiError((error as { message: string }).message);
            } else {
                setApiError('Error inesperado durante el guardado.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const moveItemUp = (index: number) => {
        if (index > 0) {
            const currentItems = [...rankedItems];
            const itemToMove = currentItems.splice(index, 1)[0];
            currentItems.splice(index - 1, 0, itemToMove);
            setRankedItems(currentItems);
        }
    };

    const moveItemDown = (index: number) => {
        if (index < rankedItems.length - 1) {
            const currentItems = [...rankedItems];
            const itemToMove = currentItems.splice(index, 1)[0];
            currentItems.splice(index + 1, 0, itemToMove);
            setRankedItems(currentItems);
        }
    };

    if (dataLoading && !isApiDisabled) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                <p className="text-gray-600">Cargando...</p>
            </div>
        );
    }



    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{componentTitle}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            {questionText && <p className="text-neutral-600 mb-4">{questionText}</p>}

            <div className="mb-4">
                {rankedItems.length === 0 && <p className="text-red-500">⚠️ No hay opciones para mostrar</p>}
                {rankedItems.map((item, index) => (
                    <div key={`${item}-${index}`} className="flex items-center justify-between border rounded-md p-3 mb-2 bg-white shadow-sm">
                        <span className="text-lg text-neutral-700">{item}</span>
                        <div className="flex space-x-1">
                            <button
                                onClick={() => moveItemUp(index)}
                                disabled={index === 0 || isSaving || isApiLoading || dataLoading}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent text-lg text-neutral-600 disabled:text-neutral-400 transition-colors"
                                aria-label={`Mover ${item.trim() === '' ? 'item sin texto' : item} hacia arriba`}
                            >
                                ▲
                            </button>
                            <button
                                onClick={() => moveItemDown(index)}
                                disabled={index === rankedItems.length - 1 || isSaving || isApiLoading || dataLoading}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent text-lg text-neutral-600 disabled:text-neutral-400 transition-colors"
                                aria-label={`Mover ${item.trim() === '' ? 'item sin texto' : item} hacia abajo`}
                            >
                                ▼
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={handleSaveAndProceed}
                disabled={isSaving || isApiLoading || dataLoading}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                {buttonText}
            </button>
        </div>
    );
};

const hasSuccess = (obj: unknown): obj is { success: boolean } => typeof obj === 'object' && obj !== null && 'success' in obj && typeof (obj as { success?: unknown }).success === 'boolean';
const hasData = (obj: unknown): obj is { data: unknown } => typeof obj === 'object' && obj !== null && 'data' in obj;
const hasMessage = (obj: unknown): obj is { message: string } => typeof obj === 'object' && obj !== null && 'message' in obj && typeof (obj as { message?: unknown }).message === 'string';
