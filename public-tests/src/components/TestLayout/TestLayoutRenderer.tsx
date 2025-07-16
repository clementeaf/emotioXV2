import React from 'react';
import { useAvailableFormsQuery } from '../../hooks/useApiQueries';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { ButtonSteps } from './ButtonSteps';
import { DemographicForm } from './DemographicForm';
import { QuestionComponent, ScreenComponent, UnknownStepComponent } from './StepsComponents';
import { DemographicQuestionData } from './types';
import { getCurrentStepData, getQuestionType } from './utils';

interface RendererArgs {
  contentConfiguration: Record<string, unknown>;
  currentQuestionKey: string;
}

const RENDERERS: Record<string, (args: RendererArgs) => React.ReactNode> = {
  screen: ({ contentConfiguration, currentQuestionKey }) => (
    <ScreenComponent
      data={{
        title: String(contentConfiguration?.title || 'Bienvenido'),
        description: String(contentConfiguration?.description || 'Gracias por participar en este estudio'),
        message: String(contentConfiguration?.message || 'Estás a punto de comenzar una experiencia única'),
        startButtonText: String(contentConfiguration?.startButtonText || 'Comenzar'),
        questionKey: currentQuestionKey
      }}
    />
  ),
  demographics: ({ contentConfiguration }) => {
    const demographicQuestions = contentConfiguration?.demographicQuestions || {};
    if (Object.keys(demographicQuestions).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold mb-4">Preguntas Demográficas</h2>
          <p className="text-gray-600">No hay preguntas demográficas configuradas.</p>
        </div>
      );
    }
    return (
      <DemographicForm
        demographicQuestions={demographicQuestions as Record<string, DemographicQuestionData>}
      />
    );
  },
  smartvoc: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Pregunta SmartVOC'),
        questionKey: currentQuestionKey,
        type: currentQuestionKey,
        config: contentConfiguration,
        choices: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices : [],
        description: String(contentConfiguration?.description || '')
      }}
      currentStepKey={currentQuestionKey}
    />
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

  // Debug logs para verificar datos recibidos
  console.log('🔍 DEBUG TestLayoutRenderer:', {
    currentQuestionKey,
    questionType,
    formsData: formsData ? {
      steps: formsData.steps,
      stepsConfigurationCount: formsData.stepsConfiguration?.length || 0
    } : null,
    currentStepData,
    contentConfiguration
  });

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

  // Obtener los datos del formulario del store
  const formData = getFormData(currentQuestionKey);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {renderedForm}
      </div>
      {/* No mostrar ButtonSteps para welcome_screen ya que ScreenComponent tiene su propio botón */}
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
