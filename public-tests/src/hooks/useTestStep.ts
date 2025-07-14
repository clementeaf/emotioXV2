import { useCallback, useState } from 'react';

export const useTestStep = () => {
  const [currentStepKey, setCurrentStepKey] = useState<string>('');

  const setStep = useCallback((questionKey: string) => {
    setCurrentStepKey(questionKey);
  }, []);

  const getCurrentStep = useCallback(() => {
    return currentStepKey;
  }, [currentStepKey]);

  return {
    currentStepKey,
    setStep,
    getCurrentStep
  };
};
