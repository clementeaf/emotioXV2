import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { LocationPermissionRequest } from '../components/common/LocationPermissionRequest';
import { MobileBlockScreen } from '../components/common/MobileBlockScreen';
import { TimeProgress } from '../components/common/TimeProgress';
import FlowStepContent from '../components/flow/FlowStepContent';
import { ProgressSidebar } from '../components/layout/ProgressSidebar';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { useMobileDeviceCheck } from '../hooks/useMobileDeviceCheck';
import { useParticipantFlow } from '../hooks/useParticipantFlow';
import { useReentryTracking } from '../hooks/useReentryTracking';
import { useResponseTiming } from '../hooks/useResponseTiming';
import { useParticipantStore } from '../stores/participantStore';
import { ParticipantFlowStep } from '../types/flow';

const ParticipantFlow: React.FC = () => {
    const { researchId } = useParams<{ researchId: string }>();
    const setDeviceType = useParticipantStore(state => state.setDeviceType);
    const incrementReentryCount = useParticipantStore(state => state.incrementReentryCount);
    const startGlobalTimer = useParticipantStore(state => state.startGlobalTimer);
    const stopGlobalTimer = useParticipantStore(state => state.stopGlobalTimer);
    const deviceType = useParticipantStore(state => state.deviceType);

    const {
        currentStep,
        token,
        error,
        handleLoginSuccess,
        handleStepComplete,
        handleError,
        expandedSteps,
        currentStepIndex,
        isFlowLoading,
        navigateToStep,
        // responsesData: responsesDataFromFlow, // Comentado porque no se usa
        getStepResponse: getStepResponseFromManager,
        loadExistingResponses,
        participantId
    } = useParticipantFlow(researchId);

    // Obtener SIEMPRE el array actualizado del store
    const responsesData = useParticipantStore(state => state.responsesData.modules.all_steps || []);

    // Obtener función getStepResponse del store (para backup/debugging)
    const getStepResponseFromStore = useParticipantStore(state => state.getStepResponse);

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const memoizedCurrentExpandedStep = useMemo(() => {
        return expandedSteps && expandedSteps.length > currentStepIndex
               ? expandedSteps[currentStepIndex]
               : null;
    }, [expandedSteps, currentStepIndex]);

    const savedResponseForCurrentStep = useMemo(() => {
        if (!memoizedCurrentExpandedStep) {
            return undefined;
        }
        // Usar la función del store que devuelve el valor correcto
        const savedResponse = getStepResponseFromStore(currentStepIndex);
        console.log('[ParticipantFlow] 🔍 savedResponseForCurrentStep:', {
            stepId: memoizedCurrentExpandedStep.id,
            stepIndex: currentStepIndex,
            savedResponse
        });
        return savedResponse;
    }, [memoizedCurrentExpandedStep, getStepResponseFromStore, currentStepIndex, responsesData]);

    // const memoizedResponsesDataProp = useMemo(() => {
    //     const isThankYou = memoizedCurrentExpandedStep?.type === 'thankyou' || currentStep === ParticipantFlowStep.DONE;
    //     return isThankYou ? (responsesData as any) : undefined;
    // }, [memoizedCurrentExpandedStep, currentStep, responsesData]);

    const showSidebar = ![
        ParticipantFlowStep.LOGIN,
        ParticipantFlowStep.LOADING_SESSION,
        ParticipantFlowStep.ERROR
    ].includes(currentStep);

    // Calcular progreso para la barra superior
    const progressInfo = useMemo(() => {
        if (!expandedSteps?.length) return { percentage: 0, current: 0, total: 0 };

        const relevantSteps = expandedSteps.filter(step =>
            step.type !== 'welcome' && step.type !== 'thankyou'
        );

        const completedSteps = Math.min(currentStepIndex, relevantSteps.length);
        const percentage = relevantSteps.length > 0 ? Math.round((completedSteps / relevantSteps.length) * 100) : 0;

        return {
            percentage,
            current: completedSteps,
            total: relevantSteps.length
        };
    }, [expandedSteps, currentStepIndex]);

    // Iniciar timer global solo al pasar de LOGIN a otro estado
    useEffect(() => {
        if (currentStep !== ParticipantFlowStep.LOGIN && currentStep !== ParticipantFlowStep.LOADING_SESSION) {
            startGlobalTimer();
        }
    }, [currentStep, startGlobalTimer]);

    // Detener timer global al salir
    useEffect(() => {
        return () => {
            stopGlobalTimer();
        };
    }, [stopGlobalTimer]);

    useEffect(() => {
        const ua = navigator.userAgent;
        let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
        if (/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua)) {
            type = /iPad|Tablet|PlayBook|Silk/i.test(ua) ? 'tablet' : 'mobile';
        }
        setDeviceType(type);
        incrementReentryCount();
    }, [setDeviceType, incrementReentryCount]);

    const eyeTrackingConfig = useMemo(() => {
        if (
            responsesData &&
            Array.isArray(responsesData) &&
            responsesData.length > 0
        ) {
                        // Buscar respuesta de eye tracking en el array
            const eyeTrackingResponse = responsesData.find(response =>
                response && typeof response === 'object' &&
                (response.stepType === 'eye_tracking' || (response as any).type === 'eye_tracking')
            );
            if (eyeTrackingResponse && typeof eyeTrackingResponse === 'object' && 'config' in eyeTrackingResponse) {
                return eyeTrackingResponse.config;
            }
        }
        // Fallback: buscar en expandedSteps si está disponible
        if (expandedSteps && expandedSteps.length > 0) {
            const eyeTrackingStep = expandedSteps.find(step => step.type === 'eye_tracking');
            if (eyeTrackingStep && eyeTrackingStep.config) {
                return eyeTrackingStep.config;
            }
        }
        return null;
    }, [responsesData, expandedSteps]);

    const {
        allowMobile,
        configFound,
        shouldBlock
    } = useMobileDeviceCheck(eyeTrackingConfig, isFlowLoading);

    const {
        isEnabled: isLocationTrackingEnabled
    } = useLocationTracking(eyeTrackingConfig);

    const {
        reentryCount,
        sessionStartTime,
        lastVisitTime,
        totalSessionTime,
        isFirstVisit
    } = useReentryTracking();

    const {
        isGlobalTimerRunning,
        globalStartTime,
        globalEndTime,
        activeSectionTimers,
        sectionTimings
    } = useResponseTiming();

    useEffect(() => {
        if (researchId && participantId) {
            loadExistingResponses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [researchId, participantId]);

    if (shouldBlock) {
        return (
            <MobileBlockScreen
                deviceType={deviceType || 'mobile'}
                researchId={researchId}
                allowMobile={allowMobile}
                configFound={configFound}
            />
        );
    }

    let content;
    if (isFlowLoading) {
        content = (
            <div className="flex items-center justify-center min-h-screen w-full bg-neutral-200">
                <LoadingIndicator message="Cargando configuración del estudio..." />
            </div>
        );
    } else {
        content = (
            <div className="min-h-screen w-screen bg-neutral-200 sm:bg-neutral-200 bg-white sm:bg-white">
                {/* Barra de progreso superior */}
                {showSidebar && expandedSteps && (
                    <div className="w-full px-4 py-4 sm:px-8 sm:py-6 flex items-center">
                        {/* Burger solo mobile */}
                        <button
                          className="block sm:hidden mr-4 p-2 rounded bg-white shadow border border-neutral-200"
                          onClick={() => setIsMobileSidebarOpen(true)}
                          aria-label="Abrir menú de progreso"
                        >
                          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                          </svg>
                        </button>
                        {/* Cabecera solo desktop */}
                        <div className="hidden sm:block flex-1">
                          <div className="max-w-5xl mx-auto">
                            {/* Información del progreso */}
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-xl font-semibold text-neutral-900">
                                    {memoizedCurrentExpandedStep?.name || 'Cargando...'}
                                </h1>
                                <div className="flex items-center gap-4">
                                    <TimeProgress variant="minimal" />
                                    <span className="text-sm text-neutral-500 font-mono">
                                        Paso {currentStepIndex + 1} de {expandedSteps.length}
                                    </span>
                                </div>
                            </div>
                            {/* Barra de progreso visual - usando 70% del ancho */}
                            <div className="w-full sm:w-[70%]">
                                <div className="flex items-center justify-between text-xs text-neutral-500 mb-2 font-mono">
                                    <span>Progreso del estudio</span>
                                    <span>{progressInfo.percentage}%</span>
                                </div>
                                <div className="w-full bg-neutral-300 rounded-full h-1.5">
                                    <div
                                        className="bg-neutral-800 h-1.5 rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${progressInfo.percentage}%` }}
                                    />
                                </div>
                            </div>
                          </div>
                        </div>
                    </div>
                )}

                {/* Drawer lateral mobile */}
                {showSidebar && expandedSteps && (
                  <>
                    {/* Backdrop */}
                    {isMobileSidebarOpen && (
                      <div
                        className="fixed inset-0 bg-black bg-opacity-40 z-40 sm:hidden"
                        onClick={() => setIsMobileSidebarOpen(false)}
                        aria-hidden="true"
                      />
                    )}
                    {/* Drawer */}
                    <div
                      className={`fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-lg transition-transform duration-300 sm:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                      style={{ willChange: 'transform' }}
                    >
                      <button
                        className="absolute top-3 right-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                        onClick={() => setIsMobileSidebarOpen(false)}
                        aria-label="Cerrar menú de progreso"
                      >
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                      <div className="h-full overflow-y-auto pt-12 pb-4">
                        <ProgressSidebar
                          steps={expandedSteps}
                          currentStepIndex={currentStepIndex}
                          onNavigateToStep={(idx) => {
                            setIsMobileSidebarOpen(false);
                            navigateToStep(idx);
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Contenido principal */}
                <div className={`flex overflow-hidden ${showSidebar ? 'sm:h-[calc(100vh-120px)]' : 'sm:h-screen'} sm:h-auto`}>
                    {/* Sidebar de pasos a la izquierda (solo desktop) */}
                    {showSidebar && expandedSteps && (
                        <div className="hidden sm:block">
                          <ProgressSidebar
                              steps={expandedSteps}
                              currentStepIndex={currentStepIndex}
                              onNavigateToStep={navigateToStep}
                          />
                        </div>
                    )}

                    {/* Contenido del formulario en cuadro blanco expandido */}
                    <main className={`flex-1 overflow-y-auto p-0 sm:p-6 pr-0 pb-0 ${!showSidebar ? 'w-full' : ''}`}>
                        <div className="w-full pt-4 pb-6 sm:pt-0 sm:pb-0 flex justify-center sm:block">
                            <div className="bg-white !shadow-none !border-0 rounded-none sm:rounded-tl-xl sm:shadow-lg sm:border-l sm:border-t sm:border-neutral-200 h-auto w-full sm:w-auto sm:h-auto flex justify-center sm:block">
                                <div className="p-0 sm:p-8 w-full h-auto max-w-md mx-auto sm:max-w-none flex justify-center sm:block">
                                    {/* Eliminar visualización de debug, pero mantener lógica de tracking */}
                                    {/*
                                    <div className="mb-4">
                                        <ReentryInfo
                                            reentryCount={reentryCount}
                                            sessionStartTime={sessionStartTime}
                                            lastVisitTime={lastVisitTime}
                                            totalSessionTime={totalSessionTime}
                                            isFirstVisit={isFirstVisit}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <TimingInfo
                                            isGlobalTimerRunning={isGlobalTimerRunning}
                                            globalStartTime={globalStartTime}
                                            globalEndTime={globalEndTime}
                                            activeSectionTimers={activeSectionTimers}
                                            sectionTimings={sectionTimings}
                                        />
                                    </div>
                                    */}

                                    {/* Componente de solicitud de ubicación si está habilitado */}
                                    {isLocationTrackingEnabled && (
                                        <div className="mb-6">
                                            <LocationPermissionRequest
                                                showFallbackInfo={true}
                                            />
                                        </div>
                                    )}

                                    <FlowStepContent
                                        currentStepEnum={currentStep}
                                        currentExpandedStep={memoizedCurrentExpandedStep}
                                        isLoading={isFlowLoading}
                                        researchId={researchId}
                                        token={token}
                                        error={error}
                                        handleLoginSuccess={handleLoginSuccess}
                                        handleStepComplete={handleStepComplete}
                                        handleError={handleError}
                                        responsesData={responsesData}
                                        savedResponse={savedResponseForCurrentStep}
                                    />
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <>
            {content}
        </>
    );
};

export default ParticipantFlow;
