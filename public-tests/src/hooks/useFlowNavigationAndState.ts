import { useState, useEffect, useCallback } from 'react';
import { ParticipantFlowStep, ExpandedStep, UseFlowNavigationAndStateProps } from '../types/flow';

export const useFlowNavigationAndState = ({
    expandedSteps,
    initialResearchDataLoading,
    researchId,
    participantId,
    maxVisitedIndexFromStore,
    saveStepResponse,
    markResponsesAsCompleted,
    getStepResponse,
    loadExistingResponses,

    setExternalExpandedSteps,
    currentStepIndexState,
    setCurrentStepIndexFunc,
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

        const targetStepInfo = expandedSteps[targetIndex];
        
        // Lógica simplificada: Si el sidebar permitió la navegación, confiar en esa decisión
        // Solo bloquear navegación hacia adelante más allá del máximo visitado + 1
        const maxVisited = Math.max(maxVisitedIndexFromStore || 0, currentStepIndex);
        const isForwardNavigation = targetIndex > maxVisited + 1;
        
        console.log(`[useFlowNavigationAndState] Verificaciones simplificadas:`);
        console.log(`  - maxVisited: ${maxVisited}, targetIndex: ${targetIndex}`);
        console.log(`  - isForwardNavigation: ${isForwardNavigation}`);
        console.log(`  - permitirNavegacion: ${!isForwardNavigation}`);
        
        if (isForwardNavigation) {
            console.log('[useFlowNavigationAndState] Navegación bloqueada: salto hacia adelante no permitido');
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
        getStepResponse, 
        setExternalExpandedSteps, 
        setCurrentStepIndex, 
        setCurrentStep,
        setError, 
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