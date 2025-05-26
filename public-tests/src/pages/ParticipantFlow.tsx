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

    console.log('expandedSteps:', expandedSteps);
    console.log('currentStepIndex:', currentStepIndex);
    console.log('currentStep:', expandedSteps && expandedSteps[currentStepIndex]);

    let content;
    if (isFlowLoading) {
        content = (
            <div className="flex items-center justify-center min-h-screen w-full bg-neutral-100">
                <LoadingIndicator message="Cargando configuración del estudio..." />
            </div>
        );
    } else {
        content = (
            <div className="flex h-screen w-screen overflow-hidden bg-neutral-100">
                {showSidebar && expandedSteps && (
                    <ProgressSidebar 
                        steps={expandedSteps}
                        currentStepIndex={currentStepIndex} 
                        onNavigateToStep={navigateToStep}
                    />
                )}

                <main className={`flex-1 overflow-y-auto bg-white flex flex-col items-center justify-center ${!showSidebar ? 'w-full' : ''}`}>
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
                </main>
            </div>
        );
    }

    return content;
};

export default ParticipantFlow;
