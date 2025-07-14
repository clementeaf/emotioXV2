import React from 'react';
import StepItem from './StepItem';
import { StepsListProps } from './types';

const StepsList: React.FC<StepsListProps> = ({ steps, currentStepKey, onStepClick }) => (
  <ul className="space-y-1 max-h-[550px] overflow-y-auto">
    {steps.map((step, idx) => (
      <StepItem
        key={idx}
        step={step}
        isActive={step.questionKey === currentStepKey}
        onClick={() => onStepClick?.(step, idx)}
      />
    ))}
  </ul>
);

export default StepsList;
