import { useEffect, useMemo, useState } from "react";
import { useResponseAPI } from "../../../hooks/useResponseAPI";
import { ApiClient, APIStatus } from "../../../lib/api";
import { useParticipantStore } from "../../../stores/participantStore";
import { getStandardButtonText } from "../../../utils/formHelpers";

import { MultipleChoiceQuestionProps } from '../../../types/flow.types';

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
    stepConfig: initialConfig,
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
          choices?: unknown[];
          minSelections?: number;
          maxSelections?: number;
          savedResponses?: unknown[];
          required?: boolean;
        }
      : {};

    const componentTitle = stepNameFromProps || cfg.title || '';
    const description = cfg.description;
    const questionText = cfg.questionText ?? '';
    const choicesFromConfig = useMemo(() => Array.isArray(cfg.choices) ? cfg.choices : [], [cfg.choices]);
    const savedResponses = useMemo(() => Array.isArray(cfg.savedResponses) ? cfg.savedResponses : [], [cfg.savedResponses]);
    const displayOptions = useMemo(() => {
        if (choicesFromConfig.length === 0 && !isMock) {
            return ['Opción Múltiple A (sin texto)', 'Opción Múltiple B (sin texto)', 'Opción Múltiple C (sin texto)'];
        }

        if (isMock) {
            return ['Opción Múltiple Mock A', 'Opción Múltiple Mock B', 'Opción Múltiple Mock C'];
        }

        if (choicesFromConfig.length > 0) {
            // Convertir objetos a strings si es necesario
            return choicesFromConfig.map((choice, index) => {
                if (typeof choice === 'string') return choice;
                if (typeof choice === 'object' && choice !== null) {
                    const obj = choice as { text?: string; id?: string };
                    return obj.text || `Opción Múltiple ${String.fromCharCode(65 + index)} (sin texto)`;
                }
                return `Opción Múltiple ${String.fromCharCode(65 + index)} (sin texto)`;
            });
        }

        return [];
    }, [choicesFromConfig, isMock]);
    const minSelections = typeof cfg.minSelections === 'number' ? cfg.minSelections : 0;
    const maxSelections = typeof cfg.maxSelections === 'number' && cfg.maxSelections > 0 ? cfg.maxSelections : displayOptions.length;
    const required = typeof cfg.required === 'boolean' ? cfg.required : true;

    const [selectedOptions, setSelectedOptions] = useState<unknown[]>([]);
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(!isMock);
    const [dataExisted, setDataExisted] = useState(false);
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);

    const { saveResponse, updateResponse, isLoading: isApiLoading, error: apiHookError } = useResponseAPI({
        researchId: researchId || '',
        participantId: participantId || ''
    });

    useEffect(() => {
        if (isMock) {
            const validSavedResponses = savedResponses.filter(opt => {
                if (typeof opt === 'string') {
                    return displayOptions.includes(opt);
                }
                return false;
            });
            setSelectedOptions(validSavedResponses);
            setDataLoading(false);
        } else if (!researchId || !participantId || !stepType) {
            setDataLoading(false);
            setSelectedOptions([]);
        }
    }, [isMock, researchId, participantId, stepType, savedResponses, displayOptions]);

    useEffect(() => {
        if (isMock || !researchId || !participantId || !stepType) {
            return;
        }
        setDataLoading(true);
        setApiError(null);
        setDataExisted(false);
        setModuleResponseId(null);

        const apiClient = new ApiClient();
        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                let loadedApiResponsesRaw: unknown[] = [];
                if (
                  !apiResponse.error &&
                  typeof apiResponse.data === 'object' && apiResponse.data !== null &&
                  'data' in apiResponse.data &&
                  typeof (apiResponse.data as { data?: unknown }).data === 'object' &&
                  (apiResponse.data as { data?: unknown }).data !== null
                ) {
                    const fullDocument = (apiResponse.data as { data: { id: string, responses: Array<{ id: string, stepType: string, response: unknown }> } }).data;
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
                if (loadedApiResponsesRaw.length === 0 && savedResponses.length > 0) {
                    finalResponsesToProcess = savedResponses;
                }
                const validLoadedOptions = finalResponsesToProcess.filter(opt => {
                    if (typeof opt === 'string') {
                        return displayOptions.includes(opt);
                    }
                    return false;
                });
                setSelectedOptions(validLoadedOptions);
            })
            .catch(error => {
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                const validSavedOptions = savedResponses.filter(opt => {
                    if (typeof opt === 'string') {
                        return displayOptions.includes(opt);
                    }
                    return false;
                });
                setSelectedOptions(validSavedOptions);
            })
            .finally(() => {
                setDataLoading(false);
            });
    }, [researchId, participantId, stepType, isMock, savedResponses, displayOptions]);

    useEffect(() => {
        if (isMock || dataLoading) return;
        setSelectedOptions(prevSelected => {
            const newSelected = prevSelected.filter(opt => {
                if (typeof opt === 'string') {
                    return displayOptions.includes(opt);
                }
                return false;
            });
            return newSelected;
        });
    }, [displayOptions, savedResponses, isMock, dataLoading]);

    const handleCheckboxChange = (option: unknown) => {
        setSelectedOptions(prev => {
            const isCurrentlySelected = prev.includes(option);
            let newSelectionCalc: unknown[];
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
        if (selectedOptions.length < minSelections && required) {
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
                await updateResponse(moduleResponseId, payload.response);
                if (apiHookError) setApiError(apiHookError); else success = true;
            } else {
                const result = await saveResponse(currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                if (apiHookError) setApiError(apiHookError);
                else if (
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
                setTimeout(() => onStepComplete(selectedOptions), 500);
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

    // Usar sistema estandarizado para determinar texto del botón
    const hasExistingData = (!isMock && dataExisted) || selectedOptions.length > 0;

    const buttonText = getStandardButtonText({
        isSaving: isSaving || isApiLoading,
        isLoading: dataLoading,
        hasExistingData,
        isNavigating,
        customSavingText: 'Guardando...',
        customUpdateText: 'Actualizar y continuar',
        customCreateText: 'Guardar y continuar'
    });

    // 🔍 LOGGING TEMPORAL para debugging MultipleChoiceQuestion
    console.log('[MultipleChoiceQuestion] estado actual:', {
        stepType,
        stepId: stepIdFromProps,
        selectedOptions,
        dataExisted,
        moduleResponseId,
        dataLoading,
        isSaving,
        hasExistingData,
        buttonText,
        displayOptions: displayOptions.slice(0, 3), // Solo las primeras 3 para no saturar
        searchCriteria: {
            stepId: stepIdFromProps || stepType,
            stepType,
            stepName: componentTitle
        }
    });

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

            <div className="flex flex-col gap-2 mb-4">
                {displayOptions.map((option: unknown, index: number) => (
                    <label key={index} className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={selectedOptions.includes(option)}
                            onChange={() => handleCheckboxChange(option)}
                            disabled={isSaving || isApiLoading || dataLoading || isNavigating}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                        <span className="text-neutral-700">{typeof option === 'string' ? option : ''}</span>
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
        </div>
    );
};
