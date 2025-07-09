import React, { Suspense } from 'react';
import { RenderError } from './RenderError';
import { stepComponentMap } from './steps';
import { CurrentStepProps } from './types';

interface CurrentStepRendererProps extends CurrentStepProps {
    responsesData?: any[];
}

const CurrentStepRenderer: React.FC<CurrentStepRendererProps> = ({
    stepType,
    stepConfig,
    savedResponse,
    onStepComplete,
    responsesData = [],
    ...restOfStepProps
}) => {
    if (stepType === 'single_choice' || stepType === 'cognitive_single_choice') {
        console.log('[DEBUG CurrentStepRenderer] stepConfig para single_choice:', stepConfig);
    }
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

    let demographicResponseId = undefined;
    if (stepType === 'demographic' && responsesData && Array.isArray(responsesData)) {
        const found = responsesData.find((r) => r && typeof r === 'object' && (r.stepType === 'demographic' || r.type === 'demographic') && 'response' in r);
        if (found && typeof found.response === 'object') {
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

    const responsesDataAny: any[] = Array.isArray(responsesData) ? responsesData : [];

    // Eliminar bloque de debug y lógica especial para 'long_text'

    // 1. DemographicsForm y Preferencias: lógica robusta específica
    if (stepType === 'demographic') {
        if (!responsesData || !Array.isArray(responsesData)) {
            return <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">Cargando datos demográficos...</div>;
        }
        // Buscar el objeto completo con campo 'response' en responsesData
        let demographicObj = undefined;
        if (responsesData && Array.isArray(responsesData)) {
            demographicObj = responsesData.find(
                (r) =>
                    (r.stepType === 'demographic' || r.type === 'demographic') &&
                    r.response !== undefined
            );
        }
        // Extracción robusta de respuesta previa
        let initialValues = {};
        if (demographicObj && typeof demographicObj === 'object' && 'response' in demographicObj) {
            initialValues = demographicObj.response;
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
            savedResponse: demographicObj || savedResponse || initialValues,
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

    if (stepType === 'cognitive_preference_test' || stepType === 'preference_test') {
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

    // 2. Formularios genéricos: lógica robusta para savedResponses en config
    const stepTypesWithSavedResponses = [
        'cognitive_short_text',
        'cognitive_long_text',
        'cognitive_single_choice',
        'cognitive_multiple_choice',
        'cognitive_linear_scale',
        'cognitive_ranking',
        'smartvoc_feedback',
        'feedback',
        'image_feedback',
        'multiple_choice',
        'single_choice',
        'short_text',
        'ranking',
        'linear_scale',
    ];

    if (stepTypesWithSavedResponses.includes(stepType)) {
        // Buscar respuesta previa en responsesData
        let savedResponses = undefined;
        const dataArray = responsesDataAny;

        console.log(`[CurrentStepRenderer] 🔍 Buscando respuesta previa para stepType: ${stepType}`);
        console.log(`[CurrentStepRenderer] 🔍 stepConfig.id: ${(stepConfig as any)?.id}`);
        console.log(`[CurrentStepRenderer] 🔍 dataArray length: ${dataArray.length}`);
        // console.log(`[CurrentStepRenderer] 🔍 dataArray:`, dataArray);

        if (dataArray.length > 0) {
            // Buscar primero por id exacto
            let foundById;
            if (stepConfig && (stepConfig as any).id) {
                foundById = (dataArray as any[]).find((r: any) => {
                    const match = r.id === (stepConfig as any).id && r.response !== undefined;
                    // console.log(`[CurrentStepRenderer] 🔍 Comparando r.id: ${r.id} con stepConfig.id: ${(stepConfig as any).id} - match: ${match}`);
                    return match;
                });
            }
            if (foundById) {
                console.log(`[CurrentStepRenderer] ✅ Encontrado por ID:`, foundById);
                savedResponses = foundById.response;
            }

            // Si no se encontró por ID, buscar por stepType y stepTitle
            if (!savedResponses && stepConfig) {
                const stepTitle = (stepConfig as any)?.title || (stepConfig as any)?.name;
                console.log(`[CurrentStepRenderer] 🔍 Buscando por stepType: ${stepType} y stepTitle: ${stepTitle}`);

                const foundByTypeAndTitle = (dataArray as any[]).find((r: any) => {
                    const typeMatch = r.stepType === stepType;
                    const titleMatch = r.stepTitle === stepTitle;
                    const hasResponse = r.response !== undefined;
                    const match = typeMatch && titleMatch && hasResponse;
                    // console.log(`[CurrentStepRenderer] 🔍 Comparando r.stepType: ${r.stepType}, r.stepTitle: ${r.stepTitle} con stepType: ${stepType}, stepTitle: ${stepTitle} - match: ${match}`);
                    return match;
                });

                if (foundByTypeAndTitle) {
                    console.log(`[CurrentStepRenderer] ✅ Encontrado por stepType y stepTitle:`, foundByTypeAndTitle);
                    savedResponses = foundByTypeAndTitle.response;
                }
            }

            // Buscar por stepType exacto si no se encontró por id
            let foundByStepType;
            if (!savedResponses && stepType === 'cognitive_long_text') {
                foundByStepType = (dataArray as any[]).find((r: any) => {
                    return r.stepType === 'cognitive_long_text' && r.response !== undefined;
                });
                if (foundByStepType) {
                    savedResponses = foundByStepType.response;
                }
            }
            // Si sigue sin encontrarse, tomar la última respuesta de tipo cognitive_long_text
            if (!savedResponses) {
                const allLongTextResponses = (dataArray as any[]).filter((r: any) => r.stepType === 'cognitive_long_text' && r.response !== undefined);
                if (allLongTextResponses.length > 0) {
                    // Tomar la más reciente por createdAt
                    allLongTextResponses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    savedResponses = allLongTextResponses[0].response;
                }
            }
        }

        console.log(`[CurrentStepRenderer] 🔍 savedResponses encontrado:`, savedResponses);

        // Inyectar savedResponses en el config del paso
        const configWithSaved = {
            ...(stepConfig || {}),
            savedResponses,
        };
        // Filtrar onLoginSuccess y onError para evitar conflicto de tipos
        const { onLoginSuccess, onError, ...safeStepProps } = restOfStepProps;
        return (
            <ComponentToRender
                {...safeStepProps}
                stepType={stepType}
                stepConfig={configWithSaved}
                savedResponse={savedResponses}
                onStepComplete={onStepComplete}
                {...mappedProps}
            />
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
