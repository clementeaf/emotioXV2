import React, { useEffect, useState } from 'react';
import { useResponseAPI } from '../../../hooks/useResponseAPI';
import { ApiClient, APIStatus } from '../../../lib/api';
import { useParticipantStore } from '../../../stores/participantStore';
import { ComponentLinearScaleQuestionProps } from '../../../types/flow.types';
import { getStandardButtonText } from '../../../utils/formHelpers';
import { StarRating } from '../../smartVoc/StarRating';

export const LineaScaleQuestion: React.FC<ComponentLinearScaleQuestionProps> = ({
    config,
    stepName,
    questionKey, // NUEVO: questionKey como identificador principal
    onStepComplete,
    isMock
}) => {
    const cfg = (typeof config === 'object' && config !== null)
      ? config as {
          title?: string;
          description?: string;
          questionText?: string;
          scaleConfig?: {
            startValue?: number;
            endValue?: number;
            startLabel?: string;
            endLabel?: string;
          };
          savedResponses?: number;
          required?: boolean;
          type?: 'stars' | 'numbers';
        }
      : {};

    const useStars = cfg.type === 'stars';
    const componentTitle = stepName || cfg.title || '';
    const description = cfg.description;
    const questionText = cfg.questionText ?? '';
    const minValue = cfg.scaleConfig?.startValue ?? 1;
    const maxValue = cfg.scaleConfig?.endValue ?? 5;
    const minLabel = cfg.scaleConfig?.startLabel ?? '';
    const maxLabel = cfg.scaleConfig?.endLabel ?? '';
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

    // NUEVO: Log questionKey para debugging
    console.log(`[LineaScaleQuestion] 🔑 Usando questionKey: ${questionKey}`, {
        stepName,
        componentTitle
    });

    // useEffect para cargar datos existentes o inicializar desde config.savedResponses
    useEffect(() => {
        if (isMock) {
            setSelectedValue(savedResponses ?? null);
            setDataLoading(false);
            return;
        }

        if (!researchId || !participantId || !questionKey) { // NUEVO: Usar questionKey en vez de stepName
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
                    // NUEVO: Buscar por questionKey en vez de stepName
                    const foundStepData = fullDocument.responses.find(item => item.stepType === questionKey);

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
            }, [researchId, participantId, questionKey, isMock, savedResponses]); // NUEVO: Usar questionKey

    // Replace the manual button text logic (around line 139) with:
    const hasExistingData = !!moduleResponseId && selectedValue !== null;

    const buttonText = getStandardButtonText({
        isSaving: isSaving,
        isLoading: false,
        hasExistingData,
        isNavigating: isNavigating,
        customCreateText: 'Guardar y continuar',
        customUpdateText: 'Actualizar y continuar'
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

        // NUEVO: Usar questionKey como identificador principal para la API
        const currentStepIdForApi = questionKey;

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
                // NUEVO: Usar questionKey como stepType para guardar con identificación única
                const result = await saveResponse(currentStepIdForApi, questionKey, payload.response);
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

            {/* NUEVO: Mostrar questionKey para debugging */}
            {questionKey && (
                <div className="mb-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                    <p>ID: {questionKey}</p>
                </div>
            )}

            {useStars ? (
                <StarRating
                    rating={selectedValue || 0}
                    onRatingChange={setSelectedValue}
                    maxRating={maxValue}
                    disabled={isSaving || isApiLoading || dataLoading || isNavigating}
                />
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between text-sm text-neutral-500">
                        <span>{minLabel || minValue}</span>
                        <span>{maxLabel || maxValue}</span>
                    </div>
                    <input
                        type="range"
                        min={minValue}
                        max={maxValue}
                        value={selectedValue || minValue}
                        onChange={(e) => setSelectedValue(parseInt(e.target.value))}
                        disabled={isSaving || isApiLoading || dataLoading || isNavigating}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                    <div className="text-center">
                        <span className="text-lg font-medium text-neutral-800">
                            {selectedValue || minValue}
                        </span>
                    </div>
                </div>
            )}

            <button
                onClick={handleSaveAndProceed}
                disabled={selectedValue === null || isSaving || isApiLoading || dataLoading || isNavigating}
                className="mt-6 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                {buttonText}
            </button>
        </div>
    );
};
