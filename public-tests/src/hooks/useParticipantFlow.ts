import { useState, useEffect, useCallback } from 'react';
import { ParticipantFlowStep, ExpandedStep } from '../types/flow';
import { Participant } from '../../../shared/interfaces/participant';
import { useParticipantStore } from '../stores/participantStore';
import { useResponseAPI } from './useResponseAPI';
import { useLoadResearchFormsConfig } from './useResearchForms';
import { useFlowBuilder } from './useFlowBuilder';
import { useResponseManager } from './useResponseManager';
import { useFlowNavigationAndState } from './useFlowNavigationAndState';
import { ModuleResponse as HooksModuleResponse } from './types';
import { useParticipantSession } from './useParticipantSession';

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
    
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

    const { 
        data: researchFlowApiData, 
        isLoading: isResearchFlowHookLoading, 
        isError: isResearchFlowError,
        error: researchFlowErrorObject 
    } = useLoadResearchFormsConfig(researchId || '', {
        enabled: !!researchId && !!token,
    });

    let allSk: string[] = [];
    let demographicQuestionsFound: any[] = [];

    if (researchFlowApiData && researchFlowApiData.data && Array.isArray(researchFlowApiData.data)) {
        allSk = researchFlowApiData.data.map(p => p.originalSk);

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

    const builtExpandedSteps = useFlowBuilder({ researchFlowApiData });
    const [expandedSteps, setExpandedSteps] = useState<ExpandedStep[]>([]);

    useEffect(() => {
        if (builtExpandedSteps && builtExpandedSteps.length > 0) { 
            setExpandedSteps(builtExpandedSteps);
        }
    }, [builtExpandedSteps]);

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
        researchId,
        participantId: participantId === null ? undefined : participantId,
        expandedSteps,
        currentStepIndex,
        responseAPI,
        storeSetLoadedResponses: storeSetLoadedResponsesFromStore
    });

    const {
        currentStep,
        setCurrentStep,
        error: navigationError,
        setError: setNavigationError, 
        isFlowLoading: navigationIsLoading,
        setIsFlowLoading: setNavigationIsLoading, 
        goToNextStep,
        navigateToStep,
        completedRelevantSteps,
        totalRelevantSteps,
    } = useFlowNavigationAndState({
        expandedSteps,
        initialResearchDataLoading: isResearchFlowHookLoading, 
        researchId,
        participantId: participantId === null ? undefined : participantId,
        maxVisitedIndexFromStore: maxVisitedIndexFromStore, 
        loadedApiResponsesFromStore: loadedApiResponsesFromStore as unknown as HooksModuleResponse[], 
        saveStepResponse: saveStepResponse,
        markResponsesAsCompleted: markResponsesAsCompleted,
        getStepResponse: getStepResponse,
        loadExistingResponses: loadExistingResponses,
        handleErrorProp: (errMsg, errStep) => handleError(errMsg, errStep),
        setExternalExpandedSteps: setExpandedSteps,
        currentStepIndexState: currentStepIndex,
        setCurrentStepIndexFunc: setCurrentStepIndex 
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
            setNavigationIsLoading(false);
        } else if (expandedSteps && expandedSteps.length === 0 && !navigationIsLoading && currentStep === ParticipantFlowStep.LOADING_SESSION && researchId && !isResearchFlowError) {
            setCurrentStep(ParticipantFlowStep.WELCOME); 
            setNavigationIsLoading(false);
        }
    }, [
        expandedSteps, navigationIsLoading, currentStep, maxVisitedIndexFromStore, researchId, 
        loadExistingResponses, participantId, isResearchFlowError, setCurrentStepIndex, setCurrentStep, 
        setNavigationIsLoading
    ]);

    useEffect(() => {
        if (currentStep === ParticipantFlowStep.WELCOME) {
        }
    }, [currentStep, expandedSteps, researchFlowApiData]);

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
            if (hasStepBeenAnswered(index)) {
                completedStepIndices.add(index);
            }
        });
        for (let i = 0; i <= (maxVisitedIndexFromStore || 0); i++) {
            completedStepIndices.add(i);
        }
        return Array.from(completedStepIndices).sort((a, b) => a - b);
    }, [expandedSteps, maxVisitedIndexFromStore, hasStepBeenAnswered]);
    
    return {
        currentStep,
        token: token,
        error: navigationError,
        handleLoginSuccess,
        handleStepComplete: goToNextStep,
        handleError,
        expandedSteps,
        currentStepIndex,
        isFlowLoading: navigationIsLoading,
        navigateToStep,
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