import React, { useEffect } from 'react';
import { useAvailableFormsQuery, useModuleResponsesQuery, useSaveModuleResponseMutation } from '../../hooks/useApiQueries';
import { useEyeTrackingConfigQuery } from '../../hooks/useEyeTrackingConfigQuery';
import { useMobileStepVerification } from '../../hooks/useMobileStepVerification';
import { useUserJourneyTracking } from '../../hooks/useUserJourneyTracking';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { MobileStepBlockedScreen } from '../common/MobileStepBlockedScreen';
import { ButtonSteps } from './ButtonSteps';
import { DemographicForm } from './DemographicForm';
import { NavigationFlowTask } from './NavigationFlowTask';
import { PreferenceTestTask } from './PreferenceTestTask';
import { QuestionComponent } from './QuestionComponent';
import { RankingList } from './RankingList';
import { ScreenComponent } from './StepsComponents';
import { getCurrentStepData, getQuestionType } from './utils';

// 🎯 RENDERERS PARA DIFERENTES TIPOS DE COMPONENTES
const RENDERERS: Record<string, (args: any) => React.ReactNode> = {
  screen: ({ contentConfiguration, currentQuestionKey }) => {
    // 🎯 COMPONENTE PARA thank_you_screen CON AUTO-GUARDADO
    if (currentQuestionKey === 'thank_you_screen') {
      return (
        <ThankYouScreenComponent
          contentConfiguration={contentConfiguration}
          currentQuestionKey={currentQuestionKey}
        />
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
        demographicQuestions={demographicQuestions as Record<string, any>}
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
    return (
      <NavigationFlowTask
        stepConfig={{
          id: currentQuestionKey,
          type: 'cognitive_navigation_flow',
          title: String(contentConfiguration?.title || 'Flujo de Navegación'),
          description: String(contentConfiguration?.description || '¿En cuál de las siguientes pantallas encuentras el objetivo indicado?'),
          files: Array.isArray(contentConfiguration?.files) ? contentConfiguration.files : []
        }}
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
      currentQuestionKey={currentQuestionKey}
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
          onMoveUp={() => { }}
          onMoveDown={() => { }}
          isSaving={false}
          isApiLoading={false}
          dataLoading={false}
          currentQuestionKey={currentQuestionKey}
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

// 🎯 COMPONENTE PARA PASOS DESCONOCIDOS
const UnknownStepComponent: React.FC<{ data: unknown }> = ({ data }) => (
  <div className='flex flex-col items-center justify-center h-full gap-10'>
    <h2 className='text-2xl font-bold'>Componente desconocido</h2>
    <p>No se pudo renderizar este tipo de componente</p>
    <pre className='text-sm text-gray-500'>{JSON.stringify(data, null, 2)}</pre>
  </div>
);

const ThankYouScreenComponent: React.FC<{
  contentConfiguration: Record<string, unknown>;
  currentQuestionKey: string;
}> = ({ contentConfiguration, currentQuestionKey }) => {
  const { setFormData } = useFormDataStore();
  const { researchId, participantId } = useTestStore();
  const saveModuleResponseMutation = useSaveModuleResponseMutation();

  // 🎯 AUTO-GUARDAR CUANDO SE VISITA THANK YOU SCREEN
  React.useEffect(() => {
    if (currentQuestionKey === 'thank_you_screen' && researchId && participantId) {
      // Guardar en formData
      setFormData(currentQuestionKey, {
        visited: true,
        timestamp: new Date().toISOString()
      });

      // 🎯 ENVIAR A MODULE-RESPONSES API
      const sendToAPI = async () => {
        try {
          const timestamp = new Date().toISOString();

          // 🎯 OBTENER CONFIGURACIÓN DE EYE-TRACKING
          const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');

          // Capturar información real del dispositivo SOLO si está habilitado
          let deviceInfo = null;
          if (eyeTrackingConfig?.parameterOptions?.saveDeviceInfo) {
            deviceInfo = {
              type: getDeviceType(),
              browser: getBrowserInfo(),
              os: getOSInfo(),
              screenSize: `${window.screen.width}x${window.screen.height}`
            };
          }

          // Capturar información de ubicación SOLO si está habilitado
          let location = null;
          if (eyeTrackingConfig?.parameterOptions?.saveLocationInfo) {
            location = await getLocationInfo();
          }

          const createData = {
            researchId: researchId,
            participantId: participantId,
            questionKey: currentQuestionKey,
            responses: [{
              questionKey: currentQuestionKey,
              response: { visited: true },
              timestamp,
              createdAt: timestamp,
              updatedAt: undefined,
              ...(deviceInfo && { deviceInfo }),
              ...(location && { location })
            }],
            metadata: {}
          };

          await saveModuleResponseMutation.mutateAsync(createData);
        } catch (error) {
          console.error('❌ ThankYouScreenComponent - Error enviando a module-responses:', error);
        }
      };

      // Funciones helper para capturar datos reales
      const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
        const width = window.screen.width;
        const height = window.screen.height;
        const ratio = width / height;

        if (width >= 1024) return 'desktop';
        if (width >= 768 && ratio > 1.2) return 'tablet';
        return 'mobile';
      };

      const getBrowserInfo = (): string => {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown';
      };

      const getOSInfo = (): string => {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'macOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iOS')) return 'iOS';
        return 'Unknown';
      };

      const getLocationInfo = async (): Promise<{ country: string, city: string, ip: string }> => {
        try {
          // Intentar obtener IP real
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          const ip = data.ip;

          // Intentar obtener ubicación basada en IP
          const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
          const geoData = await geoResponse.json();

          return {
            country: geoData.country_name || 'Chile',
            city: geoData.city || 'Valparaíso',
            ip: ip
          };
        } catch (error) {
          console.warn('No se pudo obtener información de ubicación:', error);
          return {
            country: 'Chile',
            city: 'Valparaíso',
            ip: 'N/A'
          };
        }
      };

      sendToAPI();
    }
  }, [currentQuestionKey, setFormData, researchId, participantId]);

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
};

const TestLayoutRenderer: React.FC = () => {
  const currentQuestionKey = useStepStore(state => state.currentQuestionKey);
  const { updateBackendResponses } = useStepStore();
  const { getFormData } = useFormDataStore();
  const { researchId, participantId } = useTestStore();

  // 🎯 VERIFICACIÓN MÓVIL EN STEPS
  const {
    isBlocked,
    deviceType,
    allowMobile,
    configFound,
    isLoading: isLoadingMobileCheck,
    error: mobileCheckError,
    shouldShowBlockScreen
  } = useMobileStepVerification(researchId);

  const { data: moduleResponses } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  // 🎯 OBTENER CONFIGURACIÓN DE EYE-TRACKING
  const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');
  const shouldTrackUserJourney = eyeTrackingConfig?.parameterOptions?.saveUserJourney || false;

  // 🎯 TRACKING DE RECORRIDO NO INTRUSIVO
  const { trackStepVisit, isTracking: isJourneyTracking } = useUserJourneyTracking({
    enabled: shouldTrackUserJourney,
    researchId
  });

  useEffect(() => {
    if (moduleResponses?.responses && researchId && participantId) {
      const backendResponses = moduleResponses.responses.map((response: any) => {
        return {
          questionKey: response.questionKey,
          response: response.response || {}
        };
      });

      updateBackendResponses(backendResponses);
    }
  }, [moduleResponses?.responses, researchId, participantId, updateBackendResponses]);

  // 🎯 TRACKING DE VISITA DE STEP
  useEffect(() => {
    if (currentQuestionKey && shouldTrackUserJourney) {
      trackStepVisit(currentQuestionKey, 'visit');
    }
  }, [currentQuestionKey, shouldTrackUserJourney, trackStepVisit]);

  if (!researchId) {
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

  // 🚨 BLOQUEAR STEPS SI ES MÓVIL NO PERMITIDO
  if (shouldShowBlockScreen && (deviceType === 'mobile' || deviceType === 'tablet')) {
    return (
      <MobileStepBlockedScreen
        deviceType={deviceType as 'mobile' | 'tablet'}
        researchId={researchId}
        currentStep={currentQuestionKey}
      />
    );
  }

  // Mostrar loading mientras se verifica la configuración móvil
  if (isLoadingMobileCheck) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Verificando configuración...</p>
      </div>
    );
  }

  // Mostrar error si falla la verificación móvil
  if (mobileCheckError) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Verificación</h2>
          <p className="text-gray-600 mb-4">No se pudo verificar la configuración del dispositivo.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Log para debugging
  console.log('[TestLayoutRenderer] Estado de verificación móvil:', {
    currentQuestionKey,
    isBlocked,
    deviceType,
    allowMobile,
    configFound,
    shouldShowBlockScreen,
    researchId
  });

  const { data: formsData, isLoading, error } = useAvailableFormsQuery(researchId || '');

  if (isLoading) return <div className='flex flex-col items-center justify-center h-full'>Cargando...</div>;
  if (error) return <div className='flex flex-col items-center justify-center h-full'>Error: {error.message}</div>;
  if (!currentQuestionKey) {
    return <div className='flex flex-col items-center justify-center h-full'>No se encontró información para este step</div>;
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
