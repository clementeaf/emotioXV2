import { useCallback, useEffect } from 'react';
import { Participant } from '../../../shared/interfaces/participant';
import { useParticipantStore } from '../stores/participantStore';
import { ParticipantFlowStep } from '../types/flow';
import { useFlowBuilder } from './useFlowBuilder';
import { useFlowNavigationAndState } from './useFlowNavigationAndState';
import { useParticipantSession } from './useParticipantSession';
import { useLoadResearchFormsConfig } from './useResearchForms';
import { useResponseAPI } from './useResponseAPI';
import { useResponseManager } from './useResponseManager';

const useStoreSetLoadedResponses = () => useParticipantStore(state => state.setLoadedResponses);

export const useParticipantFlow = (researchId: string | undefined) => {
    const storeSetResearchId = useParticipantStore(state => state.setResearchId);
    const storeSetLoadedResponsesFromStore = useStoreSetLoadedResponses();

    const {
        token,
        participantIdFromStore,
        handleLoginSuccess: handleLoginSuccessFromSession,
    } = useParticipantSession();

    const participantId = participantIdFromStore;
    const loadedApiResponsesFromStore = useParticipantStore(state => state.responsesData.modules.all_steps);
    const maxVisitedIndexFromStore = useParticipantStore(state => state.maxVisitedIndex);

    const currentStepIndex = useParticipantStore(state => state.currentStepIndex);
    const setCurrentStepIndex = useParticipantStore(state => state.setCurrentStepIndex);
    const storeNavigateToStep = useParticipantStore(state => state.navigateToStep);
    const storeGoToNextStep = useParticipantStore(state => state.goToNextStep);
    const storeSetExpandedSteps = useParticipantStore(state => state.setExpandedSteps);
    const storeIsFlowLoading = useParticipantStore(state => state.isFlowLoading);
    const storeSetIsFlowLoading = useParticipantStore(state => state.setIsFlowLoading);

    const {
        data: researchFlowApiData,
        isLoading: isResearchFlowHookLoading,
        isError: isResearchFlowError,
        error: researchFlowErrorObject
    } = useLoadResearchFormsConfig(researchId || '', {
        enabled: !!researchId && !!token,
    });

    const demographicQuestionsFound: unknown[] = [];

    if (researchFlowApiData && researchFlowApiData.data && Array.isArray(researchFlowApiData.data)) {
        for (const processedModule of researchFlowApiData.data) {
            if (processedModule.originalSk === 'EYE_TRACKING_CONFIG') {
                if (processedModule.config && typeof processedModule.config.demographicQuestions === 'object' && processedModule.config.demographicQuestions !== null) {
                    demographicQuestionsFound.push(processedModule.config.demographicQuestions);
                } else if (Array.isArray(processedModule.config.demographicQuestions)) {
                    demographicQuestionsFound.push(...processedModule.config.demographicQuestions);
                }
            }
        }
    }

    // Solo construir el flujo si hay token (evita warnings durante login)
    const shouldBuildFlow = !!token;
    const builtExpandedSteps = useFlowBuilder({
        researchFlowApiData: shouldBuildFlow ? researchFlowApiData : null,
        isLoading: isResearchFlowHookLoading || !shouldBuildFlow
    });
    const expandedSteps = builtExpandedSteps;

    const responseAPI = useResponseAPI({
        researchId: researchId || '',
        participantId: participantId || ''
    });

    const {
        responsesData,
        loadExistingResponses,
        saveStepResponse,
        getStepResponse,
        hasStepBeenAnswered,
        getResponsesJson,
        markResponsesAsCompleted,
    } = useResponseManager({
        researchId: researchId || '',
        participantId: participantId === null ? undefined : participantId,
        expandedSteps,
        currentStepIndex,
        responseAPI: responseAPI as any,
        storeSetLoadedResponses: storeSetLoadedResponsesFromStore as (responses: unknown[]) => void
    });

    const {
        currentStep,
        setCurrentStep,
        error: navigationError,
        setError: setNavigationError,
        isFlowLoading: navigationIsLoading,
        setIsFlowLoading: setNavigationIsLoading,
        completedRelevantSteps,
        totalRelevantSteps,
    } = useFlowNavigationAndState({
        expandedSteps,
        initialResearchDataLoading: isResearchFlowHookLoading,
        researchId,
        participantId: participantId === null ? undefined : participantId,
        maxVisitedIndexFromStore: maxVisitedIndexFromStore,
        saveStepResponse: saveStepResponse,
        markResponsesAsCompleted: markResponsesAsCompleted,
        getStepResponse: getStepResponse,
        loadExistingResponses: loadExistingResponses,
        handleErrorProp: (errMsg: string, errStep: any) => handleError(errMsg, errStep),
        setExternalExpandedSteps: () => expandedSteps,
        currentStepIndexState: currentStepIndex,
        setCurrentStepIndexFunc: (value: any) => {
          if (typeof value === 'function') {
            const next = value(currentStepIndex);
            setCurrentStepIndex(next);
          } else {
            setCurrentStepIndex(value);
          }
        }
    });

    const handleError = useCallback((errorMessage: string, step: ParticipantFlowStep | string) => {
        const stepName = typeof step === 'string' ? step : ParticipantFlowStep[step];
        console.error(`[useParticipantFlow] Error en ${stepName}:`, errorMessage);
        setNavigationError(errorMessage);
        setCurrentStep(ParticipantFlowStep.ERROR);
        setNavigationIsLoading(false);
    }, [setNavigationError, setCurrentStep, setNavigationIsLoading]);

    useEffect(() => {
        setNavigationIsLoading(isResearchFlowHookLoading);
        if (!researchId) {
            handleError("ID de investigación no encontrado.", "Initialization");
            return;
        }
        if (!token && currentStep !== ParticipantFlowStep.LOGIN && currentStep !== ParticipantFlowStep.ERROR) {
            setCurrentStep(ParticipantFlowStep.LOGIN);
            return;
        }
        if (researchId && token && !isResearchFlowHookLoading) {
            storeSetResearchId(researchId);
            if (isResearchFlowError) {
                handleError(researchFlowErrorObject?.message || "Error al cargar la configuración del estudio.", "ResearchFlowInit");
                return;
            }
        } else if (researchId && !token && currentStep !== ParticipantFlowStep.LOGIN && currentStep !== ParticipantFlowStep.ERROR) {
            setCurrentStep(ParticipantFlowStep.LOGIN);
        }
    }, [
        researchId, token, storeSetResearchId, handleError,
        isResearchFlowHookLoading, isResearchFlowError, researchFlowApiData, researchFlowErrorObject,
        currentStep, setCurrentStep, setNavigationIsLoading
    ]);

    useEffect(() => {
        if (expandedSteps && expandedSteps.length > 0 && !navigationIsLoading && currentStep === ParticipantFlowStep.LOADING_SESSION) {
            setCurrentStepIndex(0);
            setCurrentStep(ParticipantFlowStep.WELCOME);
            if (researchId && participantId) {
                loadExistingResponses();
            }
            setNavigationIsLoading(false);
        } else if (expandedSteps && expandedSteps.length === 0 && !navigationIsLoading && currentStep === ParticipantFlowStep.LOADING_SESSION && researchId && !isResearchFlowError) {
            setCurrentStep(ParticipantFlowStep.WELCOME);
            setNavigationIsLoading(false);
        }
    }, [
        expandedSteps, navigationIsLoading, currentStep, researchId,
        loadExistingResponses, participantId, isResearchFlowError, setCurrentStepIndex, setCurrentStep,
        setNavigationIsLoading
    ]);

    const handleLoginSuccess = useCallback(async (participant: Participant & { id: string }) => {
        handleLoginSuccessFromSession(participant);
        setNavigationError(null);
        setCurrentStep(ParticipantFlowStep.LOADING_SESSION);
        setNavigationIsLoading(true);
        if (researchId && participant.id) {
            loadExistingResponses();
        }
    }, [handleLoginSuccessFromSession, setNavigationError, setCurrentStep, setNavigationIsLoading, researchId, loadExistingResponses]);

    const getAnsweredStepIndices = useCallback((): number[] => {
        const completedStepIndices = new Set<number>();
        expandedSteps.forEach((step, index) => {
            const { type: stepType } = step;
            if (stepType === 'welcome' || stepType === 'thankyou') {
                completedStepIndices.add(index);
                return;
            }
            if (hasStepBeenAnswered(index.toString())) {
                completedStepIndices.add(index);
            }
        });
        for (let i = 0; i <= (maxVisitedIndexFromStore || 0); i++) {
            completedStepIndices.add(i);
        }
        return Array.from(completedStepIndices).sort((a, b) => a - b);
    }, [expandedSteps, maxVisitedIndexFromStore, hasStepBeenAnswered]);

    useEffect(() => {
        storeSetIsFlowLoading(isResearchFlowHookLoading);
    }, [isResearchFlowHookLoading, storeSetIsFlowLoading]);

    useEffect(() => {
        if (expandedSteps && expandedSteps.length > 0) {
            storeSetExpandedSteps(expandedSteps as import('../stores/participantStore').ExpandedStep[]);

            if (currentStep === ParticipantFlowStep.LOADING_SESSION && !navigationIsLoading) {
                setCurrentStep(ParticipantFlowStep.WELCOME);
            }
        }
    }, [expandedSteps, storeSetExpandedSteps, currentStep, navigationIsLoading, setCurrentStep]);

    return {
        currentStep,
        token: token,
        error: navigationError,
        handleLoginSuccess,
        handleStepComplete: storeGoToNextStep,
        handleError,
        expandedSteps,
        currentStepIndex,
        isFlowLoading: storeIsFlowLoading,
        navigateToStep: storeNavigateToStep,
        completedRelevantSteps,
        totalRelevantSteps,
        responsesData,
        getResponsesJson,
        hasStepBeenAnswered,
        getAnsweredStepIndices,
        getStepResponse,
        maxVisitedIndex: maxVisitedIndexFromStore,
        loadedApiResponses: loadedApiResponsesFromStore
    };
};
