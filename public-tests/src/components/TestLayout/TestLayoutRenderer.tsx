// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAvailableFormsQuery, useModuleResponsesQuery } from '../../hooks/useApiQueries';
import { useStepStoreWithBackend } from '../../hooks/useStepStoreWithBackend';
import { useDebugSteps } from '../../hooks/useDebugSteps';
import { useEyeTrackingConfigQuery } from '../../hooks/useEyeTrackingConfigQuery';
import { useMobileStepVerification } from '../../hooks/useMobileStepVerification';
import { useOptimizedMonitoringWebSocket } from '../../hooks/useOptimizedMonitoringWebSocket';
import { useUserJourneyTracking } from '../../hooks/useUserJourneyTracking';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { MobileStepBlockedScreen } from '../common/MobileStepBlockedScreen';
import { GlobalLoadingOverlay } from '../common/GlobalLoadingOverlay';
import { ButtonSteps } from './ButtonSteps';
import { RENDERERS, UnknownStepComponent } from './ComponentRenderers';
import { getCurrentStepData, getQuestionType } from './utils';


const TestLayoutRenderer: React.FC = () => {
  const navigate = useNavigate();
  const { researchId, participantId, participantEmail } = useTestStore();
  const [checkingResearchId, setCheckingResearchId] = React.useState(false);

  // Verificar si researchId se carga desde localStorage después de un breve delay
  // Aumentar el delay para móviles que pueden tardar más en cargar el store
  useEffect(() => {
    if (!researchId && !checkingResearchId) {
      setCheckingResearchId(true);
      const timeout = setTimeout(() => {
        const { researchId: currentResearchId } = useTestStore.getState();
        if (!currentResearchId) {
          const urlParams = new URLSearchParams(window.location.search);
          const urlResearchId = urlParams.get('researchId');
          if (!urlResearchId) {
            window.location.href = '/error-no-research-id';
          }
        }
        setCheckingResearchId(false);
      }, 1500); // Aumentar a 1.5 segundos para móviles
      return () => clearTimeout(timeout);
    }
  }, [researchId, checkingResearchId]);

  // No redirigir inmediatamente, esperar a que se cargue desde localStorage o URL
  useEffect(() => {
    if (!checkingResearchId && !researchId) {
      // Ya se maneja en el useEffect anterior
      return;
    }
    
    if (researchId && !participantId) {
      // Si tenemos researchId pero no participantId, esperar más tiempo para móviles
      const timeout = setTimeout(() => {
        const { participantId: currentParticipantId } = useTestStore.getState();
        if (!currentParticipantId) {
          // Verificar también en la URL antes de redirigir
          const urlParams = new URLSearchParams(window.location.search);
          const urlParticipantId = urlParams.get('participantId') || urlParams.get('userId');
          if (!urlParticipantId) {
            // Solo redirigir si realmente no hay participantId después de esperar
            navigate('/error-no-research-id');
          }
        }
      }, 2000); // Aumentar a 2 segundos para móviles
      return () => clearTimeout(timeout);
    }
  }, [researchId, participantId, navigate, checkingResearchId]);
  const { currentQuestionKey } = useStepStore();
  const { getFormData } = useFormDataStore();
  const quotaResult = useFormDataStore(state => state.quotaResult);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousQuestionKey, setPreviousQuestionKey] = useState<string | null>(null);

  const { data: moduleResponses } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  const { sendParticipantLogin, isConnected, participantState } = useOptimizedMonitoringWebSocket();

  useStepStoreWithBackend();
  useDebugSteps();

  const {
    deviceType,
    isLoading: isLoadingMobileCheck,
    error: mobileCheckError,
    shouldShowBlockScreen
  } = useMobileStepVerification(researchId);

  const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');
  const shouldTrackUserJourney = eyeTrackingConfig?.parameterOptions?.saveUserJourney || false;

  const { trackStepVisit } = useUserJourneyTracking({
    enabled: shouldTrackUserJourney,
    researchId
  });

  const { data: formsData, isLoading, error } = useAvailableFormsQuery(researchId || '');

  useEffect(() => {
    if (researchId && participantId && isConnected && !participantState.hasLoggedIn) {
      const email = participantEmail || `${participantId.slice(-8)}@participant.study`;
      sendParticipantLogin(participantId, email);
    }
  }, [researchId, participantId, participantEmail, isConnected, participantState.hasLoggedIn, sendParticipantLogin]);

  useEffect(() => {
    if (currentQuestionKey && shouldTrackUserJourney) {
      trackStepVisit(currentQuestionKey, 'visit');
    }
  }, [currentQuestionKey, shouldTrackUserJourney, trackStepVisit]);

  useEffect(() => {
    if (formsData?.steps && formsData.steps.length > 0) {

      const { setSteps } = useStepStore.getState();
      const stepObjects = formsData.steps.map((questionKey: string) => ({
        questionKey,
        title: questionKey
      }));
      setSteps(stepObjects);
    }
  }, [formsData?.steps]);

  // Detectar cambios en currentQuestionKey para mostrar transición
  useEffect(() => {
    if (previousQuestionKey && previousQuestionKey !== currentQuestionKey) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    setPreviousQuestionKey(currentQuestionKey);
  }, [currentQuestionKey, previousQuestionKey]);

  if (!researchId) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlResearchId = urlParams.get('researchId');
    const currentPath = window.location.pathname;

    if (urlResearchId) {
      if (currentPath !== '/' && !currentPath.includes('/test')) {
        window.location.href = `/?researchId=${urlResearchId}`;
      } else {
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Configurando investigación...</p>
          </div>
        );
      }
    } else {
      // Esperar a que se cargue desde localStorage o que el useEffect lo maneje
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando investigación...</p>
        </div>
      );
    }
    return <div>Redirigiendo...</div>;
  }

  if (shouldShowBlockScreen && (deviceType === 'mobile' || deviceType === 'tablet')) {
    return (
      <MobileStepBlockedScreen
        deviceType={deviceType as 'mobile' | 'tablet'}
        researchId={researchId}
        currentStep={currentQuestionKey}
      />
    );
  }

  if (isLoadingMobileCheck) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Verificando configuración...</p>
      </div>
    );
  }

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

  if (isLoading) return (
    <div className='flex flex-col items-center justify-center h-full'>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Cargando formularios...</p>
    </div>
  );

  if (error) return (
    <div className='flex flex-col items-center justify-center h-full'>
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Conexión</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
  if (!currentQuestionKey) {
    return <div className='flex flex-col items-center justify-center h-full'>No se encontró información para este step</div>;
  }

  const currentStepData = getCurrentStepData(formsData, currentQuestionKey);

  if (!currentStepData) {
    return <div>No se encontró información para este step: {currentQuestionKey}</div>;
  }

  const { contentConfiguration } = currentStepData;
  const questionType = getQuestionType(currentQuestionKey);

  const hasConfiguredQuestions = questionType === 'demographics' ?
    Object.values(contentConfiguration?.demographicQuestions || {}).some((q: { enabled?: boolean }) => q?.enabled) :
    true;

  const isConfigurationPending = questionType === 'demographics' && !hasConfiguredQuestions;
  const backendResponse = moduleResponses?.responses?.find(
    (response) => response.questionKey === currentQuestionKey
  );

  const formData = backendResponse?.response || getFormData(currentQuestionKey) || {};

  const renderedForm =
    RENDERERS[questionType]?.({ contentConfiguration, currentQuestionKey, quotaResult, eyeTrackingConfig, formData }) ||
    <UnknownStepComponent
      data={{
        questionKey: currentQuestionKey,
        contentConfiguration,
        message: `No se encontró un componente específico para: ${currentQuestionKey}`,
        questionType,
        availableRenderers: Object.keys(RENDERERS)
      }}
    />;

  const isWelcomeScreen = currentQuestionKey === 'welcome_screen';
  const isThankYouScreen = currentQuestionKey === 'thank_you_screen';
  const isNavigationFlow = questionType === 'cognitive_navigation_flow';

  const shouldHideButton = (() => {
    if (questionType !== 'smartvoc_nev') return false;

    const instructions = String(contentConfiguration?.instructions || '');
    const hasMaxSelectionPattern = /hasta\s+(\d+)|máximo\s+(\d+)|máx\s+(\d+)|max\s+(\d+)|selecciona\s+hasta\s+(\d+)|selecciona\s+máximo\s+(\d+)|selecciona\s+(\d+)\s+emociones|(\d+)\s+emociones/i.test(instructions);

    if (hasMaxSelectionPattern) {
      return true;
    }

    return false;
  })();

  return (
    <>
      <GlobalLoadingOverlay 
        isVisible={isTransitioning} 
        message="Cargando siguiente pregunta..."
      />
      <div className={`flex flex-col h-full w-full transition-opacity duration-300 ${
        isTransitioning ? 'opacity-50' : 'opacity-100'
      }`}>
        {renderedForm}
        {!isWelcomeScreen && !isThankYouScreen && !isConfigurationPending && !shouldHideButton && !isNavigationFlow && (
          <ButtonSteps
            currentQuestionKey={currentQuestionKey}
            formData={formData}
            isWelcomeScreen={isWelcomeScreen}
          />
        )}
      </div>
    </>
  );
};

export default TestLayoutRenderer;
