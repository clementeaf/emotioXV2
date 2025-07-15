/**
 * 🧪 STORE SIMPLIFICADO PARA PASOS
 *
 * Este store maneja solo el estado del paso actual,
 * usando el store principal useTestStore.
 */

import { useTestStore } from './useTestStore';

// Hook que usa el store principal
export const useStepStore = () => {
  const {
    currentStepIndex,
    steps,
    setCurrentStep,
    getCurrentStep,
  } = useTestStore();

  const currentStep = getCurrentStep();
  const currentStepKey = currentStep?.id || '';

  const setStep = (stepKey: string) => {
    const stepIndex = steps.findIndex(step => step.id === stepKey);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
    }
  };

  return {
    currentStepKey,
    setStep,
    currentStep,
    currentStepIndex,
    steps,
  };
};
