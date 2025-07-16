import React from 'react';
import { useStepStates } from '../../hooks/useStepStates';
import { useStepStore } from '../../stores/useStepStore';
import StepItem from './StepItem';
import { CustomStepsListProps } from './types';

const StepsList: React.FC<CustomStepsListProps> = ({ steps, currentStepKey, isStepEnabled }) => {
  const { setCurrentQuestionKey } = useStepStore();
  // Usar el nuevo hook para estados basados en module-responses
  const { getStepState } = useStepStates(currentStepKey, steps);

  const handleStepClick = (questionKey: string) => {
    setCurrentQuestionKey(questionKey);
  };

  return (
    <ul className="space-y-1 max-h-[550px] overflow-y-auto">
      {steps.map((step, idx) => {
        const stepStateInfo = getStepState(idx);
        return (
          <StepItem
            key={idx}
            step={step}
            isActive={step.questionKey === currentStepKey}
            isDisabled={isStepEnabled ? !isStepEnabled(idx) : false}
            onClick={() => handleStepClick(step.questionKey)}
            stepState={stepStateInfo.state}
            canAccess={stepStateInfo.canAccess}
          />
        );
      })}
    </ul>
  );
};

export default StepsList;
