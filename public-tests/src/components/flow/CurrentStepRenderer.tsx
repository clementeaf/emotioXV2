import React, { Suspense, useCallback, useState } from 'react';
import { useParticipantStore } from '../../stores/participantStore';
import { RenderError } from './RenderError';
import { stepComponentMap } from './steps';
import { CurrentStepProps } from './types';

const SMART_VOC_ROUTER_STEP_TYPE = 'smart_voc_module';
const DEMOGRAPHIC_STEP_TYPE = 'demographic';

type EnrichedStepConfig = Record<string, unknown> | null;

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
    const [error, setError] = useState<string | null>(null);

    // Simplificación: Ya no manejaremos 'enrichedStepConfig' aquí.
    // La lógica de cargar respuestas previas se manejará dentro de cada componente
    // de paso específico (ej: a través del hook useModuleResponses).
    // Esto evita el bucle de re-renderizado complejo.

    const participantIdFromStore = useParticipantStore(state => state.participantId);

    const renderStepWithWarning = useCallback(
        (content: React.ReactNode) => (
            <div className="w-full h-full">
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

    // Lógica principal de renderizado
    const ComponentToRender = stepComponentMap[stepType] || (() => <RenderError message={`Tipo de paso no encontrado: ${stepType}`} />);

    if (error) {
        return <RenderError message={error} stepType={stepType} />;
    }

    // El componente a renderizar podría estar lazy-loaded, así que usamos Suspense.
    return renderStepWithWarning(
        <Suspense fallback={<div className="flex items-center justify-center h-full">Cargando paso...</div>}>
            <ComponentToRender
                // Pasamos las props directamente. El componente hijo se encargará de su estado.
                stepType={stepType}
                stepId={stepId}
                stepName={stepName}
                stepConfig={stepConfig}
                researchId={researchId}
                participantId={participantIdFromStore}
                token={token}
                onLoginSuccess={onLoginSuccess as (p: unknown) => void}
                onStepComplete={onStepComplete as (d?: unknown) => void}
                onError={handleError}
            />
        </Suspense>
    );
};

export default CurrentStepRenderer;
