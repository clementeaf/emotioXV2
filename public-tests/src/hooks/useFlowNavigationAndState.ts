import { useState, useEffect, useCallback } from 'react';
import { ParticipantFlowStep, ExpandedStep } from '../types/flow';
import { ModuleResponse } from './types';

interface UseFlowNavigationAndStateProps {
    expandedSteps: ExpandedStep[];
    initialResearchDataLoading: boolean;
    researchId: string | undefined;
    participantId: string | undefined;
    maxVisitedIndexFromStore: number | undefined;
    loadedApiResponsesFromStore: ModuleResponse[];
    saveStepResponse: (answer?: any) => Promise<void>;
    markResponsesAsCompleted: () => Promise<void>;
    getStepResponse: (stepIndex: number) => any;
    loadExistingResponses: () => Promise<void>;
    handleErrorProp: (errorMessage: string, step: ParticipantFlowStep | string) => void;
    setExternalExpandedSteps?: (updater: (prevSteps: ExpandedStep[]) => ExpandedStep[]) => void; 
    currentStepIndexState: number;
    setCurrentStepIndexFunc: React.Dispatch<React.SetStateAction<number>>;
}

export const useFlowNavigationAndState = ({
    expandedSteps,
    initialResearchDataLoading,
    researchId,
    participantId,
    maxVisitedIndexFromStore,
    loadedApiResponsesFromStore,
    saveStepResponse,
    markResponsesAsCompleted,
    getStepResponse,
    loadExistingResponses,

    setExternalExpandedSteps,
    currentStepIndexState,
    setCurrentStepIndexFunc
}: UseFlowNavigationAndStateProps) => {
    const [currentStep, setCurrentStep] = useState<ParticipantFlowStep>(ParticipantFlowStep.LOADING_SESSION);
    const [error, setError] = useState<string | null>(null);
    const [isFlowLoading, setIsFlowLoading] = useState<boolean>(true);
    const currentStepIndex = currentStepIndexState;
    const setCurrentStepIndex = setCurrentStepIndexFunc;

    useEffect(() => {
        setIsFlowLoading(initialResearchDataLoading);
    }, [initialResearchDataLoading]);

    useEffect(() => {
        if (expandedSteps && expandedSteps.length > 0 && !isFlowLoading && currentStep === ParticipantFlowStep.LOADING_SESSION) {
            const storedMaxIndex = parseInt(localStorage.getItem('maxVisitedIndex') || '0', 10);
            const effectiveMaxIndex = Math.max(storedMaxIndex, maxVisitedIndexFromStore || 0);
            const storedCurrentIndex = parseInt(localStorage.getItem('currentStepIndex') || '0', 10);
            let targetIndex = 0;
            if (storedCurrentIndex > 0 && storedCurrentIndex < expandedSteps.length && storedCurrentIndex <= effectiveMaxIndex) {
                targetIndex = storedCurrentIndex;
            } else if (effectiveMaxIndex > 0 && effectiveMaxIndex < expandedSteps.length) {
                targetIndex = effectiveMaxIndex;
            }
            setCurrentStepIndex(targetIndex);
            setCurrentStep(ParticipantFlowStep.WELCOME);
            if (researchId && participantId) {
                loadExistingResponses();
            }
            setIsFlowLoading(false); 
        } else if (expandedSteps && expandedSteps.length === 0 && !isFlowLoading && currentStep === ParticipantFlowStep.LOADING_SESSION && researchId /*&& !isResearchFlowError <- esta ya no está aquí */) {
            setCurrentStep(ParticipantFlowStep.WELCOME);
            setIsFlowLoading(false);
        }
    }, [expandedSteps, isFlowLoading, currentStep, maxVisitedIndexFromStore, researchId, loadExistingResponses, participantId]);

    const goToNextStep = useCallback(async (answer?: any) => {
        if (!isFlowLoading && currentStepIndex < expandedSteps.length - 1) {
            const currentStepInfo = expandedSteps[currentStepIndex];
            if(!currentStepInfo) return;
            const { type: stepType } = currentStepInfo;
            const isCognitive = stepType.startsWith('cognitive_');
            const isSmartVOC = stepType.startsWith('smartvoc_');
            if (answer === undefined && (isCognitive || isSmartVOC)) {
                answer = isCognitive ? 
                    { text: "Respuesta vacía", isEmpty: true } : 
                    { value: 0, isEmpty: true };
            }
            if (answer !== undefined) {
                await saveStepResponse(answer); 
                if (setExternalExpandedSteps && currentStepInfo) {
                    setExternalExpandedSteps(prevSteps => prevSteps.map((step, index) => 
                        index === currentStepIndex ? { ...step, config: { ...step.config, savedResponses: answer } } : step
                    ));
                }
            }
            const nextIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextIndex);
            setError(null); 
        } else if (!isFlowLoading) {
             if (answer !== undefined) {
                await saveStepResponse(answer);
             }
             setCurrentStep(ParticipantFlowStep.DONE);
             // setResponsesData para endTime se haría en useResponseManager si es posible o pasado de alguna forma
             await markResponsesAsCompleted();
        }
    }, [currentStepIndex, expandedSteps, isFlowLoading, saveStepResponse, markResponsesAsCompleted, setExternalExpandedSteps]);

    const navigateToStep = useCallback((targetIndex: number) => {
        let stepHasApiResponse = false;
        if (targetIndex >= 0 && targetIndex < expandedSteps.length) {
            const targetStepInfo = expandedSteps[targetIndex];
            if(targetStepInfo) {
                stepHasApiResponse = loadedApiResponsesFromStore.some(resp => resp.stepName === targetStepInfo.name); // Asumiendo stepName en ModuleResponse
            }
        }
        if (!isFlowLoading && targetIndex >= 0 && (targetIndex <= (maxVisitedIndexFromStore || 0) || stepHasApiResponse)) {
            const savedResponse = getStepResponse(targetIndex);
            if (savedResponse !== null && savedResponse !== undefined && setExternalExpandedSteps) {
                 setExternalExpandedSteps(prevSteps => prevSteps.map((step, index) => 
                    index === targetIndex ? { ...step, config: { ...step.config, savedResponses: savedResponse } } : step
                ));
            }
            setCurrentStepIndex(targetIndex);
            setError(null); 
        } else if (targetIndex === currentStepIndex) {
        } else {
            console.warn(`[useFlowNavigation] Navegación bloqueada al índice ${targetIndex}. MaxVisitado: ${maxVisitedIndexFromStore}, TieneRespuestaAPI: ${stepHasApiResponse}`);
        }
    }, [isFlowLoading, expandedSteps, loadedApiResponsesFromStore, maxVisitedIndexFromStore, getStepResponse, setExternalExpandedSteps]);
    
    const totalRelevantSteps = Math.max(0, expandedSteps ? expandedSteps.length - 2 : 0);
    let completedRelevantSteps = 0;
    if (expandedSteps && currentStepIndex > 0 && expandedSteps.length > 2) {
        completedRelevantSteps = Math.min(currentStepIndex, totalRelevantSteps); 
        if (currentStepIndex === expandedSteps.length - 1) {
             completedRelevantSteps = totalRelevantSteps;
        }
    }
    if (currentStep === ParticipantFlowStep.DONE) {
        completedRelevantSteps = totalRelevantSteps;
    }

    return {
        currentStep,
        setCurrentStep,
        currentStepIndex,
        setCurrentStepIndex,
        error,
        setError, 
        isFlowLoading,
        setIsFlowLoading, 
        goToNextStep,
        navigateToStep,
        completedRelevantSteps,
        totalRelevantSteps,
    };
}; 