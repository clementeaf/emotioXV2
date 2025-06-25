import { useCallback, useEffect, useState } from 'react';
import { ModuleResponse } from '../stores/participantStore';
import { UseResponseAPIReturn, UseResponseManagerProps, UseResponseManagerReturn } from '../types/hooks.types';
import { ResponsesData } from '../types/store.types';

// Función auxiliar para sanear objetos antes de JSON.stringify (copiada del store)
const sanitizeForJSON = (obj: unknown): unknown => {
  if (!obj) return obj;

  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    // Ignorar propiedades que empiezan con "__react" (internas de React)
    if (key.startsWith('__react')) return undefined;

    // Manejar posibles referencias circulares
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Referencia Circular]';
      }
      seen.add(value);

      // Eliminar propiedades específicas que causan problemas
      if (typeof window !== 'undefined' &&
          (value instanceof Element || value instanceof HTMLElement)) {
        return '[Elemento DOM]';
      }

      // Si es un objeto con la propiedad "current" (posible React ref)
      if ('current' in value && typeof window !== 'undefined' &&
          (value.current instanceof Element || value.current instanceof HTMLElement)) {
        return '[React Ref]';
      }
    }

    return value;
  }));
};

export const useResponseManager = ({
    researchId,
    participantId,
    expandedSteps,
    currentStepIndex,
    responseAPI,
    storeSetLoadedResponses,
}: UseResponseManagerProps): UseResponseManagerReturn => {
    const [responsesData, setResponsesData] = useState<ResponsesData>(() => ({
        researchId: researchId || '',
        startTime: Date.now(),
        modules: {
            eye_tracking: [],
            cognitive_task: [],
            smartvoc: [],
            all_steps: []
        }
    }));

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadExistingResponses = useCallback(async () => {
        if (!researchId || !participantId) return;
        setIsLoading(true);
        setError(null);

        const api = responseAPI as UseResponseAPIReturn;
        try {
            const apiResponse = await api.getResponses();

            // Si no hay respuesta o es null, es normal para participantes nuevos
            if (!apiResponse || apiResponse === null) {
                storeSetLoadedResponses([]);
                return;
            }

            // Si la respuesta no es un objeto, probablemente hay un error
            if (typeof apiResponse !== 'object') {
                console.warn('[useResponseManager] Respuesta de API en formato inesperado. Enviando array vacío.');
                storeSetLoadedResponses([]);
                return;
            }

            // Si no tiene la propiedad 'responses', puede ser normal para nuevos participantes
            if (!('responses' in apiResponse)) {
                // Solo loguear si parece ser un error real (tiene otras propiedades de error)
                const hasErrorIndicators = 'error' in apiResponse || 'message' in apiResponse;
                if (hasErrorIndicators) {
                    console.warn('[useResponseManager] Error en respuesta de API:', apiResponse);
                }
                storeSetLoadedResponses([]);
                return;
            }

            const modulesDataFromApi = (apiResponse as { responses: unknown }).responses;

            if (
                modulesDataFromApi &&
                typeof modulesDataFromApi === 'object' &&
                !Array.isArray(modulesDataFromApi) &&
                'all_steps' in modulesDataFromApi &&
                Array.isArray((modulesDataFromApi as { all_steps?: unknown }).all_steps)
            ) {
                storeSetLoadedResponses((modulesDataFromApi as { all_steps: unknown[] }).all_steps as ModuleResponse[]);
            } else if (Array.isArray(modulesDataFromApi)) {
                storeSetLoadedResponses(modulesDataFromApi);
            } else {
                // Solo advertir si modulesDataFromApi no es null/undefined (que es esperado para nuevos participantes)
                if (modulesDataFromApi !== null && modulesDataFromApi !== undefined) {
                    console.warn('[useResponseManager] modulesDataFromApi no tiene el formato esperado. Recibido:', modulesDataFromApi);
                }
                storeSetLoadedResponses([]);
            }
        } catch (error) {
            console.error('[useResponseManager] Error cargando respuestas existentes:', error);
            setError(error instanceof Error ? error.message : 'Error cargando respuestas');
            storeSetLoadedResponses([]);
        } finally {
            setIsLoading(false);
        }
    }, [researchId, participantId, responseAPI, storeSetLoadedResponses]);

    const findExistingResponseId = useCallback((stepId: string): string | undefined => {
        if (responsesData.modules.all_steps) {
            const existing = responsesData.modules.all_steps.find(resp => resp.id === stepId);
            if (existing) return existing.id;
        }
        return undefined;
    }, [responsesData.modules.all_steps]);

    const saveStepResponse = useCallback(async (
        stepId: string,
        responseData: unknown,
        stepType?: string,
        stepName?: string
    ) => {
        // Buscar información del paso
        let currentStepInfo;
        if (stepType && stepName) {
            currentStepInfo = { id: stepId, type: stepType, name: stepName };
        } else {
            if (currentStepIndex < 0 || currentStepIndex >= expandedSteps.length) return;
            currentStepInfo = expandedSteps[currentStepIndex];
            if (!currentStepInfo) return;
        }

        const { id: currentStepId, type: currentStepType, name: currentStepName } = currentStepInfo;

        if ((currentStepType === 'welcome' || currentStepType === 'thankyou') && responseData === undefined) {
            if (currentStepType === 'thankyou') {
                setResponsesData(prev => ({ ...prev, endTime: Date.now() }));
            }
            return;
        }

        const isCognitive = currentStepType.startsWith('cognitive_');
        const isSmartVOC = currentStepType.startsWith('smartvoc_');
        let effectiveAnswer = responseData;

        if (effectiveAnswer === undefined && (isCognitive || isSmartVOC)) {
            effectiveAnswer = isCognitive ? { text: "" } : { value: 0 };
        }

        const now = new Date().toISOString();
        const moduleResponse: ModuleResponse = {
            id: currentStepId,
            stepType: currentStepType,
            stepTitle: currentStepName || '',
            response: effectiveAnswer,
            createdAt: now,
            updatedAt: now,
        };

        try {
            moduleResponse.response = sanitizeForJSON(moduleResponse.response);
        } catch {
            moduleResponse.response = String(moduleResponse.response);
        }

        if (moduleResponse.response === undefined || moduleResponse.response === null) {
            const fallbackText = "Respuesta no capturada";
            if (isCognitive) moduleResponse.response = { text: fallbackText };
            else if (isSmartVOC) moduleResponse.response = { value: 0, note: fallbackText };
            else moduleResponse.response = fallbackText;
        }

        try {
            const firestoreResponseDocumentId = findExistingResponseId(currentStepId);

            await (responseAPI as UseResponseAPIReturn).saveOrUpdateResponse(
                currentStepId,
                currentStepType,
                currentStepName || '',
                moduleResponse.response,
                firestoreResponseDocumentId
            );
        } catch (apiError) {
            console.error('[useResponseManager] Error guardando respuesta en API:', apiError);
            setError(apiError instanceof Error ? apiError.message : 'Error guardando respuesta');
        }

        // Actualizar estado local
        setResponsesData(prev => {
            const newData = { ...prev };
            if (!newData.modules.all_steps) {
                newData.modules.all_steps = [];
            }

            const existingIndex = newData.modules.all_steps.findIndex(r => r.id === currentStepId);
            if (existingIndex >= 0) {
                newData.modules.all_steps[existingIndex] = moduleResponse;
            } else {
                newData.modules.all_steps.push(moduleResponse);
            }

            return newData;
        });
    }, [currentStepIndex, expandedSteps, responseAPI, findExistingResponseId]);

    const getStepResponse = useCallback((stepId: string): unknown => {
        if (responsesData.modules.all_steps) {
            const response = responsesData.modules.all_steps.find(r => r.id === stepId);
            return response?.response;
        }
        return undefined;
    }, [responsesData.modules.all_steps]);

    const hasStepBeenAnswered = useCallback((stepId: string): boolean => {
        return getStepResponse(stepId) !== undefined;
    }, [getStepResponse]);

    const getResponsesJson = useCallback((): string => {
        return JSON.stringify(responsesData, null, 2);
    }, [responsesData]);

    const markResponsesAsCompleted = useCallback(async (): Promise<void> => {
        try {
            await (responseAPI as UseResponseAPIReturn).markAsCompleted();
        } catch (error) {
            console.error('[useResponseManager] Error marcando respuestas como completadas:', error);
            setError(error instanceof Error ? error.message : 'Error marcando respuestas como completadas');
        }
    }, [responseAPI]);

    useEffect(() => {
        if (researchId && responsesData.researchId !== researchId) {
            setResponsesData(prev => ({ ...prev, researchId }));
        }
    }, [researchId, responsesData.researchId]);

    useEffect(() => {
        if (participantId && responsesData.participantId !== participantId) {
            setResponsesData(prev => ({ ...prev, participantId }));
        }
    }, [participantId, responsesData.participantId]);

    return {
        responsesData,
        loadExistingResponses,
        saveStepResponse,
        getStepResponse,
        hasStepBeenAnswered,
        getResponsesJson,
        markResponsesAsCompleted,
        isLoading,
        error
    };
};
