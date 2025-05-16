import React, { useMemo } from 'react';
import { ParticipantFlowStep, ExpandedStep } from '../../types/flow';
import CurrentStepRenderer from './CurrentStepRenderer';
import LoadingIndicator from '../common/LoadingIndicator';
import ErrorDisplay from '../common/ErrorDisplay';
import { FlowStepContentProps as OldFlowStepContentProps } from './types';

interface FlowStepContentProps extends Omit<OldFlowStepContentProps, 'currentStep'> {
    currentStepEnum: ParticipantFlowStep;
    currentExpandedStep: ExpandedStep | null;
    isLoading: boolean;
    responsesData?: any;
    handleError: (errorMessage: string, step: ParticipantFlowStep | string) => void;
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

    if (!researchId) {
        return <ErrorDisplay title="Error Crítico" message="ID de investigación no encontrado en la URL." />;
    }

    if (isLoading || currentStepEnum === ParticipantFlowStep.LOADING_SESSION) {
        return <LoadingIndicator message="Cargando sesión y flujo..." />;
    }

    if (currentStepEnum === ParticipantFlowStep.ERROR) {
        return <ErrorDisplay title="Error en el Flujo" message={error || 'Ocurrió un error desconocido.'} />;
    }

    // Wrapper para onError
    const handleRendererError = (errorMessage: string, stepType: string) => {
        handleError(errorMessage, stepType); // Llamar a la función original
    };

    // MODIFICADO: Memoizar la lógica de stepConfig
    const memoizedStepConfig = useMemo(() => {
        if (!currentExpandedStep) {
            return undefined; // o null, según lo que espere CurrentStepRenderer
        }
        const isThankYouStep = currentExpandedStep.type === 'thankyou' || currentStepEnum === ParticipantFlowStep.DONE;
        if (isThankYouStep && responsesData) {
            return { ...currentExpandedStep.config, responsesData };
        }
        return currentExpandedStep.config;
    }, [currentExpandedStep, currentStepEnum, responsesData]);

    if (currentStepEnum === ParticipantFlowStep.LOGIN) {
        return (
            <CurrentStepRenderer 
                stepType="login"
                researchId={researchId}
                onLoginSuccess={handleLoginSuccess}
                onError={handleRendererError}
            />
        );
    }

    if (currentExpandedStep) {
        
        return (
            <CurrentStepRenderer 
                stepType={currentExpandedStep.type}
                stepConfig={memoizedStepConfig} // Usar la config memoizada
                stepId={currentExpandedStep.id}
                stepName={currentExpandedStep.name}
                researchId={researchId}
                token={token}
                onStepComplete={handleStepComplete}
                onError={handleRendererError}
            />
        );
    }

    // Estado de fallback en caso de que no se cumpla ninguna condición anterior
    return <ErrorDisplay title="Error Inesperado" message="El estado actual de la aplicación es inconsistente." />;
};

export default FlowStepContent; 