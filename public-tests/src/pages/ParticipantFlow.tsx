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

    const showMainLayout = 
        currentStep !== ParticipantFlowStep.LOGIN && 
        currentStep !== ParticipantFlowStep.LOADING_SESSION &&
        currentStep !== ParticipantFlowStep.ERROR;

    const isThankYouStep = currentExpandedStep?.type === 'thankyou' || currentStep === ParticipantFlowStep.DONE;

    if (!showMainLayout) {
        return (
             <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
                 <FlowStepContent
                    currentStepEnum={currentStep}
                    currentExpandedStep={null}
                    isLoading={isFlowLoading}
                    researchId={researchId}
                    token={token}
                    error={error}
                    handleLoginSuccess={handleLoginSuccess}
                    handleStepComplete={handleStepComplete}
                    handleError={handleError}
                    responsesData={isThankYouStep ? responsesData : undefined}
                />
            </div>
        );
    }

    return (
         <div className="flex h-screen w-screen overflow-hidden bg-neutral-100">
            <ProgressSidebar 
                steps={(expandedSteps || []).map((step) => ({ id: step.id, name: step.name }))}
                currentStepIndex={currentStepIndex} 
                onNavigateToStep={navigateToStep}
                completedSteps={completedRelevantSteps}
                totalSteps={totalRelevantSteps}
                answeredStepIndices={answeredStepIndices}
                loadedApiResponses={loadedApiResponses}
            />

            <main className="flex-1 overflow-y-auto bg-white flex flex-col items-center justify-center">
                 <FlowStepContent
                    currentStepEnum={currentStep}
                    currentExpandedStep={currentExpandedStep}
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