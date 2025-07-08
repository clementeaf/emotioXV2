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

    let demographicSavedResponse = undefined;
    let demographicResponseId = undefined;
    if (stepType === 'demographic' && responsesData && Array.isArray(responsesData)) {
        const found = responsesData.find((r) => r && typeof r === 'object' && (r.stepType === 'demographic' || r.type === 'demographic') && 'response' in r);
        if (found && typeof found.response === 'object') {
            demographicSavedResponse = found.response;
            demographicResponseId = found.id;
        }
    }

    let preferenceSavedResponse = undefined;
    let preferenceResponseId = undefined;
    if (stepType === 'cognitive_preference_test' && responsesData && Array.isArray(responsesData)) {
        const found = responsesData.find((r) => r && typeof r === 'object' && (r.stepType === 'cognitive_preference_test' || r.type === 'cognitive_preference_test') && 'response' in r);
        if (found && typeof found.response === 'object') {
            preferenceSavedResponse = found.response;
            preferenceResponseId = found.id;
        }
    }

    if (stepType === 'demographic') {
        if (!responsesData || !Array.isArray(responsesData)) {
            return <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">Cargando datos demográficos...</div>;
        }
        // Extracción robusta de respuesta previa
        let initialValues = {};
        if (demographicSavedResponse && typeof demographicSavedResponse === 'object' && 'response' in demographicSavedResponse) {
            initialValues = demographicSavedResponse.response;
        } else if (savedResponse && typeof savedResponse === 'object' && 'response' in savedResponse) {
            initialValues = savedResponse.response;
        } else if (savedResponse !== undefined) {
            initialValues = savedResponse;
        }
        const finalProps = {
            ...restOfStepProps,
            stepType,
            stepConfig,
            config: stepConfig,
            initialValues,
            savedResponse: initialValues,
            onNext: onStepComplete,
            onSubmit: onStepComplete,
            onStepComplete: onStepComplete,
            initialValue: initialValueToPass,
            ...mappedProps,
        };
        const keyForDemographic = demographicResponseId || 'empty';
        return (
            <Suspense fallback={<div className="flex items-center justify-center h-full">Cargando paso...</div>}>
                <ComponentToRender key={keyForDemographic} {...finalProps as any} />
            </Suspense>
        );
    }

    if (stepType === 'cognitive_preference_test') {
        if (!responsesData || !Array.isArray(responsesData)) {
            return <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">Cargando datos de preferencia...</div>;
        }
        // Extracción robusta de respuesta previa
        let initialValues = {};
        if (preferenceSavedResponse && typeof preferenceSavedResponse === 'object' && 'response' in preferenceSavedResponse) {
            initialValues = preferenceSavedResponse.response;
        } else if (savedResponse && typeof savedResponse === 'object' && 'response' in savedResponse) {
            initialValues = savedResponse.response;
        } else if (savedResponse !== undefined) {
            initialValues = savedResponse;
        }
        const finalProps = {
            ...restOfStepProps,
            stepType,
            stepConfig,
            config: stepConfig,
            initialValues,
            savedResponse: initialValues,
            onNext: onStepComplete,
            onSubmit: onStepComplete,
            onStepComplete: onStepComplete,
            initialValue: initialValueToPass,
            ...mappedProps,
        };
        const keyForPreference = preferenceResponseId || 'empty';
        return (
            <Suspense fallback={<div className="flex items-center justify-center h-full">Cargando paso...</div>}>
                <ComponentToRender key={keyForPreference} {...finalProps as any} />
            </Suspense>
        );
    }

    const finalProps = {
        ...restOfStepProps,
        stepType,
        stepConfig,
        config: stepConfig,
        initialValues: savedResponse,
        savedResponse: finalSavedResponse,
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
