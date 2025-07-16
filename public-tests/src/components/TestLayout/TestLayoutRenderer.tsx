import React from 'react';
import { useAvailableFormsQuery } from '../../hooks/useApiQueries';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { ButtonSteps } from './ButtonSteps';
import { DemographicForm } from './DemographicForm';
import { QuestionComponent, ScreenComponent, UnknownStepComponent } from './StepsComponents';
import { DemographicQuestionData, RendererArgs } from './types';
import { getCurrentStepData, getQuestionType } from './utils';

const RENDERERS: Record<string, (args: RendererArgs) => React.ReactNode> = {
  welcome_screen: ({ contentConfiguration, currentQuestionKey }) => (
    <ScreenComponent
      data={{
        questionKey: currentQuestionKey,
        contentConfiguration,
        message: 'Bienvenido'
      }}
    />
  ),

  demographics: ({ contentConfiguration, currentQuestionKey }) => {
    const demographicQuestions = contentConfiguration?.demographicQuestions || {};
    return (
      <DemographicForm
        demographicQuestions={demographicQuestions as Record<string, DemographicQuestionData>}
      />
    );
  },

  smartvoc: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Pregunta CSAT'),
        questionKey: currentQuestionKey,
        type: currentQuestionKey,
        config: contentConfiguration,
        choices: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices : [],
        description: String(contentConfiguration?.description || '')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),

  thank_you_screen: ({ contentConfiguration, currentQuestionKey }) => (
    <div className='flex flex-col items-center justify-center h-full w-full'>
      <h2 className='text-2xl font-bold mb-2'>
        {String(contentConfiguration?.title || 'Gracias por participar')}
      </h2>
      <p className='text-center text-gray-600'>
        {String(contentConfiguration?.message || 'Agradecemos tus respuestas')}
      </p>
    </div>
  ),

  cognitive: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Pregunta Cognitive Task'),
        questionKey: currentQuestionKey,
        type: currentQuestionKey,
        config: contentConfiguration,
        choices: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices : [],
        description: String(contentConfiguration?.description || '')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),
};

const TestLayoutRenderer: React.FC = () => {
  const currentQuestionKey = useStepStore(state => state.currentQuestionKey);
  console.log('[TestLayoutRenderer] currentQuestionKey (store):', currentQuestionKey);
  const { researchId } = useTestStore();
  const { getFormData } = useFormDataStore();
  const { data: formsData, isLoading, error } = useAvailableFormsQuery(researchId || '');

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!currentQuestionKey) {
    return <div>No se encontró información para este step</div>;
  }

  const currentStepData = getCurrentStepData(formsData, currentQuestionKey);

  if (!currentStepData) {
    return <div>No se encontró información para este step</div>;
  }

  const { contentConfiguration } = currentStepData;
  const questionType = getQuestionType(currentQuestionKey);

  const renderedForm =
    RENDERERS[questionType]?.({ contentConfiguration, currentQuestionKey }) ||
    <UnknownStepComponent
      data={{
        questionKey: currentQuestionKey,
        contentConfiguration,
        message: `No se encontró un componente específico para: ${currentQuestionKey}`
      }}
    />;

  const isWelcomeScreen = currentQuestionKey === 'welcome_screen';

  const formData = getFormData(currentQuestionKey);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {renderedForm}
      </div>
      {!isWelcomeScreen && (
        <ButtonSteps
          currentQuestionKey={currentQuestionKey}
          formData={formData}
          isWelcomeScreen={isWelcomeScreen}
        />
      )}
    </div>
  );
};

export default TestLayoutRenderer;
