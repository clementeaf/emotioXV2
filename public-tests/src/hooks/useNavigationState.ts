import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { UseNavigationStateProps, UseNavigationStateReturn } from './types';

export const useNavigationState = ({
  onContinue,
  buttonText = 'Continuar'
}: UseNavigationStateProps): UseNavigationStateReturn => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleContinue = async () => {
    setIsNavigating(true);
    setIsSuccess(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Pasando al siguiente paso');
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        if (onContinue) onContinue();
      }, 1500);

    } catch (error) {
      console.error('[useNavigationState] ❌ Error:', error);
      toast.error('Error al continuar');
    } finally {
      setIsNavigating(false);
    }
  };

  const getButtonText = () => {
    if (isNavigating) return 'Continuando...';
    if (isSuccess) return 'Pasando al siguiente paso...';
    return buttonText;
  };

  return {
    isNavigating,
    isSuccess,
    buttonText: getButtonText(),
    isButtonDisabled: isNavigating || isSuccess,
    handleContinue
  };
};
