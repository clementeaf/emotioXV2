import React from 'react';
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
        completedRelevantSteps,
        totalRelevantSteps,
        responsesData,
        getAnsweredStepIndices,
        loadedApiResponses
    } = useParticipantFlow(researchId);

    const currentExpandedStep = expandedSteps && expandedSteps.length > currentStepIndex 
                                ? expandedSteps[currentStepIndex] 
                                : null;

    const answeredStepIndices = getAnsweredStepIndices();

    const isThankYouStep = currentExpandedStep?.type === 'thankyou' || currentStep === ParticipantFlowStep.DONE;
    
    // Determina si se debe mostrar la barra lateral
    const showSidebar = ![
        ParticipantFlowStep.LOGIN, 
        ParticipantFlowStep.LOADING_SESSION, 
        ParticipantFlowStep.ERROR
    ].includes(currentStep);

    return (
         <div className="flex h-screen w-screen overflow-hidden bg-neutral-100">
            {showSidebar && (
                <ProgressSidebar 
                    steps={(expandedSteps || []).map((step) => ({ id: step.id, name: step.name }))}
                    currentStepIndex={currentStepIndex} 
                    onNavigateToStep={navigateToStep}
                    completedSteps={completedRelevantSteps}
                    totalSteps={totalRelevantSteps}
                    answeredStepIndices={answeredStepIndices}
                    loadedApiResponses={loadedApiResponses}
                />
            )}

            <main className={`flex-1 overflow-y-auto bg-white flex flex-col items-center justify-center ${!showSidebar ? 'w-full' : ''}`}>
                 <FlowStepContent
                    currentStepEnum={currentStep}
                    currentExpandedStep={currentStep === ParticipantFlowStep.LOGIN || currentStep === ParticipantFlowStep.LOADING_SESSION || currentStep === ParticipantFlowStep.ERROR ? null : currentExpandedStep}
                    isLoading={isFlowLoading}
                    researchId={researchId}
                    token={token}
                    error={error}
                    handleLoginSuccess={handleLoginSuccess}
                    handleStepComplete={handleStepComplete}
                    handleError={handleError}
                    responsesData={isThankYouStep ? responsesData : undefined}
                />
            </main>
         </div>
    );
};

export default ParticipantFlow;