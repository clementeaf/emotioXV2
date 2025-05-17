import { useEffect, useState } from "react";
import { useParticipantStore } from "../../../stores/participantStore";
import { useResponseAPI } from "../../../hooks/useResponseAPI";
import { ApiClient, APIStatus } from "../../../lib/api";

// Componente para Ranking
export const RankingQuestion: React.FC<{
    config: any; 
    stepId?: string;    // stepId del flujo
    stepName?: string;  // stepName del flujo
    stepType: string;
    onStepComplete: (answer: any) => void; // Se llamará DESPUÉS de un guardado exitoso
    isApiDisabled: boolean; // <<< CAMBIADO de isMock a isApiDisabled
}> = ({ config: initialConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete, isApiDisabled = false }) => {
    console.log(`[RankingQuestion Start Render] Received isApiDisabled (after default): ${isApiDisabled}, type: ${typeof isApiDisabled}`);
    const componentTitle = initialConfig?.title || stepNameFromProps || 'Pregunta de ranking';
    const description = initialConfig?.description;
    // Ajustar el texto de la pregunta para reflejar el estado de isApiDisabled o la validez de los items
    const itemsAreEffectivelyMock = isApiDisabled || !initialConfig?.items || initialConfig?.items.length === 0 || initialConfig?.items.every((item: string) => item.trim() === '');
    const questionText = initialConfig?.questionText || (itemsAreEffectivelyMock ? 'Ordena las siguientes opciones por preferencia (Prueba)' : 'Pregunta de ranking sin texto');
    const itemsFromConfig = initialConfig?.items || (itemsAreEffectivelyMock ? ['Item de Prueba A', 'Item de Prueba B', 'Item de Prueba C'] : []);
    
    // El estado rankedItems almacenará el orden actual de los strings de los items.
    const [rankedItems, setRankedItems] = useState<string[]>([]); 

    // Estados para la API y carga/guardado de datos
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataExisted, setDataExisted] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

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
        console.log(`[RankingQuestion Load] useEffect RUNNING. isApiDisabled: ${isApiDisabled}, researchId: ${researchId}, participantId: ${participantId}, stepType: ${stepType}`);

        if (isApiDisabled) {
            console.log('[RankingQuestion Load] API is disabled. Using mock items.');
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
                console.log('[RankingQuestion Load] API Response received:', apiResponse);
                let finalOrderToSet: string[] = [...itemsFromConfig]; // Default: use items passed from parent
                let usedApiData = false;

                if (!apiResponse.error && apiResponse.data?.data) {
                    const fullDocument = apiResponse.data.data as { id: string, responses: Array<{id: string, stepType: string, response: any}> };
                    setDocumentId(fullDocument.id);
                    const foundStepData = fullDocument.responses.find(item => item.stepType === stepType);
                    
                    console.log('[RankingQuestion Load] Found step data from API:', foundStepData);

                    if (foundStepData && Array.isArray(foundStepData.response) && foundStepData.response.length > 0) {
                        const savedOrderFromApi = foundStepData.response as string[];

                        if (savedOrderFromApi.every(item => typeof item === 'string')) {
                            console.log('[RankingQuestion Load] API provided valid saved order. Using it directly:', savedOrderFromApi);
                            finalOrderToSet = savedOrderFromApi;
                            setModuleResponseId(foundStepData.id || null);
                            setDataExisted(true);
                            usedApiData = true;
                        } else {
                             console.warn('[RankingQuestion Load] API response for step exists, but response format is invalid (not array of strings). Using order from config as fallback.');
                             setDataExisted(false);
                             setModuleResponseId(null);
                        }
                    } else {
                        console.log('[RankingQuestion Load] No step data found in API response for this stepType (or response was empty). Using order from config.');
                        setDataExisted(false);
                        setModuleResponseId(null);
                    }
                } else {
                    console.log('[RankingQuestion Load] API response error or no data.data field. Using order from config.');
                    if (apiResponse.apiStatus !== APIStatus.NOT_FOUND) {
                        setApiError(apiResponse.message || 'Error cargando datos del módulo.');
                    }
                     // Fallback to itemsFromConfig (already default)
                     setDataExisted(false);
                     setModuleResponseId(null);
                }
                
                console.log(`[RankingQuestion Load] Final order to set (API data used: ${usedApiData}):`, finalOrderToSet);
                setRankedItems(finalOrderToSet);
            })
            .catch(error => {
                console.error('[RankingQuestion Load] EXCEPTION during API call:', error);
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                setDataExisted(false);
                setModuleResponseId(null);
                const finalFallback = [...itemsFromConfig]; // Fallback siempre a items de config en error
                console.log('[RankingQuestion Load] Setting fallback order due to exception:', finalFallback);
                setRankedItems(finalFallback);
            })
            .finally(() => {
                console.log('[RankingQuestion Load] useEffect API call finished.');
                setDataLoading(false);
            });
    }, [researchId, participantId, stepType, isApiDisabled, JSON.stringify(itemsFromConfig)]); // Quitar initialConfig.savedResponses, ya se maneja internamente

    // Texto dinámico para el botón
    let buttonText = 'Siguiente';
    if (isNavigating) {
        buttonText = 'Pasando al siguiente módulo...';
    } else if (isSaving || isApiLoading) {
        buttonText = 'Guardando...';
    } else if (!isApiDisabled && dataExisted && moduleResponseId) {
        buttonText = 'Actualizar y continuar';
    } else { // Cubre (!isApiDisabled && !dataExisted) O (isApiDisabled)
        buttonText = 'Guardar y continuar';
    }

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
            let operationResult: any; // Use 'any' for now to avoid type issues, can refine later

            if (dataExisted && moduleResponseId) {
                console.log('[RankingQuestion Save] Attempting UPDATE with:', payload);
                operationResult = await updateResponse(moduleResponseId, payload.response);
                console.log('[RankingQuestion Save] UPDATE result:', operationResult);
            } else {
                 console.log('[RankingQuestion Save] Attempting SAVE with:', payload);
                 operationResult = await saveResponse(currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                 console.log('[RankingQuestion Save] SAVE result:', operationResult);
                 // If save was successful and gave us IDs, update state (check common patterns for success/data)
                 if (operationResult?.success === true) { // Assuming a 'success' boolean property
                    if (operationResult.data?.moduleResponseId) {
                        setModuleResponseId(operationResult.data.moduleResponseId);
                        setDataExisted(true);
                    }
                    if(operationResult.data?.documentId && !documentId) {
                        setDocumentId(operationResult.data.documentId);
                    }
                 }
            }

            // Determine success based on hook error and operation result
            if (apiHookError) {
                console.error('[RankingQuestion Save] Hook reported error:', apiHookError);
                // Prefer hook error message if it's a string
                setApiError(typeof apiHookError === 'string' ? apiHookError : (operationResult?.message || 'Error en la operación de guardado.'));
                success = false;
            } else if (operationResult) {
                console.log('[RankingQuestion Save] Operation seems successful (hook clear, received result).');
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
                console.log('[RankingQuestion Save] Save/Update successful. Calling onStepComplete.');
                onStepComplete(payload.response); // Call callback with the saved data
                // Navigation should likely be handled by the parent component reacting to onStepComplete
            } else if (!apiError) {
                 // If success is false, but no specific error was set above (e.g., hook was clear, result had no message)
                 console.warn('[RankingQuestion Save] Operation failed, setting generic error.');
                 setApiError('La operación de guardado no parece haber tenido éxito.');
            }

        } catch (error: any) {
            console.error('[RankingQuestion Save] EXCEPTION during save/update:', error);
            setApiError(error.message || 'Error inesperado durante el guardado.');
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
            console.log('[RankingQuestion] moveItemUp - setting new items:', currentItems);
            setRankedItems(currentItems);
        }
    };

    const moveItemDown = (index: number) => {
        if (index < rankedItems.length - 1) {
             // Forma alternativa de crear el nuevo array
            const currentItems = [...rankedItems]; // Copia actual
            const itemToMove = currentItems.splice(index, 1)[0]; // Quita el item
            currentItems.splice(index + 1, 0, itemToMove); // Insértalo en la nueva posición
             console.log('[RankingQuestion] moveItemDown - setting new items:', currentItems);
            setRankedItems(currentItems);
        }
    };
    
    // useEffect para observar cambios en rankedItems (ya existente y útil)
    useEffect(() => {
        console.log('[RankingQuestion] rankedItems state updated:', rankedItems);
    }, [rankedItems]);

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
                                disabled={index === 0 || isSaving || isApiLoading || dataLoading || isNavigating}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent text-lg text-neutral-600 disabled:text-neutral-400 transition-colors"
                                aria-label={`Mover ${item.trim() === '' ? 'item sin texto' : item} hacia arriba`}
                            >
                                ▲
                            </button>
                            <button 
                                onClick={() => moveItemDown(index)} 
                                disabled={index === rankedItems.length - 1 || isSaving || isApiLoading || dataLoading || isNavigating}
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
                disabled={isSaving || isApiLoading || dataLoading || isNavigating}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                {buttonText}
            </button>
        </div>
    );
};