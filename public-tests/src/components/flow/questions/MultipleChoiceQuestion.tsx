import { useEffect, useState, useMemo } from "react";
import { useParticipantStore } from "../../../stores/participantStore";
import { useResponseAPI } from "../../../hooks/useResponseAPI";
import { ApiClient, APIStatus } from "../../../lib/api";

interface MultipleChoiceQuestionProps {
    stepConfig?: any;
    stepId?: string;
    stepName?: string;
    stepType: string;
    onStepComplete: (answer: any) => void;
    isMock: boolean;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
    stepConfig: initialConfig,
    stepId: stepIdFromProps,
    stepName: stepNameFromProps,
    stepType,
    onStepComplete,
    isMock
}) => {
    console.log(`[MCQ Start Render] stepType: ${stepType}, isMock: ${isMock}, Received initialConfig: ${JSON.stringify(initialConfig)}`);

    const componentTitle = initialConfig?.title ?? stepNameFromProps ?? 'Pregunta de opciones múltiples';
    const description = initialConfig?.description;
    const questionText = initialConfig?.questionText ?? (isMock ? 'Selecciona todas las opciones que apliquen (Prueba)' : 'Por favor, selecciona una o más opciones.');

    const displayOptions = useMemo(() => {
        console.log(`[MCQ useMemo displayOptions] Recalculando. isMock: ${isMock}, initialConfig?.choices: ${JSON.stringify(initialConfig?.choices)}`);
        const choicesFromConfig = initialConfig?.choices;
        const calculatedOptions = Array.isArray(choicesFromConfig)
            ? choicesFromConfig.map((choice: any) => choice?.text || '').filter((text: string) => text !== '')
            : (isMock ? ['Opción Múltiple Mock A', 'Opción Múltiple Mock B', 'Opción Múltiple Mock C'] : []);

        if (calculatedOptions.length === 0 && !isMock) {
            return ['Opción Múltiple A (sin texto)', 'Opción Múltiple B (sin texto)', 'Opción Múltiple C (sin texto)'];
        }
        return calculatedOptions;
    }, [initialConfig?.choices, isMock]);

    const minSelections = initialConfig?.minSelections ?? 0;
    const maxSelections = initialConfig?.maxSelections > 0 ? initialConfig.maxSelections : displayOptions.length;

    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(!isMock);
    const [dataExisted, setDataExisted] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);

    const { saveResponse, updateResponse, isLoading: isApiLoading, error: apiHookError } = useResponseAPI({
        researchId: researchId || '',
        participantId: participantId || ''
    });
    
    useEffect(() => {
        console.log(`[MCQ useEffect 1 (Mock/Initial)] Running. isMock: ${isMock}, researchId: ${researchId}, participantId: ${participantId}, stepType: ${stepType}, initialConfig?.savedResponses: ${JSON.stringify(initialConfig?.savedResponses)}, displayOptions: ${JSON.stringify(displayOptions)}`);
        if (isMock) {
            const mockSaved = initialConfig?.savedResponses || [];
            setSelectedOptions(Array.isArray(mockSaved) ? mockSaved.filter(opt => displayOptions.includes(opt)) : []);
            setDataLoading(false);
        } else if (!researchId || !participantId || !stepType) {
            console.warn('[MCQ useEffect 1] Carga OMITIDA por falta de IDs/stepType en modo no-mock.');
            setDataLoading(false);
            setSelectedOptions([]);
        }
    }, [isMock, researchId, participantId, stepType, initialConfig?.savedResponses, displayOptions]);

    useEffect(() => {
        console.log(`[MCQ useEffect 2 (API Load)] Running. researchId: ${researchId}, participantId: ${participantId}, stepType: ${stepType}, isMock: ${isMock}`);
        if (isMock || !researchId || !participantId || !stepType) {
            if (!isMock) console.log('[MCQ useEffect 2] Skipping API load due to missing researchId, participantId, or stepType.');
            return;
        }
        console.log('[MCQ useEffect 2] Iniciando carga de API para stepType:', stepType);
        setDataLoading(true);
        setApiError(null);
        setDataExisted(false);
        setModuleResponseId(null);
        setDocumentId(null);

        const apiClient = new ApiClient();
        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                let loadedApiResponsesRaw: string[] = [];
                if (!apiResponse.error && apiResponse.data?.data) {
                    const fullDocument = apiResponse.data.data as { id: string, responses: Array<{ id: string, stepType: string, response: any }> };
                    setDocumentId(fullDocument.id);
                    const foundStepData = fullDocument.responses.find(item => item.stepType === stepType);
                    if (foundStepData && Array.isArray(foundStepData.response)) {
                        loadedApiResponsesRaw = foundStepData.response;
                        setModuleResponseId(foundStepData.id || null);
                        setDataExisted(true);
                    }
                } else {
                    if (apiResponse.apiStatus !== APIStatus.NOT_FOUND) {
                        setApiError(apiResponse.message || 'Error cargando datos del módulo.');
                    }
                }
                let finalResponsesToProcess = loadedApiResponsesRaw;
                if (loadedApiResponsesRaw.length === 0 && initialConfig?.savedResponses && Array.isArray(initialConfig.savedResponses)) {
                    console.log(`[MCQ useEffect 2] Usando fallback de initialConfig.savedResponses: ${JSON.stringify(initialConfig.savedResponses)}`);
                    finalResponsesToProcess = initialConfig.savedResponses;
                }
                const validLoadedOptions = finalResponsesToProcess.filter(opt => displayOptions.includes(opt));
                setSelectedOptions(validLoadedOptions);
                console.log(`[MCQ useEffect 2] displayOptions: ${JSON.stringify(displayOptions)}, FinalResponsesToProcess (raw): ${JSON.stringify(finalResponsesToProcess)}, ValidLoadedOptions (set to state): ${JSON.stringify(validLoadedOptions)}`);
                if (dataExisted && validLoadedOptions.length !== loadedApiResponsesRaw.filter(r => typeof r === 'string').length) {
                    console.warn("[MCQ useEffect 2] Algunas respuestas cargadas de la API no eran válidas contra las displayOptions actuales. Se han filtrado.");
                }
            })
            .catch(error => {
                console.error('[MCQ useEffect 2] Excepción al cargar datos:', error);
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                const fallbackSaved = initialConfig?.savedResponses || [];
                setSelectedOptions(Array.isArray(fallbackSaved) ? fallbackSaved.filter(opt => displayOptions.includes(opt)) : []);
            })
            .finally(() => {
                setDataLoading(false);
                console.log('[MCQ useEffect 2] Carga de API finalizada para stepType:', stepType);
            });
    }, [researchId, participantId, stepType, isMock, initialConfig?.savedResponses]);

    useEffect(() => {
        console.log(`[MCQ useEffect 3 (Sync)] Running. dataLoading: ${dataLoading}, isMock: ${isMock}, displayOptions: ${JSON.stringify(displayOptions)}, initialConfig?.savedResponses: ${JSON.stringify(initialConfig?.savedResponses)}`);
        if (isMock || dataLoading) return;
        
        setSelectedOptions(prevSelected => {
            const newSelected = prevSelected.filter(opt => displayOptions.includes(opt));
            if (JSON.stringify(newSelected) !== JSON.stringify(prevSelected)) {
                console.log(`[MCQ useEffect 3 (Sync)] SelectedOptions cambiaron después de filtrar con nuevas displayOptions. Anterior: ${JSON.stringify(prevSelected)}, Nuevo: ${JSON.stringify(newSelected)}`);
            }
            return newSelected;
        });
    }, [displayOptions, initialConfig?.savedResponses, isMock, dataLoading]);

    const handleCheckboxChange = (option: string) => {
        setSelectedOptions(prev => {
            const isCurrentlySelected = prev.includes(option);
            let newSelectionCalc: string[];
            if (isCurrentlySelected) {
                newSelectionCalc = prev.filter(item => item !== option);
            } else {
                newSelectionCalc = [...prev, option];
            }
            if (newSelectionCalc.length > maxSelections) {
                return prev; 
            }
            return newSelectionCalc;
        });
    };

    const handleSaveAndProceed = async () => {
        if (isMock) {
            if (selectedOptions.length >= minSelections) onStepComplete(selectedOptions);
            return;
        }
        if (selectedOptions.length < minSelections && initialConfig?.required !== false) {
            setApiError(`Por favor, selecciona al menos ${minSelections} opciones.`);
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
            let success = false;
            const payload = { response: selectedOptions };
            if (dataExisted && moduleResponseId) {
                await updateResponse(moduleResponseId, currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                if (apiHookError) setApiError(apiHookError); else success = true;
            } else {
                const result = await saveResponse(currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                if (apiHookError) setApiError(apiHookError);
                else if (result && result.id) { setModuleResponseId(result.id); setDataExisted(true); success = true; }
            }
            if (success) {
                setIsNavigating(true);
                setTimeout(() => onStepComplete(selectedOptions), 500);
            } else if (!apiHookError && !apiError) {
                setApiError('La operación de guardado no parece haber tenido éxito.');
            }
        } catch (error: any) {
            setApiError(error.message || 'Error desconocido durante el guardado.');
        } finally {
            setIsSaving(false);
        }
    };

    let buttonText = 'Siguiente';
    if (isNavigating) buttonText = 'Pasando al siguiente módulo...';
    else if (isSaving || isApiLoading) buttonText = 'Guardando...';
    else if (!isMock && dataExisted && moduleResponseId) buttonText = 'Actualizar y continuar';
    else if (!isMock) buttonText = 'Guardar y continuar';

    if (dataLoading && !isMock) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                <p className="text-gray-600">Cargando opciones...</p>
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

            <div className="flex flex-col gap-2 mb-4">
                {displayOptions.map((option: string, index: number) => (
                    <label key={index} className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={selectedOptions.includes(option)}
                            onChange={() => handleCheckboxChange(option)}
                            disabled={isSaving || isApiLoading || dataLoading || isNavigating}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                        <span className="text-neutral-700">{option}</span>
                    </label>
                ))}
            </div>
            <div className="text-sm text-neutral-500 mb-4">
                {minSelections > 0 && `Selecciona al menos ${minSelections} opciones. `}
                {maxSelections < displayOptions.length && `Puedes seleccionar hasta ${maxSelections} opciones. `}
                Seleccionadas: {selectedOptions.length}
            </div>
            <button
                onClick={handleSaveAndProceed}
                disabled={selectedOptions.length < minSelections || isSaving || isApiLoading || dataLoading || isNavigating || (isMock && selectedOptions.length < minSelections)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                {buttonText}
            </button>
            {process.env.NODE_ENV === 'development' && !isMock && (
                 <div className="mt-4 p-2 bg-gray-50 text-xs text-gray-500 border rounded">
                    <p className="font-semibold">[Debug MultipleChoiceQuestion]</p>
                    <div>Initial Config (Full JSON): <pre>{JSON.stringify(initialConfig, null, 2)}</pre></div>
                    <div>Display Options (JSON): <pre>{JSON.stringify(displayOptions, null, 2)}</pre></div>
                    <div>Selected Options (JSON): <pre>{JSON.stringify(selectedOptions, null, 2)}</pre></div>
                    <p>Data Loading: {dataLoading.toString()}, Data Existed: {dataExisted.toString()}, Is Saving: {isSaving.toString()}, API Hook Loading: {isApiLoading.toString()}</p>
                 </div>
            )}
        </div>
    );
};