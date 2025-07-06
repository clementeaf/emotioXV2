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
const CurrentStepRenderer: React.FC<CurrentStepProps & { responsesData?: any }> = ({
    stepType,
    stepConfig,
    savedResponse,
    onStepComplete,
    responsesData,
    ...restOfStepProps
}) => {
    const ComponentToRender = stepComponentMap[stepType];

    if (!ComponentToRender) {
        return <RenderError message={`Tipo de paso no encontrado: ${stepType}`} />;
    }
    const stepConfigSavedResponses = stepConfig && typeof stepConfig === 'object' && 'savedResponses' in stepConfig
        ? (stepConfig as any).savedResponses
        : undefined;

    let initialValueToPass = savedResponse;
    if (savedResponse && typeof savedResponse === 'object' && 'value' in savedResponse) {
        initialValueToPass = (savedResponse as any).value;
    }

    const finalSavedResponse = stepConfigSavedResponses || savedResponse;

    let mappedProps = {};

    if (stepType.startsWith('smartvoc_') && stepConfig && typeof stepConfig === 'object') {
        const config = stepConfig as any;
        mappedProps = {
            questionText: config.title || config.description || config.questionText,
            instructions: config.instructions,
            companyName: config.config?.companyName,
            config: config.config,
            stepId: config.id,
            stepName: config.title || config.description,
            required: config.required,
            savedResponse: finalSavedResponse,
            savedResponseId: config.savedResponseId,
        };
    }

    let demographicSavedResponse = savedResponse;
    if (stepType === 'demographic' && responsesData && Array.isArray(responsesData)) {
        const found = responsesData.find((r) => r && typeof r === 'object' && r.stepType === 'demographic' && 'response' in r);
        if (found && typeof found.response === 'object') {
            demographicSavedResponse = found.response;
        }
    }

    const finalProps = {
        ...restOfStepProps,
        stepType,
        stepConfig,
        config: stepConfig,
        initialValues: stepType === 'demographic' ? demographicSavedResponse : savedResponse,
        savedResponse: stepType === 'demographic' ? demographicSavedResponse : finalSavedResponse,
        onNext: onStepComplete,
        onSubmit: onStepComplete,
        onStepComplete: onStepComplete,
        initialValue: initialValueToPass,
        ...mappedProps,
    };
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full">Cargando paso...</div>}>
            <ComponentToRender {...finalProps as any} />
        </Suspense>
    );
};

export default CurrentStepRenderer;
