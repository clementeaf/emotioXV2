import React from 'react';
import { StepState, StepStateInfo } from '../../hooks/useStepStates';
import { useStepStore } from '../../stores/useStepStore';
import StepItem from './StepItem';
import { CustomStepsListProps } from './types';

const StepsList: React.FC<CustomStepsListProps> = ({ steps, currentStepKey, isStepEnabled }) => {
  const { setCurrentQuestionKey, getSteps } = useStepStore();

  // Obtener estados del store
  const storeSteps = getSteps();

  const handleStepClick = (questionKey: string) => {
    setCurrentQuestionKey(questionKey);
  };

  // Función para obtener el estado de un step basado en el store
  const getStepStateFromStore = (stepIndex: number): StepStateInfo => {
    const step = steps[stepIndex];
    if (!step) return {
      state: 'disabled' as StepState,
      canAccess: false,
      hasResponse: false,
      isCurrentStep: false
    };

    const storeStep = storeSteps.find(s => s.questionKey === step.questionKey);

    if (!storeStep) return {
      state: 'disabled' as StepState,
      canAccess: false,
      hasResponse: false,
      isCurrentStep: false
    };

    const isCurrentStep = step.questionKey === currentStepKey;
    const hasResponse = storeStep.completed;

    if (storeStep.current) {
      return {
        state: 'active' as StepState,
        canAccess: true,
        hasResponse,
        isCurrentStep
      };
    } else if (storeStep.completed) {
      return {
        state: 'completed' as StepState,
        canAccess: true,
        hasResponse,
        isCurrentStep
      };
    } else {
      return {
        state: 'disabled' as StepState,
        canAccess: false,
        hasResponse,
        isCurrentStep
      };
    }
  };

  return (
    <ul className="space-y-1 max-h-[550px] overflow-y-auto">
      {steps.map((step, idx) => {
        const stepStateInfo = getStepStateFromStore(idx);
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
