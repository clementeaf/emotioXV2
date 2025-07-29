import React, { useEffect } from 'react';
import { useAvailableFormsQuery, useModuleResponsesQuery } from '../../hooks/useApiQueries';
import { useDebugSteps } from '../../hooks/useDebugSteps';
import { useEyeTrackingConfigQuery } from '../../hooks/useEyeTrackingConfigQuery';
import { useMobileStepVerification } from '../../hooks/useMobileStepVerification';
import { useMonitoringWebSocket } from '../../hooks/useMonitoringWebSocket';
import { useUserJourneyTracking } from '../../hooks/useUserJourneyTracking';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { MobileStepBlockedScreen } from '../common/MobileStepBlockedScreen';
import { ButtonSteps } from './ButtonSteps';
import { RENDERERS, UnknownStepComponent } from './ComponentRenderers';
import { getCurrentStepData, getQuestionType } from './utils';





const TestLayoutRenderer: React.FC = () => {
  const { researchId, participantId } = useTestStore();
  const { currentQuestionKey, goToNextStep, updateBackendResponses } = useStepStore();
  const { setFormData, getFormData } = useFormDataStore();
  const quotaResult = useFormDataStore(state => state.quotaResult);

  // 🎯 HOOK WEBSOCKET PARA NOTIFICACIONES
  const { sendParticipantLogin, isConnected } = useMonitoringWebSocket();

  // 🎯 DEBUG HOOK PARA DIAGNOSTICAR PROBLEMAS
  useDebugSteps();

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

  // 🎯 OBTENER CONFIGURACIÓN DE EYE-TRACKING
  const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');
  const shouldTrackUserJourney = eyeTrackingConfig?.parameterOptions?.saveUserJourney || false;

  // 🎯 TRACKING DE RECORRIDO NO INTRUSIVO
  const { trackStepVisit, isTracking: isJourneyTracking } = useUserJourneyTracking({
    enabled: shouldTrackUserJourney,
    researchId
  });

  // 🎯 QUERY DE FORMS - SIEMPRE EJECUTAR
  const { data: formsData, isLoading, error } = useAvailableFormsQuery(researchId || '');

  // 🎯 QUERY DE MODULE RESPONSES
  const { data: moduleResponses } = useModuleResponsesQuery(researchId || '', participantId || '');

  // 🎯 ENVIAR EVENTO DE LOGIN CUANDO EL PARTICIPANTE INICIA LA SESIÓN
  useEffect(() => {
    if (researchId && participantId && isConnected) {
      console.log('[TestLayoutRenderer] 🎯 Participante iniciando sesión:', {
        researchId,
        participantId,
        isConnected
      });

      // 🎯 ENVIAR EVENTO DE LOGIN PARA NOTIFICAR AL FRONTEND
      sendParticipantLogin(participantId, 'participant@test.com'); // Email por defecto para participantes existentes

      console.log('[TestLayoutRenderer] ✅ Evento PARTICIPANT_LOGIN enviado para participante existente');
    } else {
      console.log('[TestLayoutRenderer] ⏳ Esperando conexión WebSocket:', {
        researchId: !!researchId,
        participantId: !!participantId,
        isConnected
      });
    }
  }, [researchId, participantId, isConnected, sendParticipantLogin]);

  // 🎯 EFFECTS DESPUÉS DE TODOS LOS HOOKS
  useEffect(() => {
    if (moduleResponses?.responses && researchId && participantId) {
      console.log('[TestLayoutRenderer] 🎯 Procesando respuestas del backend:', moduleResponses.responses);

      const backendResponses = moduleResponses.responses.map((response: any) => {
        return {
          questionKey: response.questionKey,
          response: response.response || {}
        };
      });

      console.log('[TestLayoutRenderer] 🎯 Actualizando store de steps con:', backendResponses);
      updateBackendResponses(backendResponses);

      // 🎯 SINCRONIZAR CON FORM DATA STORE
      const { setFormData } = useFormDataStore.getState();
      backendResponses.forEach((backendResponse: any) => {
        if (backendResponse.questionKey && backendResponse.response) {
          // 🎯 EXTRAER VALOR DE LA RESPUESTA
          let value = null;
          if (backendResponse.response.value !== undefined) {
            value = backendResponse.response.value;
          } else if (backendResponse.response.selectedValue !== undefined) {
            value = backendResponse.response.selectedValue;
          } else if (backendResponse.response.response !== undefined) {
            value = backendResponse.response.response;
          } else if (backendResponse.response.age !== undefined) {
            // 🎯 CASO ESPECIAL PARA DEMOGRÁFICOS
            value = backendResponse.response.age;
          }

          // 🎯 GUARDAR EN FORM DATA STORE
          const formDataToSave = {
            value,
            selectedValue: value,
            response: backendResponse.response,
            timestamp: backendResponse.response.timestamp || new Date().toISOString()
          };

          // 🎯 PARA DEMOGRÁFICOS, GUARDAR TAMBIÉN EN EL FORMATO ESPERADO
          if (backendResponse.questionKey === 'demographics') {
            setFormData('demographics', {
              ...formDataToSave,
              age: value // 🎯 GUARDAR TAMBIÉN COMO age PARA COMPATIBILIDAD
            });
          } else {
            setFormData(backendResponse.questionKey, formDataToSave);
          }

          console.log('[TestLayoutRenderer] 🎯 Sincronizando respuesta:', {
            questionKey: backendResponse.questionKey,
            value,
            response: backendResponse.response,
            savedToFormData: backendResponse.questionKey === 'demographics' ? 'demographics' : backendResponse.questionKey
          });
        }
      });
    }
  }, [moduleResponses?.responses, researchId, participantId, updateBackendResponses]);

  // 🎯 TRACKING DE VISITA DE STEP
  useEffect(() => {
    if (currentQuestionKey && shouldTrackUserJourney) {
      trackStepVisit(currentQuestionKey, 'visit');
    }
  }, [currentQuestionKey, shouldTrackUserJourney, trackStepVisit]);

  // 🎯 INICIALIZAR STEPS CUANDO SE OBTIENEN LOS FORMS
  useEffect(() => {
    if (formsData?.steps && formsData.steps.length > 0) {
      console.log('[TestLayoutRenderer] 🎯 Inicializando steps:', {
        steps: formsData.steps,
        currentQuestionKey
      });

      const { setSteps } = useStepStore.getState();
      // Convertir strings a Step objects
      const stepObjects = formsData.steps.map(questionKey => ({
        questionKey,
        title: questionKey
      }));
      setSteps(stepObjects);
    }
  }, [formsData?.steps]);

  // 🎯 LÓGICA DE REDIRECCIÓN DESPUÉS DE HOOKS
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

  if (isLoading) return <div className='flex flex-col items-center justify-center h-full'>Cargando...</div>;
  if (error) return <div className='flex flex-col items-center justify-center h-full'>Error: {error.message}</div>;
  if (!currentQuestionKey) {
    console.log('[TestLayoutRenderer] ❌ No hay currentQuestionKey:', { currentQuestionKey });
    return <div className='flex flex-col items-center justify-center h-full'>No se encontró información para este step</div>;
  }

  console.log('[TestLayoutRenderer] 🔍 Buscando step data:', {
    currentQuestionKey,
    formsData: formsData ? {
      steps: formsData.steps?.length,
      stepsConfiguration: formsData.stepsConfiguration?.length,
      hasSteps: !!formsData.steps,
      hasConfig: !!formsData.stepsConfiguration
    } : 'NO DATA'
  });

  const currentStepData = getCurrentStepData(formsData, currentQuestionKey);

  console.log('[TestLayoutRenderer] 📊 Step data encontrado:', {
    currentQuestionKey,
    currentStepData: currentStepData ? {
      questionKey: currentStepData.questionKey,
      hasContent: !!currentStepData.contentConfiguration,
      contentKeys: currentStepData.contentConfiguration ? Object.keys(currentStepData.contentConfiguration) : []
    } : 'NO STEP DATA'
  });

  if (!currentStepData) {
    console.log('[TestLayoutRenderer] ❌ No se encontró step data para:', currentQuestionKey);
    return <div>No se encontró información para este step</div>;
  }

  const { contentConfiguration } = currentStepData;
  const questionType = getQuestionType(currentQuestionKey);

  // 🎯 VERIFICAR SI HAY PREGUNTAS CONFIGURADAS PARA DEMOGRAPHICS
  const hasConfiguredQuestions = questionType === 'demographics' ?
    Object.values(contentConfiguration?.demographicQuestions || {}).some((q: any) => q?.enabled) :
    true;

  const renderedForm =
    RENDERERS[questionType]?.({ contentConfiguration, currentQuestionKey, quotaResult, eyeTrackingConfig }) ||
    <UnknownStepComponent
      data={{
        questionKey: currentQuestionKey,
        contentConfiguration,
        message: `No se encontró un componente específico para: ${currentQuestionKey}`
      }}
    />;

  const isWelcomeScreen = currentQuestionKey === 'welcome_screen';
  const isThankYouScreen = currentQuestionKey === 'thank_you_screen';
  const isConfigurationPending = questionType === 'demographics' && !hasConfiguredQuestions;

  const rawFormData = getFormData(currentQuestionKey);
  // 🎯 EXTRAER EL VALOR REAL DE LOS DATOS DEL FORMULARIO
  const formData: Record<string, unknown> = rawFormData?.value !== undefined ? { value: rawFormData.value } : rawFormData || {};

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {renderedForm}
      </div>
      {/* 🎯 OCULTAR BOTÓN SI NO HAY CONFIGURACIÓN */}
      {!isWelcomeScreen && !isThankYouScreen && !isConfigurationPending && (
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
