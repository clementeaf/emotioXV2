import React from 'react';
import { useStepStore } from '../../stores/useStepStore';
import { ErrorState, LoadingState } from './CommonStates';
import { Question, StepData, StepSearchResult, TestLayoutRendererProps } from './types';
import { findStepByQuestionKey } from './utils';

function isParentStepResult(obj: StepSearchResult): obj is (Question & { parentStep: StepData }) {
  return obj !== undefined && typeof obj === 'object' && 'parentStep' in obj && !!obj.parentStep && !('demographicQuestions' in obj);
}

function isDemographicsResult(obj: StepSearchResult): obj is { demographicQuestions: Question[]; parentStep: StepData } {
  return obj !== undefined && typeof obj === 'object' && 'demographicQuestions' in obj;
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

  // Caso: pregunta de SmartVoc o Cognitive con contexto de módulo padre
  if (isParentStepResult(currentStepData)) {
    const parent: StepData = currentStepData.parentStep;
    const question: Question = currentStepData;
    return (
      <div className='flex flex-col items-center justify-center h-full'>
        <div className='mb-2 font-semibold'>Módulo: {parent.derivedType || parent.originalSk}</div>
        <div className='mb-2'>Pregunta: {question.title || question.questionKey}</div>
        <pre className='text-xs bg-gray-100 p-2 rounded'>{JSON.stringify(question, null, 2)}</pre>
      </div>
    );
  }

  // Caso: demographics
  if (isDemographicsResult(currentStepData)) {
    return (
      <div className='flex flex-col items-center justify-center h-full'>
        <div className='mb-2 font-semibold'>Preguntas demográficas</div>
        <pre className='text-xs bg-gray-100 p-2 rounded'>{JSON.stringify(currentStepData.demographicQuestions, null, 2)}</pre>
      </div>
    );
  }

  // Caso genérico
  return (
    <div className='flex flex-col items-center justify-center h-full'>
      <pre className='text-xs bg-gray-100 p-2 rounded'>{JSON.stringify(currentStepData, null, 2)}</pre>
    </div>
  );
};

export default TestLayoutRenderer;
