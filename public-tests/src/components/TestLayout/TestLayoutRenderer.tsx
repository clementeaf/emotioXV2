import React, { useEffect } from 'react';
import { useAvailableFormsQuery, useModuleResponsesQuery } from '../../hooks/useApiQueries';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { ButtonSteps } from './ButtonSteps';
import { DemographicForm } from './DemographicForm';
import NavigationFlowTask from './NavigationFlowTask';
import PreferenceTestTask from './PreferenceTestTask';
import { RankingList } from './RankingList';
import { QuestionComponent, ScreenComponent, UnknownStepComponent } from './StepsComponents';
import { DemographicQuestionData, RendererArgs } from './types';
import { getCurrentStepData, getQuestionType } from './utils';

const RENDERERS: Record<string, (args: RendererArgs) => React.ReactNode> = {
  screen: ({ contentConfiguration, currentQuestionKey }) => {
    if (currentQuestionKey === 'thank_you_screen') {
      return (
        <div className='flex flex-col items-center justify-center h-full w-full'>
          <h2 className='text-2xl font-bold mb-2'>
            {String(contentConfiguration?.title || 'Gracias por participar')}
          </h2>
          <p className='text-center text-gray-600'>
            {String(contentConfiguration?.message || 'Agradecemos tus respuestas')}
          </p>
        </div>
      );
    }

    // Para welcome_screen, usar ScreenComponent con botón
    return (
      <ScreenComponent
        data={{
          questionKey: currentQuestionKey,
          contentConfiguration,
          title: String(contentConfiguration?.title || 'Bienvenido'),
          message: String(contentConfiguration?.message || 'Bienvenido'),
          startButtonText: String(contentConfiguration?.startButtonText || 'Continuar')
        }}
      />
    );
  },

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

  cognitive_navigation_flow: ({ contentConfiguration, currentQuestionKey }) => {
    const { getFormData } = useFormDataStore();
    return (
      <NavigationFlowTask
        stepConfig={{
          id: currentQuestionKey,
          type: 'cognitive_navigation_flow',
          title: String(contentConfiguration?.title || 'Flujo de Navegación'),
          description: String(contentConfiguration?.description || '¿En cuál de las siguientes pantallas encuentras el objetivo indicado?'),
          files: Array.isArray(contentConfiguration?.files) ? contentConfiguration.files : []
        }}
        formData={getFormData(currentQuestionKey)}
        currentQuestionKey={currentQuestionKey}
      />
    );
  },

  cognitive_preference_test: ({ contentConfiguration, currentQuestionKey }) => (
    <PreferenceTestTask
      stepConfig={{
        id: currentQuestionKey,
        type: 'cognitive_preference_test',
        title: String(contentConfiguration?.title || 'Test de Preferencia'),
        description: String(contentConfiguration?.description || 'Selecciona tu preferencia'),
        files: Array.isArray(contentConfiguration?.files) ? contentConfiguration.files : []
      }}
    />
  ),

  cognitive_ranking: ({ contentConfiguration, currentQuestionKey }) => (
    <div className='flex flex-col items-center justify-center h-full gap-6'>
      <h2 className='text-2xl font-bold text-gray-800'>
        {String(contentConfiguration?.title || 'Ordenar por Preferencia')}
      </h2>
      <p className='text-gray-600 text-center max-w-2xl'>
        {String(contentConfiguration?.description || 'Arrastra los elementos para ordenarlos según tu preferencia')}
      </p>
      <div className='w-full max-w-2xl'>
        <RankingList
          items={Array.isArray(contentConfiguration?.items) ? contentConfiguration.items : []}
          onMoveUp={() => {}}
          onMoveDown={() => {}}
          isSaving={false}
          isApiLoading={false}
          dataLoading={false}
        />
      </div>
    </div>
  ),

  cognitive_short_text: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Respuesta Corta'),
        questionKey: currentQuestionKey,
        type: 'text',
        config: contentConfiguration,
        choices: [],
        description: String(contentConfiguration?.description || 'Escribe tu respuesta')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),

  cognitive_long_text: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Respuesta Larga'),
        questionKey: currentQuestionKey,
        type: 'text',
        config: contentConfiguration,
        choices: [],
        description: String(contentConfiguration?.description || 'Escribe tu respuesta detallada')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),

  cognitive_multiple_choice: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Selección Múltiple'),
        questionKey: currentQuestionKey,
        type: 'choice',
        config: { ...contentConfiguration, multiple: true },
        choices: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices : [],
        description: String(contentConfiguration?.description || 'Selecciona todas las opciones que apliquen')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),

  cognitive_single_choice: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Selección Única'),
        questionKey: currentQuestionKey,
        type: 'choice',
        config: { ...contentConfiguration, multiple: false },
        choices: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices : [],
        description: String(contentConfiguration?.description || 'Selecciona una opción')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),

  cognitive_linear_scale: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Escala Lineal'),
        questionKey: currentQuestionKey,
        type: 'scale',
        config: contentConfiguration,
        choices: [],
        description: String(contentConfiguration?.description || 'Selecciona un valor en la escala')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),

  cognitive_rating: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Calificación'),
        questionKey: currentQuestionKey,
        type: 'emoji',
        config: contentConfiguration,
        choices: [],
        description: String(contentConfiguration?.description || 'Califica usando las opciones')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),
};

