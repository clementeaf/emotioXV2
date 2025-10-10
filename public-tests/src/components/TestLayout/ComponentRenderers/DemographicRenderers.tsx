import React from 'react';
import { useStepStore } from '../../../stores/useStepStore';
import { DemographicForm } from '../DemographicForm';

interface DemographicRendererArgs {
  contentConfiguration?: Record<string, unknown>;
  currentQuestionKey: string;
}

export const demographicRenderers = {
  demographics: ({ contentConfiguration, currentQuestionKey }: DemographicRendererArgs) => {
    const handleDemographicSubmit = (data: Record<string, string>) => {
      console.log('[DemographicRenderers] 🎯 Demographics enviados:', data);
      const { goToNextStep } = useStepStore.getState();
      goToNextStep();
    };

    return (
      <DemographicForm
        demographicQuestions={contentConfiguration?.demographicQuestions as Record<string, unknown> || {}}
        currentQuestionKey={currentQuestionKey}
        onSubmit={handleDemographicSubmit}
      />
    );
  }
};
