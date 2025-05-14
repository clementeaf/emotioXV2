import { useState, useCallback, useEffect } from 'react';
import { ModuleResponse, ResponsesData } from './types';
import { ExpandedStep } from '../types/flow';

const sanitizeForJSON = (obj: any): any => {
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
    responseAPI: any;
    storeSetLoadedResponses: (loadedModules: ResponsesData['modules']) => void;
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
        try {
            const apiResponse = await responseAPI.getResponses();
            if (!apiResponse) return;
            
            const modulesDataFromApi = apiResponse?.responses; 

            if (modulesDataFromApi && typeof modulesDataFromApi === 'object' && !Array.isArray(modulesDataFromApi)) {
                storeSetLoadedResponses(modulesDataFromApi as ResponsesData['modules']);
            } else {
                storeSetLoadedResponses({
                    cognitive_task: [],
                    smartvoc: [],
                    all_steps: []
                });
            }
        } catch (error) {
            console.error('[useResponseManager] Error cargando respuestas existentes:', error);
            storeSetLoadedResponses({ cognitive_task: [], smartvoc: [], all_steps: [] });
        }
    }, [researchId, participantId, responseAPI, storeSetLoadedResponses]);

    const findExistingResponseIdInternal = useCallback((stepId: string): string | undefined => {
        if (responsesData.modules.all_steps) {
            const existing = responsesData.modules.all_steps.find(resp => resp.stepId === stepId);
            if (existing && 'id' in existing) {
                return (existing as any).id as string;
            }
        }
        return undefined;
    }, [responsesData.modules.all_steps]);

    const saveStepResponseInternal = useCallback(async (answer: any) => {
        if (currentStepIndex < 0 || currentStepIndex >= expandedSteps.length) return;
        
        const currentStepInfo = expandedSteps[currentStepIndex];
        if (!currentStepInfo) return;

        const { id: stepId, type: stepType, name: stepName, config } = currentStepInfo;

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

        const moduleResponse: ModuleResponse = {
            stepId,
            stepType,
            stepName,
            question: config?.questionText || config?.title || stepName,
            answer: effectiveAnswer,
            timestamp: Date.now()
        };

        try {
            moduleResponse.answer = sanitizeForJSON(moduleResponse.answer);
        } catch (sanitizeError) {
            moduleResponse.answer = String(moduleResponse.answer);
        }

        if (moduleResponse.answer === undefined || moduleResponse.answer === null) {
            if (isCognitive) moduleResponse.answer = { text: "Respuesta no capturada" };
            else if (isSmartVOC) moduleResponse.answer = { value: 0 };
            else moduleResponse.answer = "Respuesta no capturada";
        }

        try {
            const existingResponseId = findExistingResponseIdInternal(stepId);
            await responseAPI.saveOrUpdateResponse(
                stepId,
                stepType,
                stepName || '',
                moduleResponse.answer,
                existingResponseId,
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
            if (stepType === 'demographic') newUpdatedData.modules.demographic = moduleResponse;
            else if (stepName?.includes('Que te ha parecido el módulo')) newUpdatedData.modules.feedback = moduleResponse;
            else if (stepType === 'welcome' && effectiveAnswer !== undefined) newUpdatedData.modules.welcome = moduleResponse;
            else if (isCognitive) {
                if (!newUpdatedData.modules.cognitive_task) newUpdatedData.modules.cognitive_task = [];
                const idx = newUpdatedData.modules.cognitive_task.findIndex((r: { stepId: string; }) => r.stepId === stepId);
                if (idx >= 0) newUpdatedData.modules.cognitive_task[idx] = moduleResponse; else newUpdatedData.modules.cognitive_task.push(moduleResponse);
            } else if (isSmartVOC) {
                if (!newUpdatedData.modules.smartvoc) newUpdatedData.modules.smartvoc = [];
                const idx = newUpdatedData.modules.smartvoc.findIndex((r: { stepId: string; }) => r.stepId === stepId);
                if (idx >= 0) newUpdatedData.modules.smartvoc[idx] = moduleResponse; else newUpdatedData.modules.smartvoc.push(moduleResponse);
            } else {
                const category = stepType.split('_')[0] || 'other';
                if (!newUpdatedData.modules[category]) newUpdatedData.modules[category] = [];
                if (!Array.isArray(newUpdatedData.modules[category])) newUpdatedData.modules[category] = [newUpdatedData.modules[category] as ModuleResponse];
                (newUpdatedData.modules[category] as ModuleResponse[]).push(moduleResponse);
            }
            if (!newUpdatedData.modules.all_steps) newUpdatedData.modules.all_steps = [];
            const allIdx = newUpdatedData.modules.all_steps.findIndex((r: { stepId: string; }) => r.stepId === stepId);
            if (allIdx >= 0) newUpdatedData.modules.all_steps[allIdx] = moduleResponse; else newUpdatedData.modules.all_steps.push(moduleResponse);
            return newUpdatedData;
        });
    }, [currentStepIndex, expandedSteps, researchId, participantId, responseAPI, storeSetLoadedResponses, findExistingResponseIdInternal, loadExistingResponsesInternal]);

    const getStepResponseInternal = useCallback((stepIndexForResponse: number): any => {
        if (stepIndexForResponse < 0 || stepIndexForResponse >= expandedSteps.length) return null;
        const step = expandedSteps[stepIndexForResponse];
        if (!step) return null;
        const { id: stepId, type: stepType } = step;
        if (stepType === 'welcome' || stepType === 'thankyou') return null;
        if (responsesData.modules.all_steps && Array.isArray(responsesData.modules.all_steps)) {
            const response = responsesData.modules.all_steps.find(resp => resp.stepId === stepId);
            if (response) return response.answer;
        }
        return null; 
    }, [expandedSteps, responsesData.modules.all_steps]);

    const hasStepBeenAnsweredInternal = useCallback((stepIndexForCheck: number): boolean => {
        if (stepIndexForCheck < 0 || stepIndexForCheck >= expandedSteps.length) return false;
        const step = expandedSteps[stepIndexForCheck];
        if (!step) return false;
        const { id: stepId, type: stepType } = step;
        if (stepType === 'welcome' || stepType === 'thankyou') return true;
        if (responsesData.modules.all_steps && Array.isArray(responsesData.modules.all_steps)) {
            return responsesData.modules.all_steps.some(resp => resp.stepId === stepId);
        }
        return false;
    }, [expandedSteps, responsesData.modules.all_steps]);

    const getResponsesJsonInternal = useCallback(() => {
        return JSON.stringify(responsesData, null, 2);
    }, [responsesData]);

    const markResponsesAsCompletedInternal = useCallback(async () => {
        try {
            await responseAPI.markAsCompleted();
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