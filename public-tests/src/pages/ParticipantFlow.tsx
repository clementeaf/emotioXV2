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
        completedRelevantSteps,
        totalRelevantSteps,
        responsesData,
        getAnsweredStepIndices,
        loadedApiResponses
    } = useParticipantFlow(researchId);

    // DEBUG: Verificar tipo de handleLoginSuccess
    console.log('[ParticipantFlow] Tipo de handleLoginSuccess al obtenerla del hook:', typeof handleLoginSuccess, handleLoginSuccess);

    // Memoizar currentExpandedStep
    const memoizedCurrentExpandedStep = useMemo(() => {
        return expandedSteps && expandedSteps.length > currentStepIndex 
               ? expandedSteps[currentStepIndex] 
               : null;
    }, [expandedSteps, currentStepIndex]);

    const answeredStepIndices = getAnsweredStepIndices();

    // Memoizar la prop responsesData tal como se pasará
    const memoizedResponsesDataProp = useMemo(() => {
        const isThankYou = memoizedCurrentExpandedStep?.type === 'thankyou' || currentStep === ParticipantFlowStep.DONE;
        return isThankYou ? responsesData : undefined;
    }, [memoizedCurrentExpandedStep, currentStep, responsesData]);
    
    // Determina si se debe mostrar la barra lateral
    const showSidebar = ![
        ParticipantFlowStep.LOGIN, 
        ParticipantFlowStep.LOADING_SESSION, 
        ParticipantFlowStep.ERROR
    ].includes(currentStep);

    // Memoizar la prop currentExpandedStep tal como se pasará
    const memoizedCurrentExpandedStepProp = useMemo(() => {
        return currentStep === ParticipantFlowStep.LOGIN || 
               currentStep === ParticipantFlowStep.LOADING_SESSION || 
               currentStep === ParticipantFlowStep.ERROR 
               ? null 
               : memoizedCurrentExpandedStep;
    }, [currentStep, memoizedCurrentExpandedStep]);

    // Memoizar la prop steps para ProgressSidebar
    const memoizedSidebarSteps = useMemo(() => {
        return (expandedSteps || []).map((step) => ({ id: step.id, name: step.name }));
    }, [expandedSteps]); // Solo se recalcula si expandedSteps cambia

    return (
         <div className="flex h-screen w-screen overflow-hidden bg-neutral-100">
            {showSidebar && (
                <ProgressSidebar 
                    steps={memoizedSidebarSteps}
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