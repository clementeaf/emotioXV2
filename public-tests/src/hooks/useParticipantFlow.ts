/**
 * 🧪 HOOK SIMPLIFICADO PARA FLUJO DE PARTICIPANTE
 *
 * Este hook maneja solo la lógica de UI del flujo de participante,
 * sin llamadas al backend. Usa el store simplificado useTestStore.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTestStore } from '../stores/useTestStore';

// Tipos simplificados
export interface FlowStep {
  id: string;
  type: string;
  name: string;
  completed: boolean;
  current: boolean;
}

export interface FlowState {
  currentStep: FlowStep | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  totalSteps: number;
  completedSteps: number;
}

export const useParticipantFlow = (researchId: string | undefined) => {
  const {
    // Estado del store
    currentStepIndex,
    steps,
    responses,
    isSessionActive,

    // Métodos del store
    setCurrentStep,
    completeStep,
    saveResponse,
    getResponse,
    hasResponse,
    startSession,
    getProgress,
    getCurrentStep,
    getCompletedSteps,
    clearResponses,
  } = useTestStore();

  // Estado local del hook
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar sesión si no está activa
  useEffect(() => {
    if (!isSessionActive && researchId) {
      startSession();
    }
  }, [researchId, isSessionActive, startSession]);

  // Crear pasos de ejemplo si no existen
  useEffect(() => {
    if (steps.length === 0 && researchId) {
      const exampleSteps: FlowStep[] = [
        { id: 'welcome', type: 'screen', name: 'Bienvenido', completed: false, current: true },
        { id: 'demographics', type: 'form', name: 'Preguntas demográficas', completed: false, current: false },
        { id: 'smartvoc', type: 'form', name: 'SmartVOC', completed: false, current: false },
        { id: 'thankyou', type: 'screen', name: 'Gracias', completed: false, current: false },
      ];

      useTestStore.setState({
        steps: exampleSteps,
        totalSteps: exampleSteps.length,
        currentStepIndex: 0,
      });
    }
  }, [steps.length, researchId]);

  // Navegar al siguiente paso
  const goToNextStep = useCallback(() => {
    const currentStep = getCurrentStep();
    if (currentStep) {
      completeStep(currentStep.id);
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(nextIndex);
    }
  }, [currentStepIndex, steps.length, getCurrentStep, completeStep, setCurrentStep]);

  // Navegar al paso anterior
  const goToPreviousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(prevIndex);
    }
  }, [currentStepIndex, setCurrentStep]);

  // Guardar respuesta del paso actual
  const saveCurrentStepResponse = useCallback((response: unknown) => {
    const currentStep = getCurrentStep();
    if (currentStep) {
      saveResponse(
        currentStep.id,
        response,
        currentStep.type,
        currentStep.name
      );
    }
  }, [getCurrentStep, saveResponse]);

  // Obtener respuesta del paso actual
  const getCurrentStepResponse = useCallback(() => {
    const currentStep = getCurrentStep();
    if (currentStep) {
      return getResponse(currentStep.id);
    }
    return null;
  }, [getCurrentStep, getResponse]);

  // Verificar si el paso actual tiene respuesta
  const hasCurrentStepResponse = useCallback(() => {
    const currentStep = getCurrentStep();
    if (currentStep) {
      return hasResponse(currentStep.id);
    }
    return false;
  }, [getCurrentStep, hasResponse]);

  // Reiniciar el flujo
  const resetFlow = useCallback(() => {
    clearResponses();
    useTestStore.setState({
      currentStepIndex: 0,
      completedSteps: 0,
      steps: steps.map(step => ({ ...step, completed: false, current: step.id === 'welcome' })),
    });
  }, [clearResponses, steps]);

  // Estado del flujo
  const flowState: FlowState = {
    currentStep: getCurrentStep(),
    isLoading,
    error,
    progress: getProgress(),
    totalSteps: steps.length,
    completedSteps: getCompletedSteps().length,
  };

  return {
    // Estado
    ...flowState,

    // Pasos
    steps,
    currentStepIndex,

    // Navegación
    goToNextStep,
    goToPreviousStep,

    // Respuestas
    saveCurrentStepResponse,
    getCurrentStepResponse,
    hasCurrentStepResponse,

    // Control
    resetFlow,
    clearResponses,

    // Utilidades
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === steps.length - 1,
    canGoNext: currentStepIndex < steps.length - 1,
    canGoPrevious: currentStepIndex > 0,
  };
};
