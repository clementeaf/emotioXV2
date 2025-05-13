import { useEffect, useState } from "react";
import { useParticipantStore } from "../../../stores/participantStore";
import { useResponseAPI } from "../../../hooks/useResponseAPI";
import { ApiClient, APIStatus } from "../../../lib/api";

export const MultipleChoiceQuestion: React.FC<{
    config: any;
    stepId?: string;    // stepId de la configuración del flujo
    stepName?: string;  // stepName de la configuración del flujo
    stepType: string;   // ej. cognitive_multiple_choice
    onStepComplete: (answer: any) => void; // Se llamará DESPUÉS de un guardado exitoso
    isMock: boolean;    // Determinado por CurrentStepRenderer basado en la validez de config
}> = ({ config: initialConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete, isMock }) => {
    // DEBUG: ¿Qué es initialConfig REALMENTE aquí?
    console.log('[MultipleChoiceQuestion] Received initialConfig:', JSON.stringify(initialConfig, null, 2));
    console.log('[MultipleChoiceQuestion] Received stepNameFromProps:', stepNameFromProps);
    console.log('[MultipleChoiceQuestion] Received isMock:', isMock);

    const componentTitle = initialConfig?.title ?? stepNameFromProps ?? 'Pregunta de opciones múltiples';
    const description = initialConfig?.description;
    const questionText = initialConfig?.questionText ?? (isMock ? 'Selecciona todas las opciones que apliquen (Prueba)' : 'Por favor, selecciona una o más opciones.');
    
    const options = Array.isArray(initialConfig?.choices)
        ? initialConfig.choices.map((choice: any) => choice?.text || '').filter((text: string) => text !== '')
        : (isMock ? ['Opción Múltiple Mock A', 'Opción Múltiple Mock B', 'Opción Múltiple Mock C'] : []);

    const displayOptions = (options.length === 0 && !isMock)
        ? ['Opción Múltiple A (sin texto)', 'Opción Múltiple B (sin texto)', 'Opción Múltiple C (sin texto)']
        : options;

    const minSelections = initialConfig?.minSelections ?? 0;
    const maxSelections = initialConfig?.maxSelections > 0 ? initialConfig.maxSelections : displayOptions.length;

    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    // Estados para la API y carga/guardado de datos
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(true); // Inicia en true si no es mock
    const [dataExisted, setDataExisted] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);

    const {
        saveResponse,
        updateResponse,
        isLoading: isApiLoading, // Loading del hook useResponseAPI
        error: apiHookError,
    } = useResponseAPI({
        researchId: researchId || '',
        participantId: participantId || ''
    });

    // useEffect para cargar datos existentes o inicializar desde config.savedResponses
    useEffect(() => {
        if (isMock) {
            setSelectedOptions(initialConfig.savedResponses || []);
            setDataLoading(false);
            return;
        }

        if (!researchId || !participantId || !stepType) {
            setDataLoading(false);
            setSelectedOptions([]); // Reiniciar por si acaso
            setDataExisted(false);
            setModuleResponseId(null);
            setDocumentId(null);
            console.warn('[MultipleChoiceQuestion] Carga OMITIDA: Faltan researchId, participantId o stepType para cargar datos reales.');
            return;
        }

        const apiClient = new ApiClient();
        setDataLoading(true);
        setApiError(null);
        setSelectedOptions([]); // Resetear antes de la carga
        setDataExisted(false);
        setModuleResponseId(null);
        setDocumentId(null);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                if (apiResponse.error || !apiResponse.data?.data) {
                    setDataExisted(false);
                    if (initialConfig.savedResponses && Array.isArray(initialConfig.savedResponses)) {
                        setSelectedOptions(initialConfig.savedResponses);
                    } else {
                        setSelectedOptions([]);
                    }

                    if (apiResponse.apiStatus === APIStatus.NOT_FOUND) {
                        setApiError(null);
                    } else {
                        setApiError(apiResponse.message || 'Error cargando datos del módulo.');
                    }
                    return;
                }

                const fullDocument = apiResponse.data.data as { id: string, responses: Array<{ id: string, stepType: string, response: any }> };
                setDocumentId(fullDocument.id);
                const foundStepData = fullDocument.responses.find(item => item.stepType === stepType);

                if (foundStepData && Array.isArray(foundStepData.response)) {

                    setSelectedOptions(foundStepData.response);
                    setModuleResponseId(foundStepData.id || null);
                    setDataExisted(true);
                } else {

                    // Si no hay datos de API, pero initialConfig (que es el config real si no es mock) tiene savedResponses, usar eso.
                    if (initialConfig.savedResponses && Array.isArray(initialConfig.savedResponses)) {
                        setSelectedOptions(initialConfig.savedResponses);

                    } else {
                        setSelectedOptions([]);
                    }
                    setModuleResponseId(null);
                    setDataExisted(false);
                }
            })
            .catch(error => {
                console.error('[MultipleChoiceQuestion] Excepción al cargar datos:', error);
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                setDataExisted(false);
                setModuleResponseId(null);
                // setSelectedOptions(initialConfig.savedResponses || []);
                if (initialConfig.savedResponses && Array.isArray(initialConfig.savedResponses)) {
                    setSelectedOptions(initialConfig.savedResponses);
                } else {
                    setSelectedOptions([]);
                }
            })
            .finally(() => {
                setDataLoading(false);
            });
    }, [researchId, participantId, stepType, isMock, initialConfig.savedResponses]);

    const handleCheckboxChange = (option: string) => {
        setSelectedOptions(prev => {
            const newSelection = prev.includes(option)
                ? prev.filter(item => item !== option)
                : [...prev, option];

            if (newSelection.length > maxSelections) {
                return prev; // No permitir exceder el máximo
            }
            return newSelection;
        });
    };

    // Texto dinámico para el botón
    let buttonText = 'Siguiente';
    if (isNavigating) {
        buttonText = 'Pasando al siguiente módulo...';
    } else if (isSaving || isApiLoading) {
        buttonText = 'Guardando...';
    } else if (!isMock && dataExisted && moduleResponseId) {
        buttonText = 'Actualizar y continuar';
    } else if (!isMock) {
        buttonText = 'Guardar y continuar';
    }
    // Si es mock, el botón siempre dirá Siguiente (o el default que tenga el componente original)

    const handleSaveAndProceed = async () => {
        if (isMock) { // Si es mock, simplemente llamar a onStepComplete
            if (selectedOptions.length >= minSelections) {

                onStepComplete(selectedOptions);
            }
            return;
        }

        if (selectedOptions.length < minSelections && initialConfig.required !== false) {
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
            const payload = { response: selectedOptions }; // La respuesta es un array de strings

            if (dataExisted && moduleResponseId) {

                await updateResponse(moduleResponseId, currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                if (apiHookError) {
                    setApiError(apiHookError);
                } else {
                    success = true;
                }
            } else {

                const result = await saveResponse(currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                if (apiHookError) {
                    setApiError(apiHookError);
                } else if (result && result.id) {
                    setModuleResponseId(result.id);
                    setDataExisted(true);
                    success = true;
                }
            }

            if (success) {
                setIsNavigating(true);
                setTimeout(() => {
                    onStepComplete(selectedOptions);
                }, 500);
            } else if (!apiHookError && !apiError) {
                setApiError('La operación de guardado no parece haber tenido éxito.');
            }
        } catch (error: any) {
            console.error('[MultipleChoiceQuestion] Excepción al guardar:', error);
            setApiError(error.message || 'Error desconocido durante el guardado.');
        } finally {
            setIsSaving(false);
        }
    };

    if (dataLoading && !isMock) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                <p className="text-gray-600">Cargando opciones...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            {/* Quitar el MockDataWarning de aquí, ya lo maneja renderStepWithWarning */}
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
                onClick={handleSaveAndProceed} // Cambiado de handleSubmit a handleSaveAndProceed
                disabled={selectedOptions.length < minSelections || isSaving || isApiLoading || dataLoading || isNavigating || (isMock && selectedOptions.length < minSelections)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                {buttonText} {/* Usar el texto dinámico del botón */}
            </button>
            {process.env.NODE_ENV === 'development' && !isMock && (
                <div className="mt-4 p-2 bg-gray-50 text-xs text-gray-500 border rounded">
                    <p className="font-semibold">[Debug MultipleChoiceQuestion]</p>
                    <p>Research ID: {researchId || 'N/A'}, Participant ID: {participantId || 'N/A'}</p>
                    <p>StepType: {stepType}, StepIdProp: {stepIdFromProps || 'N/A'}, StepNameProp: {stepNameFromProps || 'N/A'}</p>
                    <p>IsMock Flag: {isMock.toString()}</p>
                    <p>Data Loading: {dataLoading.toString()}, Data Existed: {dataExisted.toString()}</p>
                    <p>Document ID: {documentId || 'N/A'}, ModuleResponse ID: {moduleResponseId || 'N/A'}</p>
                    <p>API Saving: {isSaving.toString()}, API Hook Loading: {isApiLoading.toString()}</p>
                    <p>API Error (Form): {apiError || 'No'}, API Error (Hook): {apiHookError || 'No'}</p>
                    <p>Is Navigating: {isNavigating.toString()}</p>
                    <div>Selected Options: <pre>{JSON.stringify(selectedOptions, null, 2)}</pre></div>
                    <div>Initial Config Options: <pre>{JSON.stringify(displayOptions, null, 2)}</pre></div>
                    <div>Initial Config Saved: <pre>{JSON.stringify(initialConfig.savedResponses, null, 2)}</pre></div>
                </div>
            )}
        </div>
    );
};