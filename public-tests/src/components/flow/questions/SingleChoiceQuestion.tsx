import { useEffect, useState } from "react";
import { useParticipantStore } from "../../../stores/participantStore";
import { useResponseAPI } from "../../../hooks/useResponseAPI";
import { ApiClient, APIStatus } from "../../../lib/api";

export const SingleChoiceQuestion: React.FC<{
    config: any;
    stepId?: string; // Renombrado de stepId a stepIdFromProps para claridad interna
    stepName?: string; // Renombrado de stepName a stepNameFromProps para claridad interna
    stepType: string;
    onStepComplete: (answer: any) => void;
    isMock: boolean; // Se mantiene para la lógica de datos de prueba si no hay config
}> = ({ config: initialConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete, isMock }) => {
    const componentTitle = initialConfig?.title ?? stepNameFromProps ?? 'Pregunta de opción única';
    const description = initialConfig?.description;
    const questionText = initialConfig?.questionText ?? (isMock ? 'Pregunta de prueba' : 'Por favor, selecciona una opción.');
    
    // MODIFICADO: Leer de 'choices' y mapear a un array de strings (textos de las opciones)
    // También nos aseguramos de que sea un array y que los textos existan
    const options = Array.isArray(initialConfig?.choices) 
        ? initialConfig.choices.map((choice: any) => choice?.text || '').filter((text: string) => text !== '')
        : (isMock ? ['Opción 1 Mock', 'Opción 2 Mock', 'Opción 3 Mock'] : []);
    
    // Si después de mapear no quedan opciones (porque todos los textos estaban vacíos) y no es mock, usar un array de placeholders
    const displayOptions = (options.length === 0 && !isMock)
        ? ['Opción A (sin texto)', 'Opción B (sin texto)', 'Opción C (sin texto)'] // Placeholders si los textos originales están vacíos
        : options;

    const [currentResponse, setCurrentResponse] = useState<string | null>(null); // Respuesta seleccionada

    // Estados para la API y carga de datos
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

    // useEffect para cargar datos existentes
    useEffect(() => {
        // Si es un mock, usar los datos de config y no hacer llamada API
        if (isMock) {
            setDataLoading(false);
            setCurrentResponse(initialConfig.savedResponses || null);
            return;
        }

        // Si no es mock pero faltan datos para la API, no cargar e indicar estado
        if (!researchId || !participantId || !stepType) {
            setDataLoading(false);
            setCurrentResponse(null);
            setDataExisted(false);
            setModuleResponseId(null);
            setDocumentId(null);
            console.warn('[SingleChoiceQuestion] Carga OMITIDA: Faltan researchId, participantId o stepType para cargar datos reales.');
            return;
        }

        // Proceder con la carga de datos reales desde la API
        const apiClient = new ApiClient();
        setDataLoading(true);
        setApiError(null);
        // Resetear estados antes de la carga
        setCurrentResponse(null);
        setDataExisted(false);
        setModuleResponseId(null);
        setDocumentId(null);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                if (apiResponse.error || !apiResponse.data?.data) {
                    setDataExisted(false);
                    setDocumentId(null);
                    setModuleResponseId(null);
                    setCurrentResponse(null);
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

                if (foundStepData) {
                    setCurrentResponse(typeof foundStepData.response === 'string' ? foundStepData.response : null);
                    setModuleResponseId(foundStepData.id || null);
                    setDataExisted(true);
                } else {
                    setCurrentResponse(null);
                    setModuleResponseId(null);
                    setDataExisted(false);
                }
            })
            .catch(error => {
                console.error('[SingleChoiceQuestion] Excepción al cargar datos:', error);
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                setDataExisted(false);
                setModuleResponseId(null);
                setCurrentResponse(null);
            })
            .finally(() => {
                setDataLoading(false);
            });
        // Quitar initialConfig.savedResponses de las dependencias.
        // Mantener isMock para la lógica de carga inicial.
    }, [researchId, participantId, stepType, isMock]); // initialConfig.savedResponses eliminado


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

    const handleSaveAndProceed = async () => {
        if (!currentResponse && initialConfig.required !== false) { // Asumir requerido si no se especifica lo contrario
            setApiError("Por favor, selecciona una opción.");
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
            const payload = { response: currentResponse };

            if (dataExisted && moduleResponseId) {
                await updateResponse(moduleResponseId, payload.response);
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
                    onStepComplete(currentResponse);
                }, 500);
            } else if (!apiHookError && !apiError) {
                setApiError('La operación de guardado no parece haber tenido éxito.');
            }
        } catch (error: any) {
            console.error('[SingleChoiceQuestion] Excepción al guardar:', error);
            setApiError(error.message || 'Error desconocido durante el guardado.');
        } finally {
            setIsSaving(false);
        }
    };

    if (dataLoading && !isMock) { // Solo mostrar cargando si no es mock y está cargando datos reales
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

            <div className="flex flex-col gap-2 mb-4">
                {displayOptions.map((option: string, index: number) => (
                    <button
                        key={index}
                        onClick={() => setCurrentResponse(option)} // Actualizar currentResponse
                        disabled={isSaving || isApiLoading || dataLoading || isNavigating}
                        className={`p-3 border rounded-md text-left transition-colors disabled:opacity-70 ${currentResponse === option
                                ? 'bg-primary-100 border-primary-300 text-primary-700'
                                : 'border-neutral-300 text-neutral-700 hover:bg-gray-50'
                            } ${(isSaving || isApiLoading || dataLoading || isNavigating) ? 'cursor-not-allowed' : ''}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
            <button
                onClick={handleSaveAndProceed}
                disabled={!currentResponse || isSaving || isApiLoading || dataLoading || isNavigating || (isMock && !currentResponse)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                {buttonText}
            </button>
        </div>
    );
};