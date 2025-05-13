import React, { useState, useCallback, Suspense } from 'react';
import { RenderError } from './RenderError';
import { MockDataWarning } from './MockDataWarning';
import { CurrentStepProps } from './types';
import { stepComponentMap, MappedStepComponentProps } from './steps';

const CurrentStepRenderer: React.FC<CurrentStepProps> = ({
    stepType,
    stepConfig,
    stepId,
    stepName,
    researchId,
    token,
    onLoginSuccess,
    onStepComplete,
    onError,
}) => {
    const [_loading, _setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const renderStepWithWarning = useCallback(
        (content: React.ReactNode, isMock: boolean, warningMessage?: string) => (
            <div className="relative w-full flex flex-col items-center justify-center min-h-full p-4 sm:p-8">
                {isMock && <MockDataWarning message={warningMessage} />}
                {content}
            </div>
        ),
        []
    );

    const handleError = useCallback((message: string) => {
        setError(message);
        if (onError) {
            onError(message, stepType);
        }
    }, [onError, stepType]);

    const renderContent = useCallback(() => {
        if (error) {
            return <div className="p-6 text-center text-red-500">Error: {error}</div>;
        }

        // DEBUG: Inspeccionar stepConfig para cognitive_single_choice
        if (stepType === 'cognitive_single_choice') {
            console.log('[CurrentStepRenderer] cognitive_single_choice - stepConfig:', JSON.stringify(stepConfig, null, 2));
            console.log('[CurrentStepRenderer] cognitive_single_choice - stepName:', stepName);
        }
        // DEBUG: Inspeccionar stepConfig para cognitive_multiple_choice
        if (stepType === 'cognitive_multiple_choice') {
            console.log('[CurrentStepRenderer] cognitive_multiple_choice - stepConfig:', JSON.stringify(stepConfig, null, 2));
            console.log('[CurrentStepRenderer] cognitive_multiple_choice - stepName:', stepName);
        }

        const ComponentToRender = stepComponentMap[stepType];

        if (ComponentToRender) {
            const isGenerallyMock = !stepConfig;

            const mappedProps: MappedStepComponentProps & { isMock?: boolean } = {
                stepType,
                stepConfig,
                stepId,
                stepName,
                researchId,
                token,
                onLoginSuccess,
                onStepComplete: onStepComplete || (() => {}),
                onError: handleError,
                isMock: isGenerallyMock,
            };

            const warningMessage = isGenerallyMock ? `Configuración para '${stepType}' podría estar incompleta o usando datos de prueba.` : undefined;

            return renderStepWithWarning(
                <ComponentToRender {...mappedProps} />,
                isGenerallyMock,
                warningMessage
            );
        } else {
            console.warn(`[CurrentStepRenderer] Tipo de paso no manejado: ${stepType}`);
            return <RenderError stepType={stepType} />;
        }
    }, [stepType, stepConfig, stepId, stepName, researchId, token, onLoginSuccess, onStepComplete, onError, error, renderStepWithWarning, handleError]);

    return (
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center p-6 text-center text-neutral-500">Cargando módulo...</div>}>
            {renderContent()}
        </Suspense>
    );
};

export default CurrentStepRenderer; 