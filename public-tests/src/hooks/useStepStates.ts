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
    console.log('🔍 DEBUG useStepStates - moduleResponses completo:', moduleResponses);
    console.log('🔍 DEBUG useStepStates - moduleResponses.responses:', moduleResponses?.responses);

    if (!moduleResponses?.responses) {
      console.log('🔍 DEBUG useStepStates - No hay responses en moduleResponses');
      return [];
    }

    // moduleResponses.responses es directamente un array de responses
    const responses = moduleResponses.responses.filter(response => response != null);

    console.log('🔍 DEBUG useStepStates - Responses extraídas:', responses);
    console.log('🔍 DEBUG useStepStates - Cantidad de responses extraídas:', responses.length);

    // Filtrar responses válidas
    const validResponses = responses.filter(response => {
      console.log('🔍 DEBUG useStepStates - Procesando response:', response);
      if (!response || typeof response !== 'object') {
        console.log('🔍 DEBUG useStepStates - Response inválida (null/undefined):', response);
        return false;
      }

      if (!response.questionKey) {
        console.log('🔍 DEBUG useStepStates - Response sin questionKey:', response);
        return false;
      }

      console.log('🔍 DEBUG useStepStates - Response válida encontrada:', response.questionKey);
      return true;
    });

    console.log('🔍 DEBUG useStepStates - Responses válidas finales:', validResponses);
    console.log('🔍 DEBUG useStepStates - Cantidad de responses válidas:', validResponses.length);

    return validResponses;
  }, [moduleResponses]);

  // Verificar si un step tiene respuesta en el backend
  const hasBackendResponse = (questionKey: string): boolean => {
    console.log(`🔍 DEBUG hasBackendResponse - Verificando "${questionKey}"`);
    console.log(`🔍 DEBUG hasBackendResponse - backendResponses disponibles:`, backendResponses.map(r => r.questionKey));

    const hasResponse = backendResponses.some(response => {
      const matches = response.questionKey === questionKey;
      console.log(`🔍 DEBUG hasBackendResponse - Comparando "${response.questionKey}" === "${questionKey}": ${matches}`);
      return matches;
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

  // Determinar el estado actual basado en las respuestas existentes
  const determineCurrentState = useMemo(() => {
    console.log('🔍 DEBUG determineCurrentState - Analizando respuestas existentes');
    console.log('🔍 DEBUG determineCurrentState - backendResponses:', backendResponses);

    if (backendResponses.length === 0) {
      console.log('🔍 DEBUG determineCurrentState - No hay respuestas, empezar desde welcome_screen');
      return {
        lastCompletedStep: null,
        nextStep: 'welcome_screen',
        completedSteps: []
      };
    }

    const completedQuestionKeys = backendResponses.map(response => response.questionKey);
    console.log('🔍 DEBUG determineCurrentState - QuestionKeys completados:', completedQuestionKeys);

    // Determinar cuál es el último step completado y el siguiente
    const stepOrder = ['welcome_screen', 'demographics', 'smartvoc_csat', 'thank_you_screen'];
    let lastCompletedStep = null;
    let nextStep = 'welcome_screen';

    // Buscar el último step completado en orden
    for (let i = 0; i < stepOrder.length; i++) {
      const stepKey = stepOrder[i];
      if (completedQuestionKeys.includes(stepKey)) {
        lastCompletedStep = stepKey;
        console.log(`🔍 DEBUG determineCurrentState - Encontrado step completado: ${stepKey}`);

        // El siguiente step será el que sigue en el orden
        if (i + 1 < stepOrder.length) {
          nextStep = stepOrder[i + 1];
          console.log(`🔍 DEBUG determineCurrentState - Siguiente step será: ${nextStep}`);
        } else {
          // Si es el último step, no hay siguiente
          nextStep = stepKey;
          console.log(`🔍 DEBUG determineCurrentState - Es el último step, no hay siguiente`);
        }
      } else {
        // Si encontramos un step no completado, ese será el siguiente
        nextStep = stepKey;
        console.log(`🔍 DEBUG determineCurrentState - Encontrado step no completado: ${stepKey}, será el siguiente`);
        break;
      }
    }

    // Si no encontramos ningún step completado en el orden, buscar el último response real
    if (!lastCompletedStep && completedQuestionKeys.length > 0) {
      lastCompletedStep = completedQuestionKeys[completedQuestionKeys.length - 1];
      console.log(`🔍 DEBUG determineCurrentState - Usando último response real como lastCompletedStep: ${lastCompletedStep}`);

      // Encontrar el siguiente step en el orden
      const lastCompletedIndex = stepOrder.indexOf(lastCompletedStep);
      if (lastCompletedIndex !== -1 && lastCompletedIndex + 1 < stepOrder.length) {
        nextStep = stepOrder[lastCompletedIndex + 1];
        console.log(`🔍 DEBUG determineCurrentState - Siguiente step basado en último response: ${nextStep}`);
      }
    }

    const result = {
      lastCompletedStep,
      nextStep,
      completedSteps: completedQuestionKeys
    };

    console.log('🔍 DEBUG determineCurrentState - Resultado final:', result);
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
