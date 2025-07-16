/**
 * 🧪 HOOK SIMPLIFICADO PARA NAVEGACIÓN DE FLUJO
 *
 * Este hook maneja solo la navegación entre pasos del test,
 * sin lógica de backend. Usa el store simplificado useTestStore.
 */

import { useCallback, useState } from 'react';
import { useStepStore } from '../stores/useStepStore';
import { useTestStore } from '../stores/useTestStore';

// Tipos simplificados
export interface NavigationState {
  currentStepIndex: number;
  totalSteps: number;
  completedSteps: number;
  progress: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export const useFlowNavigationAndState = () => {
  const {
    // Estado del store
    currentStepIndex,
    steps,
    totalSteps,
    completedSteps,

    // Métodos del store
    setCurrentStep,
    completeStep,
    getProgress,
  } = useTestStore();

  const { setCurrentQuestionKey } = useStepStore();
  const [error, setError] = useState<string | null>(null);

    // Navegar al siguiente paso
  const goToNextStep = useCallback(() => {
    console.log('🔍 DEBUG goToNextStep:', {
      currentStepIndex,
      totalSteps: steps.length,
      currentStep: steps[currentStepIndex],
      nextStepIndex: currentStepIndex + 1,
      nextStep: steps[currentStepIndex + 1]
    });

    if (currentStepIndex < steps.length - 1) {
      const currentStep = steps[currentStepIndex];
      if (currentStep) {
        console.log('✅ Completando step actual:', currentStep.id);
        completeStep(currentStep.id);
      }

      const nextStepIndex = currentStepIndex + 1;
      setCurrentStep(nextStepIndex);

      // Sincronizar con el sidebar usando el id del step (questionKey)
      if (steps[nextStepIndex]) {
        console.log('🔄 Navegando a siguiente step:', steps[nextStepIndex].id);
        setCurrentQuestionKey(steps[nextStepIndex].id);
      }

      setError(null);
    } else {
      console.log('⚠️ No hay siguiente step disponible');
    }
  }, [currentStepIndex, steps, completeStep, setCurrentStep, setCurrentQuestionKey]);

  // Navegar al paso anterior
  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevStepIndex = currentStepIndex - 1;
      setCurrentStep(prevStepIndex);

      // Sincronizar con el sidebar usando el nombre del step
      if (steps[prevStepIndex]) {
        setCurrentQuestionKey(steps[prevStepIndex].name);
      }

      setError(null);
    }
  }, [currentStepIndex, steps, setCurrentStep, setCurrentQuestionKey]);

  // Navegar a un paso específico
  const navigateToStep = useCallback((targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= steps.length) {
      setError('Paso no válido');
      return;
    }

    if (targetIndex === currentStepIndex) {
      return; // Ya estamos en ese paso
    }

    // Solo permitir navegación hacia atrás o al siguiente paso
    const maxVisited = Math.max(0, currentStepIndex);
    const isForwardNavigation = targetIndex > maxVisited + 1;

    if (isForwardNavigation) {
      setError('No puedes saltar hacia adelante');
      return;
    }

    setCurrentStep(targetIndex);

    // Sincronizar con el sidebar usando el nombre del step
    if (steps[targetIndex]) {
      setCurrentQuestionKey(steps[targetIndex].name);
    }

    setError(null);
  }, [currentStepIndex, steps, setCurrentStep, setCurrentQuestionKey]);

  // Estado de navegación
  const navigationState: NavigationState = {
    currentStepIndex,
    totalSteps,
    completedSteps,
    progress: getProgress(),
    canGoNext: currentStepIndex < steps.length - 1,
    canGoPrevious: currentStepIndex > 0,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === steps.length - 1,
  };

  return {
    // Estado
    ...navigationState,

    // Navegación
    goToNextStep,
    goToPreviousStep,
    navigateToStep,

    // Control de errores
    error,
    setError,

    // Utilidades
    getCurrentStep: () => steps[currentStepIndex] || null,
    getStep: (index: number) => steps[index] || null,
    getStepCount: () => steps.length,
  };
};
