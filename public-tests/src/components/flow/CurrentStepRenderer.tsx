import React, { Suspense } from 'react';
import { RenderError } from './RenderError';
import { stepComponentMap } from './steps';
import { CurrentStepProps } from './types';

/**
 * Componente que actúa como un "router" para renderizar el paso actual del flujo.
 * Lee el `stepType` y, usando el `stepComponentMap`, renderiza el componente de UI correspondiente.
 * También es responsable de mapear las propiedades genéricas del paso (como `title` o `instructions`
 * desde `stepConfig`) a las props específicas que cada componente de UI espera (como `questionText`).
 */
const CurrentStepRenderer: React.FC<CurrentStepProps> = ({
    stepType,
    stepConfig,
    savedResponse,
    onStepComplete,
    ...restOfStepProps
}) => {
    const ComponentToRender = stepComponentMap[stepType];

    // Si no se encuentra un componente para el tipo de paso, muestra un error.
    if (!ComponentToRender) {
        return <RenderError message={`Tipo de paso no encontrado: ${stepType}`} />;
    }

    // LOGS DE DEPURACIÓN CRÍTICA
    console.log('[CurrentStepRenderer] stepType:', stepType, 'stepConfig:', stepConfig, 'savedResponse:', savedResponse);

    // 🔍 LOGGING ESPECÍFICO PARA DEBUGEAR SAVED RESPONSE
    const stepConfigSavedResponses = stepConfig && typeof stepConfig === 'object' && 'savedResponses' in stepConfig
        ? (stepConfig as any).savedResponses
        : undefined;

    console.log('[CurrentStepRenderer] 🔍 Análisis detallado savedResponse:', {
        directSavedResponse: savedResponse,
        stepConfigSavedResponses,
        stepConfigKeys: stepConfig && typeof stepConfig === 'object' ? Object.keys(stepConfig) : null,
        willUseSavedResponses: stepConfigSavedResponses || savedResponse
    });

    // Prepara las props finales para el componente.
    let initialValueToPass = savedResponse;
    if (savedResponse && typeof savedResponse === 'object' && 'value' in savedResponse) {
        initialValueToPass = (savedResponse as any).value;
    }

    // Determinar qué savedResponse usar - priorizar stepConfig.savedResponses
    const finalSavedResponse = stepConfigSavedResponses || savedResponse;

    const finalProps = {
        ...restOfStepProps,
        stepType,
        stepConfig,
        config: stepConfig,
        initialValues: savedResponse,
        savedResponse: finalSavedResponse, // ✅ AGREGADO: pasar savedResponse explícitamente
        onNext: onStepComplete,
        onSubmit: onStepComplete,
        onStepComplete: onStepComplete,
        initialValue: initialValueToPass,
    };

    // Renderiza el componente del paso, envuelto en Suspense por si está lazy-loaded.
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full">Cargando paso...</div>}>
            <ComponentToRender {...finalProps as any} />
        </Suspense>
    );
};

export default CurrentStepRenderer;
