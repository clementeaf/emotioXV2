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

  const { data: moduleResponses } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  // Obtener todas las responses del backend
  const backendResponses = useMemo(() => {
    if (!moduleResponses?.responses) return [];

    // Extraer todas las responses de todos los ModuleResponse
    return moduleResponses.responses.flatMap(mr => mr.responses);
  }, [moduleResponses]);

  // Verificar si un step tiene respuesta en el backend
  const hasBackendResponse = (questionKey: string): boolean => {
    return backendResponses.some(response => response.questionKey === questionKey);
  };

  // Verificar si un step puede ser accedido (todos los anteriores completados)
  const canAccessStep = (stepIndex: number): boolean => {
    if (stepIndex === 0) return true;

    for (let i = 0; i < stepIndex; i++) {
      const previousStep = steps[i];
      if (!hasBackendResponse(previousStep.questionKey)) {
        return false;
      }
    }
    return true;
  };

  // Obtener estado de un step específico
  const getStepState = (stepIndex: number): StepStateInfo => {
    const step = steps[stepIndex];
    const hasResponse = hasBackendResponse(step.questionKey);
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
    return firstUnansweredStep?.questionKey || steps[0].questionKey;
  };

  return {
    getStepState,
    hasBackendResponse,
    canAccessStep,
    getInitialStep,
    backendResponses,
    totalResponses: backendResponses.length
  };
};
