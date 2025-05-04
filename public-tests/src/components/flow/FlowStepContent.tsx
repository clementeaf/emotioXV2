import React from 'react';
import { ParticipantFlowStep, ExpandedStep } from '../../types/flow';
import CurrentStepRenderer from './CurrentStepRenderer';
import LoadingIndicator from '../common/LoadingIndicator';
import ErrorDisplay from '../common/ErrorDisplay';
import { FlowStepContentProps as OldFlowStepContentProps } from './types';
import { ResponsesData } from '../../hooks/useParticipantFlow';

interface FlowStepContentProps extends Omit<OldFlowStepContentProps, 'currentStep'> {
    currentStepEnum: ParticipantFlowStep;
    currentExpandedStep: ExpandedStep | null;
    isLoading: boolean;
    responsesData?: ResponsesData; // Datos de respuestas para el visor final
}

const FlowStepContent: React.FC<FlowStepContentProps> = ({
    currentStepEnum,
    currentExpandedStep,
    isLoading,
    researchId,
    token,
    error,
    handleLoginSuccess,
    handleStepComplete,
    handleError,
    responsesData,
}) => {
    console.log('[FlowStepContent] Estado global:', ParticipantFlowStep[currentStepEnum], 'Cargando:', isLoading, 'Paso actual:', currentExpandedStep?.id);

    if (!researchId) {
        return <ErrorDisplay title="Error Crítico" message="ID de investigación no encontrado en la URL." />;
    }

    if (isLoading || currentStepEnum === ParticipantFlowStep.LOADING_SESSION) {
        return <LoadingIndicator message="Cargando sesión y flujo..." />;
    }

    if (currentStepEnum === ParticipantFlowStep.ERROR) {
        return <ErrorDisplay title="Error en el Flujo" message={error || 'Ocurrió un error desconocido.'} />;
    }

    if (currentStepEnum === ParticipantFlowStep.LOGIN) {
        return (
            <CurrentStepRenderer 
                stepType="login"
                researchId={researchId}
                onLoginSuccess={handleLoginSuccess}
                onError={handleError}
            />
        );
    }

    // Los pasos normales con configuración
    if (currentExpandedStep) {
        // Verificar si es el paso de agradecimiento para pasar los datos de respuestas
        const isThankYouStep = currentExpandedStep.type === 'thankyou' || currentStepEnum === ParticipantFlowStep.DONE;
        
        return (
            <CurrentStepRenderer 
                stepType={currentExpandedStep.type}
                stepConfig={isThankYouStep && responsesData ? { ...currentExpandedStep.config, responsesData } : currentExpandedStep.config}
                stepId={currentExpandedStep.id}
                stepName={currentExpandedStep.name}
                researchId={researchId}
                token={token}
                onStepComplete={handleStepComplete}
                onError={handleError}
            />
        );
    }

    // Estado de fallback en caso de que no se cumpla ninguna condición anterior
    return <ErrorDisplay title="Error Inesperado" message="El estado actual de la aplicación es inconsistente." />;
};

export default FlowStepContent; 