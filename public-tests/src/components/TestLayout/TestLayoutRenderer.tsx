import React from 'react';
import { useStepStore } from '../../stores/useStepStore';
import { ErrorState, LoadingState, NoStepData, NoStepSelected } from './CommonStates';
import { DemographicForm } from './DemographicForm';
import { QuestionComponent, ScreenComponent, UnknownStepComponent } from './StepsComponents';
import { DemographicQuestion, Question, ScreenStep, TestLayoutRendererProps } from './types';
import { findStepByQuestionKey, getStepType } from './utils';

const TestLayoutRenderer: React.FC<TestLayoutRendererProps> = ({ data, isLoading, error }) => {

  const currentStepKey = useStepStore(state => state.currentStepKey);
  const hasPreviousResponse = false;

  if (isLoading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState />;
  }

  const currentStepData = findStepByQuestionKey(data, currentStepKey);

  if (!currentStepKey) {
    return <NoStepSelected />;
  }
  if (!currentStepData) {
    return <NoStepData />;
  }

  const stepType = getStepType(currentStepData);
  let renderedForm: React.ReactNode = null;

  switch (stepType) {
    case 'demographics': {
      const { demographicQuestions } = currentStepData as { demographicQuestions: DemographicQuestion[] };
      renderedForm = <DemographicForm questions={demographicQuestions} />;
      break;
    }
    case 'screen': {
      renderedForm = <ScreenComponent data={currentStepData as ScreenStep} />;
      break;
    }
    case 'question': {
      renderedForm = <QuestionComponent question={currentStepData as Question} currentStepKey={currentStepKey} />;
      break;
    }
    default:
      renderedForm = <UnknownStepComponent data={currentStepData} />;
  }

  const showGlobalButton = stepType !== 'screen';

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full">
      {renderedForm}
      {showGlobalButton && (
        <button
          type="button"
          className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition w-full max-w-lg"
          onClick={() => {
            // Aquí puedes disparar el submit del formulario activo
          }}
        >
          {hasPreviousResponse ? 'Actualizar y continuar' : 'Guardar y continuar'}
        </button>
      )}
    </div>
  );
};

export default TestLayoutRenderer;
