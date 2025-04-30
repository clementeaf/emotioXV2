import React from 'react';
import { useParams } from 'react-router-dom';
import TopNavBar from '../components/layout/TopNavBar';
import { ParticipantFlowStep } from '../types/flow';
import { useParticipantFlow } from '../hooks/useParticipantFlow';
import FlowStepContent from '../components/flow/FlowStepContent';

const ParticipantFlow: React.FC = () => {
    const { researchId } = useParams<{ researchId: string }>();
    
    const {
        currentStep,
        token,
        error,
        handleLoginSuccess,
        handleStepComplete,
        handleError,
        handleNavigation,
    } = useParticipantFlow(researchId);

    const showNavBar = 
        currentStep !== ParticipantFlowStep.LOGIN && 
        currentStep !== ParticipantFlowStep.DONE &&
        currentStep !== ParticipantFlowStep.LOADING_SESSION &&
        currentStep !== ParticipantFlowStep.ERROR;


    return (
         <div className="min-h-screen bg-gray-100 flex flex-col">
            {showNavBar && <TopNavBar onNavigate={handleNavigation} />}
            <div className="flex-grow w-full flex flex-col items-center justify-center p-4">
                <FlowStepContent
                    currentStep={currentStep}
                    researchId={researchId}
                    token={token}
                    error={error}
                    handleLoginSuccess={handleLoginSuccess}
                    handleStepComplete={handleStepComplete}
                    handleError={handleError}
                />
            </div>
         </div>
    );
};

export default ParticipantFlow;