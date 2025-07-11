import React, { useMemo } from 'react';
import { useParticipantStore } from '../../stores/participantStore';
import { ParticipantFlowStep } from '../../types/flow';
import { FlowStepContentComponentProps } from '../../types/flow.types';
import ErrorDisplay from '../common/ErrorDisplay';
import LoadingIndicator from '../common/LoadingIndicator';
import CurrentStepRenderer from './CurrentStepRenderer';

const FlowStepContent: React.FC<Omit<FlowStepContentComponentProps, 'responsesData'> & { responsesData?: any }> = (props) => {
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
        savedResponse,
    } = props;

    const getQuestionKey = useParticipantStore(state => state.getQuestionKey);

    const memoizedStepConfig = useMemo(() => {
        if (!currentExpandedStep) {
            return undefined;
        }
        const isThankYouStep = currentExpandedStep.type === 'thankyou' || currentStepEnum === ParticipantFlowStep.DONE;
        if (isThankYouStep && responsesData) {
            const config = currentExpandedStep.config;
            if (config && typeof config === 'object' && !Array.isArray(config)) {
                return { ...config, responsesData };
            }
            return { responsesData };
        }
        return currentExpandedStep.config;
    }, [currentExpandedStep, currentStepEnum, responsesData]);

    const currentQuestionKey = useMemo(() => {
        if (!currentExpandedStep) return '';

        const questionKey = getQuestionKey(currentExpandedStep.id);
        if (questionKey) {
            console.log(`[FlowStepContent] 🔑 Obtenido questionKey: ${questionKey} para stepId: ${currentExpandedStep.id}`);
            return questionKey;
        }

        if (!currentExpandedStep.id.includes('unknown_') && !currentExpandedStep.id.includes('temp_') && !currentExpandedStep.id.includes('debug_')) {
            console.warn(`[FlowStepContent] ⚠️ No se encontró questionKey para stepId: ${currentExpandedStep.id}, usando stepId como fallback`);
        }
        return currentExpandedStep.id;
    }, [currentExpandedStep, getQuestionKey]);

    const stepKey = useMemo(() => {
        if (currentExpandedStep) {
            return `${currentExpandedStep.id}-${currentExpandedStep.type}-${Date.now()}`;
        }
        return `${currentStepEnum}-${Date.now()}`;
    }, [currentExpandedStep, currentStepEnum]);

    const responsesDataArray: any[] = Array.isArray(responsesData) ? responsesData : [];

    if (!researchId) {
        return <ErrorDisplay title="Error Crítico" message="ID de investigación no encontrado en la URL." />;
    }

    if (isLoading || currentStepEnum === ParticipantFlowStep.LOADING_SESSION) {
        return <LoadingIndicator message="Cargando sesión y flujo..." />;
    }

    if (currentStepEnum === ParticipantFlowStep.ERROR) {
        return <ErrorDisplay title="Error en el Flujo" message={error || 'Ocurrió un error desconocido.'} />;
    }

    const handleRendererError = (errorMessage: string, stepType: string) => {
        handleError(errorMessage, stepType);
    };

    if (currentStepEnum === ParticipantFlowStep.LOGIN) {
        return (
            <CurrentStepRenderer
                key={`login-${stepKey}`}
                stepType="login"
                researchId={researchId}
                onLoginSuccess={handleLoginSuccess}
                onError={handleRendererError}
                questionKey="login"
            />
        );
    }

    if (currentExpandedStep) {
        return (
            <CurrentStepRenderer
                key={stepKey}
                stepType={currentExpandedStep.type}
                stepId={currentExpandedStep.id}
                stepName={currentExpandedStep.name}
                stepConfig={memoizedStepConfig}
                instructions={currentExpandedStep.instructions}
                researchId={researchId}
                token={token}
                onStepComplete={handleStepComplete}
                onError={handleRendererError}
                savedResponse={savedResponse}
                responsesData={responsesDataArray}
                questionKey={currentQuestionKey}
            />
        );
    }

    return <ErrorDisplay title="Error Inesperado" message="Aun no hay formularios configurados." />;
};

export default FlowStepContent;