const TestLayoutRenderer: React.FC = () => {
  const currentQuestionKey = useStepStore(state => state.currentQuestionKey);
  const { getSteps, getStepState, updateBackendResponses } = useStepStore();
  const steps = getSteps();
  const { getFormData } = useFormDataStore();

  console.log('[TestLayoutRenderer] 🔍 DEBUG RENDERER:', {
    currentQuestionKey,
    totalSteps: steps.length,
    steps: steps.map((step, idx) => ({
      questionKey: step.questionKey,
      title: step.title,
      state: getStepState(idx)
    }))
  });

  const { researchId, participantId } = useTestStore();

  // 🎯 SINCRONIZAR RESPONSAS DEL BACKEND CON EL STORE
  const { data: moduleResponses } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  useEffect(() => {
    if (moduleResponses?.responses && researchId && participantId) {
      console.log('[TestLayoutRenderer] 🔄 Sincronizando respuestas del backend:', {
        responses: moduleResponses.responses.map((r: any) => r.questionKey),
        researchId,
        participantId
      });

      // Convertir las respuestas del backend al formato del store
      const backendResponses = moduleResponses.responses.map((response: any) => ({
        questionKey: response.questionKey,
        response: response.response || {}
      }));

      // Actualizar el store con las respuestas del backend
      updateBackendResponses(backendResponses);
    }
  }, [moduleResponses?.responses, researchId, participantId, updateBackendResponses]);

  // 🎯 VERIFICACIÓN DE AUTENTICACIÓN
  if (!researchId) {
    console.log('[TestLayoutRenderer] ❌ No hay researchId, redirigiendo a login');
    // Obtener researchId de la URL o localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlResearchId = urlParams.get('researchId');
    const storedResearchId = localStorage.getItem('researchId');

    if (urlResearchId) {
      // Redirigir a login CON el researchId de la URL
      window.location.href = `/?researchId=${urlResearchId}`;
    } else if (storedResearchId) {
      // Redirigir a login CON el researchId del localStorage
      window.location.href = `/?researchId=${storedResearchId}`;
    } else {
      // Si no hay researchId en ningún lado, ir a error
      window.location.href = '/error-no-research-id';
    }
    return <div>Redirigiendo al login...</div>;
  }

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

  console.log('[TestLayoutRenderer] 🎯 RENDERIZANDO:', {
    currentQuestionKey,
    questionType,
    contentConfiguration: contentConfiguration ? 'SÍ' : 'NO'
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
  const isThankYouScreen = currentQuestionKey === 'thank_you_screen';

  const formData = getFormData(currentQuestionKey);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {renderedForm}
      </div>
      {!isWelcomeScreen && !isThankYouScreen && (
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
