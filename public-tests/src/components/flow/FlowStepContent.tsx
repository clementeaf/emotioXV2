import React, { useMemo } from 'react';
import { ParticipantFlowStep } from '../../types/flow';
import CurrentStepRenderer from './CurrentStepRenderer';
import LoadingIndicator from '../common/LoadingIndicator';
import ErrorDisplay from '../common/ErrorDisplay';
// import { FlowStepContentProps as OldFlowStepContentProps } from './types';
import { ResponsesData } from '../../hooks/types';
import { FlowStepContentComponentProps } from '../../types/flow.types';

const FlowStepContent: React.FC<FlowStepContentComponentProps> = (props) => {
    // Declarar todas las props al inicio
    const {
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
    } = props;

    // Memoizar la lógica de stepConfig ANTES de cualquier return condicional
    const memoizedStepConfig = useMemo(() => {
        if (!currentExpandedStep) {
            return undefined; // o null, según lo que espere CurrentStepRenderer
        }
        const isThankYouStep = currentExpandedStep.type === 'thankyou' || currentStepEnum === ParticipantFlowStep.DONE;
        if (isThankYouStep && responsesData) {
            // Solo hacer spread si config es un objeto
            const config = currentExpandedStep.config;
            if (config && typeof config === 'object' && !Array.isArray(config)) {
                return { ...config, responsesData };
            }
            // Si config no es objeto, solo pasar responsesData
            return { responsesData };
        }
        return currentExpandedStep.config;
    }, [currentExpandedStep, currentStepEnum, responsesData]);

    // Crear una key única para forzar re-renderizado cuando cambia el step
    const stepKey = useMemo(() => {
        if (currentExpandedStep) {
            return `${currentExpandedStep.id}-${currentExpandedStep.type}-${Date.now()}`;
        }
        return `${currentStepEnum}-${Date.now()}`;
    }, [currentExpandedStep, currentStepEnum]);

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

    if (currentStepEnum === ParticipantFlowStep.LOGIN) {
        return (
            <CurrentStepRenderer 
                key={`login-${stepKey}`}
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
                key={stepKey} // Usar key única para forzar re-renderizado
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