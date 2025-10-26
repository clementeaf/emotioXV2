import React from 'react';
import { StepItemPropsWithState } from './StepItemTypes';
// import { useStepItem } from './useStepItem'; // Removed
import { StepIcon } from './StepIcon';

const StepItem: React.FC<StepItemPropsWithState> = ({
  step,
  onClick,
  isDisabled,
  stepState,
  canAccess
}) => {

  // TODO: Implementar useStepItem o usar alternativa
  const stepConfig = {
    // Temporal: configuración básica hasta implementar hook
    isCompleted: stepState === 'completed',
    isCurrent: stepState === 'active',
    isDisabled: isDisabled || false
  };
  
  const handleClick = () => {
    // Temporal: implementación básica
    if (onClick) {
      onClick();
    }
  };

  return (
    <li
      className={`step-item ${stepConfig.isCompleted ? 'completed' : ''} ${stepConfig.isCurrent ? 'current' : ''} ${stepConfig.isDisabled ? 'disabled' : ''}`}
      onClick={handleClick}
    >
      <span className="flex items-center gap-2">
        <StepIcon stepState={stepState} />
        {step.title}
      </span>
    </li>
  );
};

export default StepItem;
