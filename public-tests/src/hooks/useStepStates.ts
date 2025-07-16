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

    // Extraer todas las responses de todos los ModuleResponse
    const responses = moduleResponses.responses.flatMap(mr => mr.responses);

    // Filtrar responses válidas
    const validResponses = responses.filter(response => {
      if (!response || typeof response !== 'object') {
        console.warn('🔍 DEBUG useStepStates - Response inválida filtrada:', response);
        return false;
      }

      if (!response.questionKey) {
        console.warn('🔍 DEBUG useStepStates - Response sin questionKey filtrada:', response);
        return false;
      }

      return true;
    });

    console.log('🔍 DEBUG useStepStates - Responses válidas:', validResponses);
    console.log('🔍 DEBUG useStepStates - Cantidad de responses válidas:', validResponses.length);

    // Log detallado de cada response válida
    validResponses.forEach((response, index) => {
      console.log(`🔍 DEBUG useStepStates - Response válida ${index}:`, {
        questionKey: response.questionKey,
        response: response.response,
        timestamp: response.timestamp
      });
    });

    return validResponses;
  }, [moduleResponses]);

  // Verificar si un step tiene respuesta en el backend
  const hasBackendResponse = (questionKey: string): boolean => {
    const hasResponse = backendResponses.some(response => {
      // Validar que response existe y tiene questionKey
      if (!response || typeof response !== 'object') {
        console.warn('🔍 DEBUG hasBackendResponse - Response inválida:', response);
        return false;
      }

      if (!response.questionKey) {
        console.warn('🔍 DEBUG hasBackendResponse - Response sin questionKey:', response);
        return false;
      }

      return response.questionKey === questionKey;
    });

    console.log(`🔍 DEBUG hasBackendResponse para "${questionKey}":`, hasResponse);
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

  return {
    getStepState,
    hasBackendResponse,
    canAccessStep,
    getInitialStep,
    backendResponses,
    totalResponses: backendResponses.length
  };
};
