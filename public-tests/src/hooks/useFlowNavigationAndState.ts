import { useCallback, useEffect, useState } from 'react';
import { ParticipantFlowStep } from '../types/flow';
import { ExpandedStep } from '../types/flow.types';
import { UseFlowNavigationAndStateProps } from '../types/hooks.types';

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
            const effectiveMaxIndex = maxVisitedIndexFromStore || 0;
            const storedCurrentIndex = 0;
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
            const nextIndex = currentStepIndex + 1;
            if (answer !== undefined) {
                await saveStepResponse(answer);
            }
            setCurrentStepIndex(nextIndex);
            setError(null);
        } else {
            if (!isFlowLoading) {
                if (answer !== undefined) {
                    await saveStepResponse(answer);
                }
                setCurrentStep(ParticipantFlowStep.DONE);
                await markResponsesAsCompleted();
            } else {
                console.warn('[useFlowNavigationAndState] ⏳ goToNextStep llamado pero el flujo está cargando.');
            }
        }
    }, [currentStepIndex, expandedSteps, isFlowLoading, saveStepResponse, markResponsesAsCompleted, setCurrentStepIndex, setError, setCurrentStep]);

    const navigateToStep = useCallback((targetIndex: number) => {
        if (isFlowLoading) {
            return;
        }

        if (targetIndex < 0 || targetIndex >= expandedSteps.length) {
            return;
        }

        if (targetIndex === currentStepIndex) {

            return;
        }

        const maxVisited = Math.max(maxVisitedIndexFromStore || 0, currentStepIndex);
        const isForwardNavigation = targetIndex > maxVisited + 1;

        if (isForwardNavigation) {
            return;
        }

        const savedResponse = getStepResponse(targetIndex);

        if (savedResponse !== null && savedResponse !== undefined && setExternalExpandedSteps) {
            setExternalExpandedSteps((prevSteps: ExpandedStep[]) => prevSteps.map((step: ExpandedStep, index: number) => {
                if (index === targetIndex) {
                    const prevConfig = (typeof step.config === 'object' && step.config !== null) ? step.config : {};
                    const newConfig = { ...prevConfig, savedResponses: savedResponse };
                    return { ...step, config: newConfig };
                }
                return step;
            }));
        }

        setCurrentStepIndex(targetIndex);

        if (currentStep !== ParticipantFlowStep.WELCOME && currentStep !== ParticipantFlowStep.DONE) {
            setCurrentStep(ParticipantFlowStep.WELCOME);
        }

        setError(null);
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
