import React from 'react';
import { ParticipantFlowStep } from '../../types/flow';
import CurrentStepRenderer from './CurrentStepRenderer'; // Renderiza el paso actual (LOGIN, WELCOME, etc.)
import LoadingIndicator from '../common/LoadingIndicator';
import ErrorDisplay from '../common/ErrorDisplay';
import { Participant } from '../../../../shared/interfaces/participant'; // Necesaria para onLoginSuccess

// Props que necesita este componente para tomar decisiones y pasar a CurrentStepRenderer
interface FlowStepContentProps {
    currentStep: ParticipantFlowStep;
    researchId: string | undefined; // Puede ser undefined inicialmente
    token: string | null;
    error: string | null;
    // Callbacks
    handleLoginSuccess: (participant: Participant) => void;
    handleStepComplete: () => void;
    handleError: (errorMessage: string, step: ParticipantFlowStep) => void;
}

const FlowStepContent: React.FC<FlowStepContentProps> = ({
    currentStep,
    researchId,
    token,
    error,
    handleLoginSuccess,
    handleStepComplete,
    handleError,
}) => {
    console.log('[FlowStepContent] Decidiendo qué renderizar para el paso:', ParticipantFlowStep[currentStep], 'Error:', error);

    // 1. Manejar caso de researchId faltante (Error crítico)
    if (!researchId) {
        return <ErrorDisplay title="Error Crítico" message="ID de investigación no encontrado en la URL." />;
    }

    // 2. Manejar estado de carga
    if (currentStep === ParticipantFlowStep.LOADING_SESSION) {
        return <LoadingIndicator message="Cargando sesión..." />;
    }

    // 3. Manejar estado de error
    if (currentStep === ParticipantFlowStep.ERROR) {
        return <ErrorDisplay message={error} />; // ErrorDisplay maneja mensaje null
    }

    // 4. Si no es carga ni error, renderizar el contenido del paso actual
    // Pasamos todas las props necesarias a CurrentStepRenderer
    return (
        <CurrentStepRenderer 
            currentStep={currentStep}
            researchId={researchId} // Sabemos que está definido aquí
            token={token}
            onLoginSuccess={handleLoginSuccess}
            onStepComplete={handleStepComplete}
            onError={handleError}
        />
    );
};

export default FlowStepContent; 