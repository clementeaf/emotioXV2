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
    ...restOfStepProps
}) => {
    const ComponentToRender = stepComponentMap[stepType];

    // Si no se encuentra un componente para el tipo de paso, muestra un error.
    if (!ComponentToRender) {
        return <RenderError message={`Tipo de paso no encontrado: ${stepType}`} />;
    }

    // Prepara las props finales para el componente.
    // Esto es crucial para la consistencia.
    const finalProps = {
        ...restOfStepProps,
        stepType,
        stepConfig,

        // Mapeo de props genéricas a específicas:
        // El `title` del paso se convierte en `questionText` para la pregunta.
        onNext: (restOfStepProps as any).onStepComplete,
        questionText: (stepConfig as any)?.title,
        instructions: (stepConfig as any)?.instructions,
        companyName: (stepConfig as any)?.config?.companyName,
        config: (stepConfig as any)?.config,
    };

    // Renderiza el componente del paso, envuelto en Suspense por si está lazy-loaded.
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full">Cargando paso...</div>}>
            <ComponentToRender {...(finalProps as any)} />
        </Suspense>
    );
};

export default CurrentStepRenderer;
