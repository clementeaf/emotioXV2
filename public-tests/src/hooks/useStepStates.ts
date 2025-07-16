import { useMemo } from 'react';
import { useTestStore } from '../stores/useTestStore';
import { useModuleResponsesQuery } from './useApiQueries';

export type StepState = 'active' | 'completed' | 'disabled' | 'available';

export interface StepStateInfo {
  state: StepState;
  hasResponse: boolean;
  canAccess: boolean;
  isCurrentStep: boolean;
}

export const useStepStates = (currentQuestionKey: string, steps: Array<{ questionKey: string; title: string }>) => {
  const { researchId, participantId } = useTestStore();

  const { data: moduleResponses, isLoading, error } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  // Obtener todas las responses del backend
  const backendResponses = useMemo(() => {
    if (!moduleResponses?.responses) {
      return [];
    }

    // moduleResponses.responses es directamente un array de responses
    const responses = moduleResponses.responses.filter(response => response != null);

    // Filtrar responses válidas
    const validResponses = responses.filter(response => {
      if (!response || typeof response !== 'object') {
        return false;
      }

      if (!response.questionKey) {
        return false;
      }

      return true;
    });

    return validResponses;
  }, [moduleResponses]);

  // Verificar si un step tiene respuesta en el backend
  const hasBackendResponse = (questionKey: string): boolean => {
    const hasResponse = backendResponses.some(response => {
      const matches = response.questionKey === questionKey;
      return matches;
    });

    return hasResponse;
  };

  const isStepCompleted = (questionKey: string): boolean => {
    if (questionKey === 'welcome_screen') {
      const isCompleted = currentQuestionKey !== 'welcome_screen' && currentQuestionKey !== '';
      return isCompleted;
    }

    const isCompleted = hasBackendResponse(questionKey);
    return isCompleted;
  };

  const canAccessStep = (stepIndex: number): boolean => {
    if (stepIndex === 0) return true;

    for (let i = 0; i < stepIndex; i++) {
      const previousStep = steps[i];
      if (!isStepCompleted(previousStep.questionKey)) {
        return false;
      }
    }

    return true;
  };

  // Obtener estado de un step específico
  const getStepState = (stepIndex: number): StepStateInfo => {
    const step = steps[stepIndex];
    const hasResponse = isStepCompleted(step.questionKey);
    const canAccess = canAccessStep(stepIndex);
    const isCurrentStep = step.questionKey === currentQuestionKey;

    let state: StepState;

    if (isCurrentStep) {
      state = 'active';
    } else if (hasResponse) {
      state = 'completed';
    } else if (!canAccess) {
      state = 'disabled';
    } else {
      state = 'available';
    }

    return {
      state,
      hasResponse,
      canAccess,
      isCurrentStep
    };
  };

  // Obtener el primer step que debe ser activado (si no hay responses)
  const getInitialStep = (): string => {
    if (steps.length === 0) return '';

    // Si no hay responses en el backend, activar el primer step
    if (backendResponses.length === 0) {
      return steps[0].questionKey;
    }

    // Buscar el primer step sin respuesta
    const firstUnansweredStep = steps.find(step => !hasBackendResponse(step.questionKey));
    const initialStep = firstUnansweredStep?.questionKey || steps[0].questionKey;
    return initialStep;
  };

  const determineCurrentState = useMemo(() => {
    if (backendResponses.length === 0) {

      return {
        lastCompletedStep: null,
        nextStep: 'welcome_screen',
        completedSteps: []
      };
    }

    const completedQuestionKeys = backendResponses.map(response => response.questionKey);

    const stepOrder = ['welcome_screen', 'demographics', 'smartvoc_csat', 'thank_you_screen'];
    let lastCompletedStep = null;
    let nextStep = 'welcome_screen';

    for (let i = 0; i < stepOrder.length; i++) {
      const stepKey = stepOrder[i];
      if (completedQuestionKeys.includes(stepKey)) {
        lastCompletedStep = stepKey;

        if (i + 1 < stepOrder.length) {
          nextStep = stepOrder[i + 1];
        } else {
          nextStep = stepKey;
        }
      } else {
        nextStep = stepKey;
        break;
      }
    }

    if (!lastCompletedStep && completedQuestionKeys.length > 0) {
      lastCompletedStep = completedQuestionKeys[completedQuestionKeys.length - 1];

      const lastCompletedIndex = stepOrder.indexOf(lastCompletedStep);
      if (lastCompletedIndex !== -1 && lastCompletedIndex + 1 < stepOrder.length) {
        nextStep = stepOrder[lastCompletedIndex + 1];
      }
    }

    const result = {
      lastCompletedStep,
      nextStep,
      completedSteps: completedQuestionKeys
    };

    return result;
  }, [backendResponses]);

  return {
    getStepState,
    hasBackendResponse,
    canAccessStep,
    getInitialStep,
    backendResponses,
    totalResponses: backendResponses.length,
    currentState: determineCurrentState,
    lastCompletedStep: determineCurrentState.lastCompletedStep,
    nextStep: determineCurrentState.nextStep,
    completedSteps: determineCurrentState.completedSteps
  };
};
