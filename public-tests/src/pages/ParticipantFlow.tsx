import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ParticipantFlowStep } from '../types/flow';
import { useParticipantFlow } from '../hooks/useParticipantFlow';
import FlowStepContent from '../components/flow/FlowStepContent';
import { ProgressSidebar } from '../components/layout/ProgressSidebar';

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

    const memoizedCurrentExpandedStepProp = useMemo(() => {
        return currentStep === ParticipantFlowStep.LOGIN || 
               currentStep === ParticipantFlowStep.LOADING_SESSION || 
               currentStep === ParticipantFlowStep.ERROR 
               ? null 
               : memoizedCurrentExpandedStep;
    }, [currentStep, memoizedCurrentExpandedStep]);

    const memoizedSidebarSteps = useMemo(() => {
        return (expandedSteps || []).map((step) => ({ id: step.id, name: step.name }));
    }, [expandedSteps]);

    return (
         <div className="flex h-screen w-screen overflow-hidden bg-neutral-100">
            {showSidebar && (
                <ProgressSidebar 
                    steps={memoizedSidebarSteps}
                    currentStepIndex={currentStepIndex} 
                    onNavigateToStep={navigateToStep}
                />
            )}

            <main className={`flex-1 overflow-y-auto bg-white flex flex-col items-center justify-center ${!showSidebar ? 'w-full' : ''}`}>
                 <FlowStepContent
                    currentStepEnum={currentStep}
                    currentExpandedStep={memoizedCurrentExpandedStepProp}
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
};

export default ParticipantFlow;
