import React from 'react';
import { useStepStore } from '../../stores/useStepStore';
import { ErrorState, LoadingState } from './CommonStates';
import { DemographicForm } from './DemographicForm';
import { ParentStepComponent, QuestionComponent, ScreenComponent, UnknownStepComponent } from './StepsComponents';
import { DemographicQuestion, Question, ScreenStep, StepData, StepSearchResult, TestLayoutRendererProps } from './types';
import { findStepByQuestionKey } from './utils';

function getStepType(obj: StepSearchResult): 'parent' | 'demographics' | 'screen' | 'question' | 'unknown' {
  if (obj && typeof obj === 'object') {
    if ('demographicQuestions' in obj) return 'demographics';
    if ('parentStep' in obj) return 'parent';
    if ('questionKey' in obj && (obj.questionKey === 'welcome_screen' || obj.questionKey === 'thank_you_screen')) return 'screen';
    if ('questionKey' in obj) return 'question';
  }
  return 'unknown';
}

const TestLayoutRenderer: React.FC<TestLayoutRendererProps> = ({ data, isLoading, error }) => {
  const currentStepKey = useStepStore(state => state.currentStepKey);

  if (isLoading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState />;
  }

  const currentStepData = findStepByQuestionKey(data, currentStepKey);

  if (!currentStepKey) {
    return <div className='flex flex-col items-center justify-center h-full'>No step selected</div>;
  }
  if (!currentStepData) {
    return <div className='flex flex-col items-center justify-center h-full'>No se encontró información para este step</div>;
  }

  switch (getStepType(currentStepData)) {
    case 'parent': {
      const { parentStep, ...question } = currentStepData as Question & { parentStep: StepData };
      return <ParentStepComponent parent={parentStep} question={question} />;
    }
    case 'demographics': {
      const { demographicQuestions } = currentStepData as { demographicQuestions: DemographicQuestion[] };
      return <DemographicForm questions={demographicQuestions} />;
    }
    case 'screen': {
      return <ScreenComponent data={currentStepData as ScreenStep} />;
    }
    case 'question': {
      return <QuestionComponent question={currentStepData as Question} />;
    }
    default:
      return <UnknownStepComponent data={currentStepData} />;
  }
};

export default TestLayoutRenderer;
