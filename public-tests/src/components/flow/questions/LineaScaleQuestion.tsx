import { useState, useEffect } from 'react';
import { useParticipantStore } from '../../../stores/participantStore';
import { useResponseAPI } from '../../../hooks/useResponseAPI';
import { ApiClient, APIStatus } from '../../../lib/api';
import { getStandardButtonText } from '../../../utils/formHelpers';

// MODIFICADO: Definir interfaz para props
interface LineaScaleQuestionProps {
    stepConfig?: unknown;
    stepId?: string;
    stepName?: string;
    stepType: string;
    onStepComplete: (answer: unknown) => void;
    isMock: boolean;
}

// Componente para Linear Scale
export const LinearScaleQuestion: React.FC<LineaScaleQuestionProps> = ({ 
    stepConfig: initialConfig, // Mapea stepConfig a initialConfig
    stepId: stepIdFromProps, 
    stepName: stepNameFromProps, 
    stepType, 
    onStepComplete, 
    isMock 
}) => {
    // Unificar todas las props de config en un solo objeto seguro
    const cfg = (typeof initialConfig === 'object' && initialConfig !== null)
      ? initialConfig as {
          title?: string;
          description?: string;
          questionText?: string;
          minValue?: number;
          maxValue?: number;
          minLabel?: string;
          maxLabel?: string;
          savedResponses?: number;
          required?: boolean;
        }
      : {};

    const componentTitle = stepNameFromProps || cfg.title || 'Pregunta de escala lineal';
    const description = cfg.description;
    const questionText = cfg.questionText ?? (isMock ? 'Valora en una escala (Prueba)' : 'Por favor, indica tu valoración.');
    const minValue = typeof cfg.minValue === 'number' ? cfg.minValue : 1;
    const maxValue = typeof cfg.maxValue === 'number' ? cfg.maxValue : 5;
    const minLabel = typeof cfg.minLabel === 'string' ? cfg.minLabel : (isMock ? 'Mín' : 'Muy insatisfecho');
    const maxLabel = typeof cfg.maxLabel === 'string' ? cfg.maxLabel : (isMock ? 'Máx' : 'Muy satisfecho');
    const savedResponses = typeof cfg.savedResponses === 'number' ? cfg.savedResponses : undefined;
    const required = typeof cfg.required === 'boolean' ? cfg.required : true;

    const [selectedValue, setSelectedValue] = useState<number | null>(null);

    // Estados para la API y carga/guardado de datos
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataExisted, setDataExisted] = useState(false);
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
            setSelectedValue(savedResponses ?? null);
            setDataLoading(false);
            return;
        }

        if (!researchId || !participantId || !stepType) {
            setDataLoading(false);
            setSelectedValue(null);
            setDataExisted(false);
            setModuleResponseId(null);
            return;
        }

        const apiClient = new ApiClient();
        setDataLoading(true);
        setApiError(null);
        setSelectedValue(null);
        setDataExisted(false);
        setModuleResponseId(null);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                let valueToSet: number | null = null;
                if (
                  !apiResponse.error &&
                  typeof apiResponse.data === 'object' && apiResponse.data !== null &&
                  'data' in apiResponse.data &&
                  typeof (apiResponse.data as { data?: unknown }).data === 'object' &&
                  (apiResponse.data as { data?: unknown }).data !== null
                ) {
                    const fullDocument = (apiResponse.data as { data: { id: string, responses: Array<{ id: string, stepType: string, response: unknown }> } }).data;
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

                if (valueToSet === null && savedResponses !== undefined) {
                    valueToSet = savedResponses;
                }
                setSelectedValue(valueToSet);
            })
            .catch(error => {
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                setDataExisted(false);
                setModuleResponseId(null);
                setSelectedValue(savedResponses ?? null);
            })
            .finally(() => {
                setDataLoading(false);
            });
    }, [researchId, participantId, stepType, isMock, savedResponses]);

    // Replace the manual button text logic (around line 139) with:
    const buttonText = getStandardButtonText({
        isSaving: isSaving,
        isLoading: false,
        hasExistingData: !!moduleResponseId && selectedValue !== null,
        isNavigating: isNavigating
    });

    const handleSaveAndProceed = async () => {
        if (isMock) {
            if (selectedValue !== null) {
                onStepComplete(selectedValue);
            }
            return;
        }

        if (selectedValue === null && required) {
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
                } else if (
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

            if (success) {
                setIsNavigating(true);
                setTimeout(() => {
                    onStepComplete(selectedValue);
                }, 500);
            } else if (!apiHookError && !apiError) {
                setApiError('La operación de guardado no parece haber tenido éxito.');
            }
        } catch (error: unknown) {
            if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
                setApiError((error as { message: string }).message);
            } else {
                setApiError('Error desconocido durante el guardado.');
            }
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
        </div>
    );
};