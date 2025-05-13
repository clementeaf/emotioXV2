import { useState, useEffect } from 'react';
import { useParticipantStore } from '../../../stores/participantStore';
import { useResponseAPI } from '../../../hooks/useResponseAPI';
import { ApiClient, APIStatus } from '../../../lib/api';

// Componente para Linear Scale
export const LinearScaleQuestion: React.FC<{
    config: any;
    stepId?: string;    // stepId del flujo
    stepName?: string;  // stepName del flujo
    stepType: string;
    onStepComplete: (answer: any) => void; // Se llamará DESPUÉS de un guardado exitoso
    isMock: boolean;    // Determinado por CurrentStepRenderer
}> = ({ config: initialConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete, isMock }) => {
    const componentTitle = initialConfig.title || stepNameFromProps || 'Pregunta de escala lineal';
    const description = initialConfig.description;
    const questionText = initialConfig.questionText || (isMock ? 'Valora en una escala (Prueba)' : 'Pregunta de escala sin texto');
    const minValue = initialConfig.minValue || 1;
    const maxValue = initialConfig.maxValue || 5;
    const minLabel = initialConfig.minLabel || 'Mínimo';
    const maxLabel = initialConfig.maxLabel || 'Máximo';

    const [selectedValue, setSelectedValue] = useState<number | null>(null);

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

    // useEffect para cargar datos existentes o inicializar desde config.savedResponses
    useEffect(() => {
        if (isMock) {
            const mockSavedValue = initialConfig.savedResponses;
            setSelectedValue(typeof mockSavedValue === 'number' ? mockSavedValue : null);
            setDataLoading(false);
            return;
        }

        if (!researchId || !participantId || !stepType) {
            setDataLoading(false);
            setSelectedValue(null);
            setDataExisted(false);
            setModuleResponseId(null);
            setDocumentId(null);
            console.warn('[LinearScaleQuestion] Carga OMITIDA: Faltan researchId, participantId o stepType para cargar datos reales.');
            return;
        }

        const apiClient = new ApiClient();
        setDataLoading(true);
        setApiError(null);
        setSelectedValue(null);
        setDataExisted(false);
        setModuleResponseId(null);
        setDocumentId(null);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                let valueToSet: number | null = null;
                if (!apiResponse.error && apiResponse.data?.data) {
                    const fullDocument = apiResponse.data.data as { id: string, responses: Array<{ id: string, stepType: string, response: any }> };
                    setDocumentId(fullDocument.id);
                    const foundStepData = fullDocument.responses.find(item => item.stepType === stepType);

                    if (foundStepData && typeof foundStepData.response === 'number') {
                        valueToSet = foundStepData.response;
                        setModuleResponseId(foundStepData.id || null);
                        setDataExisted(true);
                    } else {
                        setDataExisted(false);
                        setModuleResponseId(null);
                    }
                } else {
                    if (apiResponse.apiStatus !== APIStatus.NOT_FOUND) {
                        setApiError(apiResponse.message || 'Error cargando datos del módulo.');
                    }
                }

                if (valueToSet === null && initialConfig.savedResponses !== undefined && typeof initialConfig.savedResponses === 'number') {

                    valueToSet = initialConfig.savedResponses;
                }
                setSelectedValue(valueToSet);
            })
            .catch(error => {
                console.error('[LinearScaleQuestion] Excepción al cargar datos:', error);
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                setDataExisted(false);
                setModuleResponseId(null);
                const fallbackSavedValue = initialConfig.savedResponses;
                setSelectedValue(typeof fallbackSavedValue === 'number' ? fallbackSavedValue : null);
            })
            .finally(() => {
                setDataLoading(false);
            });
    }, [researchId, participantId, stepType, isMock, initialConfig.savedResponses]);

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

    const handleSaveAndProceed = async () => {
        if (isMock) {
            if (selectedValue !== null) {
                onStepComplete(selectedValue);
            }
            return;
        }

        if (selectedValue === null && initialConfig.required !== false) {
            setApiError("Por favor, selecciona un valor en la escala.");
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
            const payload = { response: selectedValue };

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
                    onStepComplete(selectedValue);
                }, 500);
            } else if (!apiHookError && !apiError) {
                setApiError('La operación de guardado no parece haber tenido éxito.');
            }
        } catch (error: any) {
            console.error('[LinearScaleQuestion] Excepción al guardar:', error);
            setApiError(error.message || 'Error desconocido durante el guardado.');
        } finally {
            setIsSaving(false);
        }
    };

    const scaleValues = Array.from(
        { length: maxValue - minValue + 1 },
        (_, i) => minValue + i
    );

    if (dataLoading && !isMock) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                <p className="text-gray-600">Cargando escala...</p>
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

            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    <span className="text-sm text-neutral-500">{minLabel}</span>
                    <span className="text-sm text-neutral-500">{maxLabel}</span>
                </div>
                <div className="flex justify-between">
                    {scaleValues.map(value => (
                        <button
                            key={value}
                            onClick={() => setSelectedValue(value)}
                            disabled={isSaving || isApiLoading || dataLoading || isNavigating}
                            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${selectedValue === value
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-gray-50'
                                }`}
                        >
                            {value}
                        </button>
                    ))}
                </div>
            </div>
            <button
                onClick={handleSaveAndProceed}
                disabled={selectedValue === null || isSaving || isApiLoading || dataLoading || isNavigating || (isMock && selectedValue === null)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                {buttonText}
            </button>
            {process.env.NODE_ENV === 'development' && !isMock && (
                <div className="mt-4 p-2 bg-gray-50 text-xs text-gray-500 border rounded">
                    <p className="font-semibold">[Debug LinearScaleQuestion]</p>
                    <p>Research ID: {researchId || 'N/A'}, Participant ID: {participantId || 'N/A'}</p>
                    <p>StepType: {stepType}, StepIdProp: {stepIdFromProps || 'N/A'}, StepNameProp: {stepNameFromProps || 'N/A'}</p>
                    <p>IsMock Flag: {isMock.toString()}</p>
                    <p>Data Loading: {dataLoading.toString()}, Data Existed: {dataExisted.toString()}</p>
                    <p>Document ID: {documentId || 'N/A'}, ModuleResponse ID: {moduleResponseId || 'N/A'}</p>
                    <p>API Saving: {isSaving.toString()}, API Hook Loading: {isApiLoading.toString()}</p>
                    <p>API Error (Form): {apiError || 'No'}, API Error (Hook): {apiHookError || 'No'}</p>
                    <p>Is Navigating: {isNavigating.toString()}</p>
                    <div>Selected Value: <pre>{JSON.stringify(selectedValue, null, 2)}</pre></div>
                    <div>Initial Config: <pre>{JSON.stringify(initialConfig, null, 2)}</pre></div>
                </div>
            )}
        </div>
    );
};