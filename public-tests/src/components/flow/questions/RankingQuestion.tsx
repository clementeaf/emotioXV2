import { useEffect, useState, useMemo } from "react";
import { useParticipantStore } from "../../../stores/participantStore";
import { useResponseAPI } from "../../../hooks/useResponseAPI";
import { ApiClient, APIStatus } from "../../../lib/api";
import { getStandardButtonText } from '../../../utils/formHelpers';

// Componente para Ranking
export const RankingQuestion: React.FC<{
    config: unknown; 
    stepId?: string;    // stepId del flujo
    stepName?: string;  // stepName del flujo
    stepType: string;
    onStepComplete: (answer: unknown) => void; // Se llamará DESPUÉS de un guardado exitoso
    isApiDisabled: boolean; // <<< CAMBIADO de isMock a isApiDisabled
}> = ({ config: initialConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete, isApiDisabled = false }) => {
    // Unificar todas las props de config en un solo objeto seguro
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

    const componentTitle = cfg.title || stepNameFromProps || 'Pregunta de ranking';
    const description = cfg.description;
    const options = Array.isArray(cfg.options) ? cfg.options : [];
    const itemsAreEffectivelyMock = isApiDisabled || options.length === 0 || options.every((item: string) => item.trim() === '');
    const questionText = cfg.questionText || (itemsAreEffectivelyMock ? 'Ordena las siguientes opciones por preferencia (Prueba)' : 'Pregunta de ranking sin texto');
    const itemsFromConfig = useMemo(() => {
        if (Array.isArray(cfg.options)) {
            return cfg.options.filter((item): item is string => typeof item === 'string');
        }
        return [];
    }, [cfg.options]);
    
    // El estado rankedItems almacenará el orden actual de los strings de los items.
    const [rankedItems, setRankedItems] = useState<string[]>([]); 

    // Estados para la API y carga/guardado de datos
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

    // useEffect para cargar datos existentes o inicializar desde config
    useEffect(() => {

        if (isApiDisabled) {
            // Usar los items que vienen en config, que serían los mocks definidos en CurrentStepRenderer
            setRankedItems([...itemsFromConfig]); 
            setDataExisted(false);
            setModuleResponseId(null);
            setDocumentId(null);
            setDataLoading(false);
            return;
        }

        // Si API NO está deshabilitada, intentar cargar
        if (!researchId || !participantId || !stepType) {
            console.warn('[RankingQuestion Load] API enabled, but missing IDs/Type. Using items from config.');
            setRankedItems([...itemsFromConfig]); // Usar items de config (podrían ser los de texto vacío)
            setDataLoading(false);
            setDataExisted(false);
            setModuleResponseId(null);
            setDocumentId(null);
            return;
        }

        const apiClient = new ApiClient();
        setDataLoading(true);
        setApiError(null);
        setRankedItems([]); // Limpiar antes de cargar
        setDataExisted(false);
        setModuleResponseId(null);
        setDocumentId(null);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                let finalOrderToSet: string[] = [...itemsFromConfig]; // Default: use items passed from parent

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
                     // Fallback to itemsFromConfig (already default)
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
                const finalFallback = [...itemsFromConfig]; // Fallback siempre a items de config en error
                setRankedItems(finalFallback);
            })
            .finally(() => {
                setDataLoading(false);
            });
    }, [researchId, participantId, stepType, isApiDisabled, itemsFromConfig]);

    // Texto dinámico para el botón
    const buttonText = getStandardButtonText({
        isSaving: isSaving,
        isLoading: false,
        hasExistingData: !!moduleResponseId && rankedItems.length > 0
    });

    const handleSaveAndProceed = async () => {
        if (isApiDisabled) {
             // Mostrar alerta con los items actuales (que serían los mock)
            const rankedItemsString = rankedItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
            alert(`Orden actual (API deshabilitada):

${rankedItemsString}`);
            // No hacer nada más, no llamar a onStepComplete ni a API
            return;
        }

        // Si API habilitada, intentar guardar
        if (!researchId || !participantId) {
            setApiError("Faltan researchId o participantId para guardar.");
            return;
        }
        
        const currentStepIdForApi = stepIdFromProps || stepType;
        const currentStepNameForApi = componentTitle;

        setIsSaving(true);
        setApiError(null);

        try {
            // Reset errors at the beginning of the attempt
            setApiError(null);
            let success = false;
            const payload = { response: rankedItems };
            let operationResult: unknown; // Usar 'unknown' en vez de 'any' para robustecer el tipado

            if (dataExisted && moduleResponseId) {
                operationResult = await updateResponse(moduleResponseId, payload.response);
            } else {
                 operationResult = await saveResponse(currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                 // If save was successful and gave us IDs, update state (check common patterns for success/data)
                 if (hasSuccess(operationResult) && operationResult.success === true) { // Assuming a 'success' boolean property
                    if (hasData(operationResult) && typeof (operationResult.data as { moduleResponseId?: unknown }).moduleResponseId === 'string') {
                        setModuleResponseId((operationResult.data as { moduleResponseId: string }).moduleResponseId);
                        setDataExisted(true);
                    }
                    if (hasData(operationResult) && typeof (operationResult.data as { documentId?: unknown }).documentId === 'string' && !documentId) {
                        setDocumentId((operationResult.data as { documentId: string }).documentId);
                    }
                 }
            }

            // Determine success based on hook error and operation result
            if (apiHookError) {
                console.error('[RankingQuestion Save] Hook reported error:', apiHookError);
                // Prefer hook error message if it's a string
                setApiError(typeof apiHookError === 'string' ? apiHookError : (hasMessage(operationResult) ? operationResult.message : 'Error en la operación de guardado.'));
                success = false;
            } else if (operationResult) {
                success = true;
                setApiError(null); // Clear any previous form error
            } else {
                // Operation failed: Hook was clear but operationResult was falsy (null, undefined, etc.)
                console.warn('[RankingQuestion Save] Operation failed (hook clear, but no result received).', { operationResult });
                // Use a generic message as we don't have specific info from operationResult here
                setApiError('La operación de guardado falló o no devolvió resultado.');
                success = false;
            }

            // Post-operation actions
            if (success) {
                onStepComplete(payload.response); // Call callback with the saved data
                // Navigation should likely be handled by the parent component reacting to onStepComplete
            } else if (!apiError) {
                 // If success is false, but no specific error was set above (e.g., hook was clear, result had no message)
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
            // Ensure success is false if an exception occurred
            // success = false; // Not strictly needed as it defaults to false and isn't set true in catch
        } finally {
            setIsSaving(false);
        }
    };
    
    const moveItemUp = (index: number) => {
        if (index > 0) {
            // Forma alternativa de crear el nuevo array
            const currentItems = [...rankedItems]; // Copia actual
            const itemToMove = currentItems.splice(index, 1)[0]; // Quita el item
            currentItems.splice(index - 1, 0, itemToMove); // Insértalo en la nueva posición
            setRankedItems(currentItems);
        }
    };

    const moveItemDown = (index: number) => {
        if (index < rankedItems.length - 1) {
             // Forma alternativa de crear el nuevo array
            const currentItems = [...rankedItems]; // Copia actual
            const itemToMove = currentItems.splice(index, 1)[0]; // Quita el item
            currentItems.splice(index + 1, 0, itemToMove); // Insértalo en la nueva posición
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
            <p className="text-neutral-600 mb-4">{questionText}</p>

            {(apiError || apiHookError) && (
              <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span>{apiError || apiHookError}</span>
              </div>
            )}

            <div className="mb-4">
                {rankedItems.map((item, index) => (
                    <div key={`${item}-${index}`} className="flex items-center border rounded-md p-3 mb-2 bg-white shadow-sm">
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

// Type guard para operationResult
const hasSuccess = (obj: unknown): obj is { success: boolean } => typeof obj === 'object' && obj !== null && 'success' in obj && typeof (obj as { success?: unknown }).success === 'boolean';
const hasData = (obj: unknown): obj is { data: unknown } => typeof obj === 'object' && obj !== null && 'data' in obj;
const hasMessage = (obj: unknown): obj is { message: string } => typeof obj === 'object' && obj !== null && 'message' in obj && typeof (obj as { message?: unknown }).message === 'string';