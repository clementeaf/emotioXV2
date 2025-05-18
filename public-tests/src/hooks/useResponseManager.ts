import { useState, useCallback, useEffect } from 'react';
import { ModuleResponse, ResponsesData } from './types';
import { ExpandedStep } from '../types/flow';

const sanitizeForJSON = (obj: unknown): unknown => {
    if (!obj) return obj;
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        if (key.startsWith('__react')) return undefined;
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Referencia Circular]';
            seen.add(value);
            if (typeof window !== 'undefined' && (value instanceof Element || value instanceof HTMLElement)) return '[Elemento DOM]';
            if ('current' in value && typeof window !== 'undefined' && (value.current instanceof Element || value.current instanceof HTMLElement)) return '[React Ref]';
        }
        return value;
    }));
};

interface UseResponseManagerProps {
    researchId: string | undefined;
    participantId: string | undefined;
    expandedSteps: ExpandedStep[];
    currentStepIndex: number;
    responseAPI: unknown;
    storeSetLoadedResponses: (loadedStepResponses: ModuleResponse[]) => void;
}

export const useResponseManager = ({
    researchId,
    participantId,
    expandedSteps,
    currentStepIndex,
    responseAPI,
    storeSetLoadedResponses,
}: UseResponseManagerProps) => {
    const [responsesData, setResponsesData] = useState<ResponsesData>(() => ({
        researchId: researchId || '',
        startTime: Date.now(),
        modules: {
            cognitive_task: [],
            smartvoc: [],
            all_steps: []
        }
    }));

    const loadExistingResponsesInternal = useCallback(async () => {
        if (!researchId || !participantId) return;
        const api = responseAPI as {
            getResponses: () => Promise<unknown>;
            saveOrUpdateResponse: (...args: unknown[]) => Promise<unknown>;
            markAsCompleted: () => Promise<void>;
        };
        try {
            const apiResponse = await api.getResponses();
            if (!apiResponse || typeof apiResponse !== 'object' || apiResponse === null || !('responses' in apiResponse)) {
                console.warn('[useResponseManager] No se obtuvo apiResponse.responses. Enviando array vacío a setLoadedResponses.');
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
                console.warn('[useResponseManager] modulesDataFromApi no tiene el formato esperado o all_steps no es un array. Enviando array vacío a setLoadedResponses. Recibido:', modulesDataFromApi);
                storeSetLoadedResponses([]);
            }
        } catch (error) {
            console.error('[useResponseManager] Error cargando respuestas existentes:', error);
            storeSetLoadedResponses([]);
        }
    }, [researchId, participantId, responseAPI, storeSetLoadedResponses]);

    const findExistingResponseIdInternal = useCallback((stepId: string): string | undefined => {
        if (responsesData.modules.all_steps) {
            const existing = responsesData.modules.all_steps.find(resp => resp.id === stepId);
            if (existing) return existing.id;
        }
        return undefined;
    }, [responsesData.modules.all_steps]);

    const saveStepResponseInternal = useCallback(async (answer: unknown) => {
        if (currentStepIndex < 0 || currentStepIndex >= expandedSteps.length) return;
        
        const currentStepInfo = expandedSteps[currentStepIndex];
        if (!currentStepInfo) return;

        const { id: stepId, type: stepType, name: stepName } = currentStepInfo;

        if ((stepType === 'welcome' || stepType === 'thankyou') && answer === undefined) {
            if (stepType === 'thankyou') {
                setResponsesData(prev => ({ ...prev, endTime: Date.now() }));
            }
            return;
        }

        const isCognitive = stepType.startsWith('cognitive_');
        const isSmartVOC = stepType.startsWith('smartvoc_');
        let effectiveAnswer = answer;

        if (effectiveAnswer === undefined && (isCognitive || isSmartVOC)) {
            effectiveAnswer = isCognitive ? { text: "" } : { value: 0 };
        }

        const now = new Date().toISOString();
        const moduleResponse: ModuleResponse = {
            id: stepId,
            stepType: stepType,
            stepTitle: stepName || '',
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
            const firestoreResponseDocumentId = findExistingResponseIdInternal(stepId);
            
            await (responseAPI as { saveOrUpdateResponse: (...args: unknown[]) => Promise<unknown> }).saveOrUpdateResponse(
                stepId,
                stepType,
                stepName || '',
                moduleResponse.response,
                firestoreResponseDocumentId,
                stepId,
                () => {
                    if (researchId && participantId) {
                        loadExistingResponsesInternal();
                    }
                }
            );
        } catch (apiError) {
            console.error('[useResponseManager] Error guardando respuesta en API:', apiError);
        }

        setResponsesData(prev => {
            const newUpdatedData = JSON.parse(JSON.stringify(prev));

            const findAndReplaceOrAdd = (arr: ModuleResponse[], newItem: ModuleResponse) => {
                const idx = arr.findIndex(r => r.id === newItem.id);
                if (idx >= 0) arr[idx] = newItem; else arr.push(newItem);
            };

            if (stepType === 'demographic') newUpdatedData.modules.demographic = moduleResponse;
            else if (stepName?.includes('Que te ha parecido el módulo')) newUpdatedData.modules.feedback = moduleResponse;
            else if (stepType === 'welcome' && effectiveAnswer !== undefined) newUpdatedData.modules.welcome = moduleResponse;
            else if (isCognitive) {
                if (!newUpdatedData.modules.cognitive_task) newUpdatedData.modules.cognitive_task = [];
                findAndReplaceOrAdd(newUpdatedData.modules.cognitive_task, moduleResponse);
            } else if (isSmartVOC) {
                if (!newUpdatedData.modules.smartvoc) newUpdatedData.modules.smartvoc = [];
                findAndReplaceOrAdd(newUpdatedData.modules.smartvoc, moduleResponse);
            } else {
                const category = stepType.split('_')[0] || 'other';
                if (!newUpdatedData.modules[category]) newUpdatedData.modules[category] = [];
                if (!Array.isArray(newUpdatedData.modules[category])) newUpdatedData.modules[category] = [newUpdatedData.modules[category] as ModuleResponse];
                findAndReplaceOrAdd(newUpdatedData.modules[category] as ModuleResponse[], moduleResponse);
            }

            if (!newUpdatedData.modules.all_steps) newUpdatedData.modules.all_steps = [];
            findAndReplaceOrAdd(newUpdatedData.modules.all_steps, moduleResponse);
            
            return newUpdatedData;
        });
    }, [currentStepIndex, expandedSteps, researchId, participantId, responseAPI, loadExistingResponsesInternal, findExistingResponseIdInternal]);

    const getStepResponseInternal = useCallback((stepIndexForResponse: number): unknown => {
        if (stepIndexForResponse < 0 || stepIndexForResponse >= expandedSteps.length) return null;
        const step = expandedSteps[stepIndexForResponse];
        if (!step) return null;
        const { id: stepIdToFind, type: stepType } = step;
        if (stepType === 'welcome' || stepType === 'thankyou') return null;
        if (responsesData.modules.all_steps && Array.isArray(responsesData.modules.all_steps)) {
            const foundResponse = responsesData.modules.all_steps.find(resp => resp.id === stepIdToFind);
            if (foundResponse) return foundResponse.response;
        }
        return null; 
    }, [expandedSteps, responsesData.modules.all_steps]);

    const hasStepBeenAnsweredInternal = useCallback((stepIndexForCheck: number): boolean => {
        if (stepIndexForCheck < 0 || stepIndexForCheck >= expandedSteps.length) return false;
        const step = expandedSteps[stepIndexForCheck];
        if (!step) return false;
        const { id: stepIdToFind, type: stepType } = step;
        if (stepType === 'welcome' || stepType === 'thankyou') return true;
        if (responsesData.modules.all_steps && Array.isArray(responsesData.modules.all_steps)) {
            return responsesData.modules.all_steps.some(resp => resp.id === stepIdToFind);
        }
        return false;
    }, [expandedSteps, responsesData.modules.all_steps]);

    const getResponsesJsonInternal = useCallback(() => {
        return JSON.stringify(responsesData, null, 2);
    }, [responsesData]);

    const markResponsesAsCompletedInternal = useCallback(async () => {
        try {
            await (responseAPI as { markAsCompleted: () => Promise<void> }).markAsCompleted();
        } catch (error) {
            console.error('[useResponseManager] Error marcando respuestas como completadas:', error);
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
        setResponsesData,
        loadExistingResponses: loadExistingResponsesInternal,
        saveStepResponse: saveStepResponseInternal,
        getStepResponse: getStepResponseInternal,
        hasStepBeenAnswered: hasStepBeenAnsweredInternal,
        getResponsesJson: getResponsesJsonInternal,
        markResponsesAsCompleted: markResponsesAsCompletedInternal,
    };
}; 