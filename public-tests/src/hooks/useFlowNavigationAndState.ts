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
    saveStepResponse: (answer?: unknown) => Promise<void>;
    markResponsesAsCompleted: () => Promise<void>;
    getStepResponse: (stepIndex: number) => unknown;
    loadExistingResponses: () => Promise<void>;
    handleErrorProp: (errorMessage: string, step: ParticipantFlowStep | string) => void;
    setExternalExpandedSteps?: (updater: (prevSteps: ExpandedStep[]) => ExpandedStep[]) => void; 
    currentStepIndexState: number;
    setCurrentStepIndexFunc: React.Dispatch<React.SetStateAction<number>>;
    getAnsweredStepIndices?: () => number[];
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
    setCurrentStepIndexFunc,
    getAnsweredStepIndices
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
    }, [expandedSteps, isFlowLoading, currentStep, maxVisitedIndexFromStore, researchId, loadExistingResponses, participantId, setCurrentStepIndex, setCurrentStep]);

    const goToNextStep = useCallback(async (answer?: unknown) => {
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
                    setExternalExpandedSteps(prevSteps => prevSteps.map((step, index) => {
                        if (index === currentStepIndex) {
                            const prevConfig = (typeof step.config === 'object' && step.config !== null) ? step.config : {};
                            return { ...step, config: { ...prevConfig, savedResponses: answer } };
                        }
                        return step;
                    }));
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
             await markResponsesAsCompleted();
        }
    }, [currentStepIndex, expandedSteps, isFlowLoading, saveStepResponse, markResponsesAsCompleted, setExternalExpandedSteps, setCurrentStepIndex, setError, setCurrentStep]);

    const navigateToStep = useCallback((targetIndex: number) => {
        console.log(`[useFlowNavigationAndState] Intentando navegar al índice: ${targetIndex}`);
        console.log(`[useFlowNavigationAndState] Estado actual - currentStepIndex: ${currentStepIndex}, isFlowLoading: ${isFlowLoading}`);
        console.log(`[useFlowNavigationAndState] expandedSteps.length: ${expandedSteps.length}`);
        
        // Validaciones básicas
        if (isFlowLoading) {
            console.log('[useFlowNavigationAndState] Navegación bloqueada: flujo en carga');
            return;
        }
        
        if (targetIndex < 0 || targetIndex >= expandedSteps.length) {
            console.log('[useFlowNavigationAndState] Navegación bloqueada: índice fuera de rango');
            return;
        }
        
        if (targetIndex === currentStepIndex) {
            console.log('[useFlowNavigationAndState] Navegación bloqueada: ya estás en este paso');
            return;
        }

        let stepHasApiResponse = false;
        const targetStepInfo = expandedSteps[targetIndex];
        
        if (targetStepInfo && targetStepInfo.name) {
            stepHasApiResponse = loadedApiResponsesFromStore.some(resp => 
                (resp.stepTitle && targetStepInfo.responseKey && resp.stepTitle === targetStepInfo.responseKey)
            );
        }
        
        // Obtener pasos respondidos
        const answeredSteps = getAnsweredStepIndices ? getAnsweredStepIndices() : [];
        const isAnsweredStep = answeredSteps.includes(targetIndex);
        
        // Verificar si puede navegar a este paso
        const maxVisited = Math.max(maxVisitedIndexFromStore || 0, currentStepIndex);
        const canNavigateToStep = (
            isAnsweredStep || 
            stepHasApiResponse || 
            targetIndex <= maxVisited ||
            targetIndex === 0 // Siempre permitir ir al paso welcome
        );
        
        console.log(`[useFlowNavigationAndState] Verificaciones de navegación:`);
        console.log(`  - isAnsweredStep: ${isAnsweredStep}`);
        console.log(`  - stepHasApiResponse: ${stepHasApiResponse}`);
        console.log(`  - maxVisited: ${maxVisited}, targetIndex: ${targetIndex}`);
        console.log(`  - canNavigateToStep: ${canNavigateToStep}`);
        
        if (!canNavigateToStep) {
            console.log('[useFlowNavigationAndState] Navegación bloqueada: paso no disponible');
            return;
        }

        // Realizar la navegación
        console.log(`[useFlowNavigationAndState] Navegando al paso ${targetIndex}: ${targetStepInfo?.name}`);
        
        // Cargar respuesta guardada si existe
        const savedResponse = getStepResponse(targetIndex);
        if (savedResponse !== null && savedResponse !== undefined && setExternalExpandedSteps) {
            console.log(`[useFlowNavigationAndState] Cargando respuesta guardada para el paso ${targetIndex}`);
            setExternalExpandedSteps(prevSteps => prevSteps.map((step, index) => {
                if (index === targetIndex) {
                    const prevConfig = (typeof step.config === 'object' && step.config !== null) ? step.config : {};
                    return { ...step, config: { ...prevConfig, savedResponses: savedResponse } };
                }
                return step;
            }));
        }
        
        // Actualizar el índice del paso actual
        setCurrentStepIndex(targetIndex);
        
        // Actualizar localStorage para persistir la navegación
        localStorage.setItem('currentStepIndex', targetIndex.toString());
        
        // Asegurar que estamos en el estado correcto del flujo
        if (currentStep !== ParticipantFlowStep.WELCOME && currentStep !== ParticipantFlowStep.DONE) {
            setCurrentStep(ParticipantFlowStep.WELCOME);
        }
        
        // Limpiar errores
        setError(null);
        
        console.log(`[useFlowNavigationAndState] Navegación completada al paso ${targetIndex}`);
    }, [
        isFlowLoading, 
        expandedSteps, 
        currentStepIndex,
        currentStep,
        loadedApiResponsesFromStore, 
        getStepResponse, 
        setExternalExpandedSteps, 
        setCurrentStepIndex, 
        setCurrentStep,
        setError, 
        getAnsweredStepIndices,
        maxVisitedIndexFromStore
    ]);
    
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