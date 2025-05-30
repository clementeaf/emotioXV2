import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ParticipantFlowStep } from '../types/flow';
import { useParticipantFlow } from '../hooks/useParticipantFlow';
import FlowStepContent from '../components/flow/FlowStepContent';
import { ProgressSidebar } from '../components/layout/ProgressSidebar';
import LoadingIndicator from '../components/common/LoadingIndicator';

const ParticipantFlow: React.FC = () => {
    const { researchId } = useParams<{ researchId: string }>();
    
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
        responsesData,
    } = useParticipantFlow(researchId);

    const memoizedCurrentExpandedStep = useMemo(() => {
        return expandedSteps && expandedSteps.length > currentStepIndex 
               ? expandedSteps[currentStepIndex] 
               : null;
    }, [expandedSteps, currentStepIndex]);

    const memoizedResponsesDataProp = useMemo(() => {
        const isThankYou = memoizedCurrentExpandedStep?.type === 'thankyou' || currentStep === ParticipantFlowStep.DONE;
        return isThankYou ? responsesData : undefined;
    }, [memoizedCurrentExpandedStep, currentStep, responsesData]);
    
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

    let content;
    if (isFlowLoading) {
        content = (
            <div className="flex items-center justify-center min-h-screen w-full bg-neutral-200">
                <LoadingIndicator message="Cargando configuración del estudio..." />
            </div>
        );
    } else {
        content = (
            <div className="min-h-screen w-screen bg-neutral-200">
                {/* Barra de progreso superior */}
                {showSidebar && expandedSteps && (
                    <div className="w-full px-8 py-6">
                        <div className="max-w-5xl mx-auto">
                            {/* Información del progreso */}
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-xl font-semibold text-neutral-900">
                                    {memoizedCurrentExpandedStep?.name || 'Cargando...'}
                                </h1>
                                <span className="text-sm text-neutral-500 font-mono">
                                    Paso {currentStepIndex + 1} de {expandedSteps.length}
                                </span>
                            </div>
                            
                            {/* Barra de progreso visual - usando 70% del ancho */}
                            <div className="w-[70%]">
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
                )}

                {/* Contenido principal */}
                <div className="flex overflow-hidden" style={{ height: showSidebar ? 'calc(100vh - 120px)' : '100vh' }}>
                    {/* Sidebar de pasos a la izquierda */}
                    {showSidebar && expandedSteps && (
                        <ProgressSidebar 
                            steps={expandedSteps}
                            currentStepIndex={currentStepIndex} 
                            onNavigateToStep={navigateToStep}
                        />
                    )}

                    {/* Contenido del formulario en cuadro blanco expandido */}
                    <main className={`flex-1 overflow-y-auto p-6 pr-0 pb-0 ${!showSidebar ? 'w-full' : ''}`}>
                        <div className="h-full">
                            <div className="bg-white rounded-tl-xl shadow-lg border-l border-t border-neutral-200 h-full">
                                <div className="p-8">
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
                                        responsesData={memoizedResponsesDataProp}
                                    />
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return content;
};

export default ParticipantFlow;
