import React from 'react';
import { useStepStore } from '../../stores/useStepStore';
import StepItem from './StepItem';
import { CustomStepsListProps } from './types';

const StepsList: React.FC<CustomStepsListProps> = ({ steps, currentStepKey, isStepEnabled }) => {
  const { setCurrentQuestionKey } = useStepStore();

  const handleStepClick = (questionKey: string) => {
    setCurrentQuestionKey(questionKey);
  };

  return (
    <ul className="space-y-1 max-h-[550px] overflow-y-auto">
      {steps.map((step, idx) => (
        <StepItem
          key={idx}
          step={step}
          isActive={step.questionKey === currentStepKey}
          isDisabled={isStepEnabled ? !isStepEnabled(idx) : false}
          onClick={() => handleStepClick(step.questionKey)}
        />
      ))}
    </ul>
  );
};

export default StepsList;
