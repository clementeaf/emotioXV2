import { useCallback, useEffect, useState } from 'react';
import { ModuleResponse, ResponsesData } from '../stores/participantStore';
import { UseResponseAPIReturn, UseResponseManagerProps, UseResponseManagerReturn } from '../types/hooks.types';

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

            // 🔥 FIX: Si responses es un array, úsalo directamente
            if (Array.isArray(modulesDataFromApi)) {
                storeSetLoadedResponses(modulesDataFromApi);
            } else if (
                modulesDataFromApi &&
                typeof modulesDataFromApi === 'object' &&
                'all_steps' in modulesDataFromApi &&
                Array.isArray((modulesDataFromApi as { all_steps?: unknown }).all_steps)
            ) {
                storeSetLoadedResponses((modulesDataFromApi as { all_steps: unknown[] }).all_steps as ModuleResponse[]);
            } else {
                // Solo advertir si modulesDataFromApi no es null/undefined (que es esperado para nuevos participantes)
                if (modulesDataFromApi !== null && modulesDataFromApi !== undefined) {
                    // No console.log
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

    // NUEVO: Función para generar questionKey único
    const generateQuestionKey = useCallback((stepId: string, stepType: string, questionIndex?: number): string => {
        const baseKey = `${stepId}_${stepType}`;
        return questionIndex !== undefined ? `${baseKey}_q${questionIndex}` : baseKey;
    }, []);

    // NUEVO: Función para validar questionKey
    const validateQuestionKey = useCallback((questionKey: string, expectedStepId: string, expectedStepType: string): boolean => {
        const parts = questionKey.split('_');
        if (parts.length < 2) return false;

        const stepId = parts[0];
        const stepType = parts[1];

        return stepId === expectedStepId && stepType === expectedStepType;
    }, []);

    const saveStepResponse = useCallback(async (
        stepId: string,
        responseData: unknown,
        stepType?: string,
        stepName?: string,
        questionIndex?: number // NUEVO: Índice de pregunta para questionKey único
    ) => {
        const currentStep = expandedSteps[currentStepIndex];
        const currentStepType = stepType || currentStep?.type || 'unknown';
        const currentStepName = stepName || currentStep?.name || stepId;

        // NUEVO: Generar questionKey único
        const questionKey = generateQuestionKey(stepId, currentStepType, questionIndex);

        console.log(`[useResponseManager] 🔑 Guardando respuesta con questionKey: ${questionKey}`, {
            stepId,
            stepType: currentStepType,
            stepName: currentStepName,
            questionIndex,
            questionKey
        });

        // Validar que el questionKey sea válido
        if (!validateQuestionKey(questionKey, stepId, currentStepType)) {
            console.error(`[useResponseManager] ❌ questionKey inválido: ${questionKey}`);
            setError('Error: Identificador de pregunta inválido');
            return;
        }

        const isCognitive = currentStepType.startsWith('cognitive_');
        const isSmartVOC = currentStepType.startsWith('smartvoc_');

        const now = new Date().toISOString();
        const moduleResponse: ModuleResponse = {
            id: stepId,
            stepType: currentStepType,
            stepTitle: currentStepName,
            response: responseData,
            createdAt: now,
            updatedAt: now,
            questionKey: questionKey, // NUEVO: Incluir questionKey en la respuesta
            participantId: participantId || undefined,
            researchId: researchId || undefined
        };

        // Validar que la respuesta no esté vacía
        if (moduleResponse.response === undefined || moduleResponse.response === null) {
            const fallbackText = "Respuesta no capturada";
            if (isCognitive) moduleResponse.response = { text: fallbackText };
            else if (isSmartVOC) moduleResponse.response = { value: 0, note: fallbackText };
            else moduleResponse.response = fallbackText;
        }

        try {
            const firestoreResponseDocumentId = findExistingResponseId(stepId);

            await (responseAPI as UseResponseAPIReturn).saveOrUpdateResponse(
                stepId,
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

            // NUEVO: Buscar por questionKey en lugar de solo stepId
            const existingIndex = newData.modules.all_steps.findIndex(r =>
                r.questionKey === questionKey || r.id === stepId
            );

            if (existingIndex >= 0) {
                newData.modules.all_steps[existingIndex] = moduleResponse;
            } else {
                newData.modules.all_steps.push(moduleResponse);
            }

            return newData;
        });
    }, [currentStepIndex, expandedSteps, responseAPI, findExistingResponseId, generateQuestionKey, validateQuestionKey, researchId, participantId]);

    const getStepResponse = useCallback((stepId: string, questionIndex?: number): unknown => {
        if (responsesData.modules.all_steps) {
            // NUEVO: Buscar por questionKey si se proporciona questionIndex
            if (questionIndex !== undefined) {
                const questionKey = generateQuestionKey(stepId, 'unknown', questionIndex);
                const response = responsesData.modules.all_steps.find(r => r.questionKey === questionKey);
                return response?.response;
            }

            // Fallback: buscar por stepId
            const response = responsesData.modules.all_steps.find(r => r.id === stepId);
            return response?.response;
        }
        return undefined;
    }, [responsesData.modules.all_steps, generateQuestionKey]);

    const hasStepBeenAnswered = useCallback((stepId: string, questionIndex?: number): boolean => {
        return getStepResponse(stepId, questionIndex) !== undefined;
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
