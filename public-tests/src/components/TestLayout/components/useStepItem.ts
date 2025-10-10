import { useCallback } from 'react';
import { UseStepItemProps } from './StepItemTypes';
import { getStepConfig } from './StepItemConstants';

/**
 * Hook para manejar la lógica del StepItem
 */
export const useStepItem = ({
  stepState,
  canAccess,
  isDisabled,
  onClick
}: UseStepItemProps) => {
  // Determinar si el step puede ser clickeado
  const canClick = canAccess && !isDisabled;

  // Obtener configuración del step
  const stepConfig = getStepConfig(stepState);

  // Manejar click con validación
  const handleClick = useCallback(() => {
    if (canClick) {
      onClick();
    }
  }, [canClick, onClick]);

  return {
    canClick,
    stepConfig,
    handleClick
  };
};
