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
    // Log específico para LongText al inicio
    if (stepType === 'long_text') {
        console.log('🚀 [DEBUG LongText] CurrentStepRenderer iniciado:', {
            stepType,
            responsesData,
            responsesDataLength: responsesData?.length,
            responsesDataType: typeof responsesData,
            isArray: Array.isArray(responsesData)
        });
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

    // Log específico para LongText después de la verificación
    if (stepType === 'long_text') {
        console.log('🔍 [DEBUG LongText] Después de verificación de array:', {
            originalResponsesData: responsesData,
            responsesDataAny,
            responsesDataAnyLength: responsesDataAny.length
        });
    }

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
        'long_text',
        'short_text',
        'ranking',
        'linear_scale',
    ];

    if (stepTypesWithSavedResponses.includes(stepType)) {
        // Componente de debug temporal para LongText
        if (stepType === 'long_text') {
            return (
                <div className="bg-red-100 p-4 rounded-lg border-2 border-red-500">
                    <h3 className="text-red-800 font-bold mb-2">🔍 DEBUG LongText</h3>
                    <div className="text-sm text-red-700">
                        <p><strong>stepType:</strong> {stepType}</p>
                        <p><strong>responsesData:</strong> {JSON.stringify(responsesData, null, 2)}</p>
                        <p><strong>stepConfig:</strong> {JSON.stringify(stepConfig, null, 2)}</p>
                        <p><strong>savedResponse:</strong> {JSON.stringify(savedResponse, null, 2)}</p>
                        <p><strong>responsesDataAny:</strong> {JSON.stringify(responsesDataAny, null, 2)}</p>
                        <p><strong>Array.isArray(responsesData):</strong> {Array.isArray(responsesData).toString()}</p>
                        <p><strong>responsesData.length:</strong> {responsesData?.length || 'undefined'}</p>
                    </div>
                    <button
                        onClick={() => onStepComplete?.('test')}
                        className="mt-2 bg-red-600 text-white px-4 py-2 rounded"
                    >
                        Continuar (Test)
                    </button>
                </div>
            );
        }
        // Buscar respuesta previa en responsesData
        let savedResponses = undefined;
        const dataArray = responsesDataAny;

        // Log específico para LongText
        if (stepType === 'long_text') {
            console.log('🔍 [DEBUG LongText] Buscando respuesta previa:', {
                stepType,
                dataArrayLength: dataArray.length,
                dataArray: dataArray,
                stepConfig: stepConfig,
                stepConfigTitle: (stepConfig as any)?.title,
                stepConfigQuestionText: (stepConfig as any)?.questionText
            });
        }

        if (dataArray.length > 0) {
            // Para LongText, buscar primero por stepType exacto
            if (stepType === 'long_text') {
                const foundByStepType = (dataArray as any[]).find((r: any) => {
                    const exactMatch = r.stepType === 'long_text' && r.response !== undefined;
                    console.log('🔍 [DEBUG LongText] Búsqueda por stepType exacto:', {
                        r_stepType: r.stepType,
                        r_response: r.response,
                        exactMatch
                    });
                    return exactMatch;
                });

                if (foundByStepType) {
                    console.log('✅ [DEBUG LongText] Encontrado por stepType exacto:', foundByStepType);
                    savedResponses = foundByStepType.response;
                }
            }

            // Si no se encontró por stepType exacto, usar la lógica flexible
            if (!savedResponses) {
                const found = (dataArray as any[]).find((r: any) => {
                    // Coincidencia flexible: stepType, type, title, questionText, stepTitle
                    const matchesType = r.stepType === stepType || r.type === stepType;
                    const matchesTitle = typeof r["title"] === "string" && stepConfig && (r["title"] === (stepConfig as any)["title"] || r["title"] === (stepConfig as any)["questionText"]);
                    const matchesQuestionText = typeof r["questionText"] === "string" && stepConfig && (r["questionText"] === (stepConfig as any)["title"] || r["questionText"] === (stepConfig as any)["questionText"]);
                    const matchesStepTitle = typeof r["stepTitle"] === "string" && stepConfig && (r["stepTitle"] === (stepConfig as any)["title"] || r["stepTitle"] === (stepConfig as any)["questionText"] || r["stepTitle"] === (stepConfig as any)["stepTitle"]);

                    // Log específico para LongText
                    if (stepType === 'long_text') {
                        console.log('🔍 [DEBUG LongText] Evaluando respuesta (lógica flexible):', {
                            r_stepType: r.stepType,
                            r_type: r.type,
                            r_title: r.title,
                            r_questionText: r.questionText,
                            r_stepTitle: r.stepTitle,
                            r_response: r.response,
                            stepType,
                            stepConfigTitle: (stepConfig as any)?.title,
                            stepConfigQuestionText: (stepConfig as any)?.questionText,
                            stepConfigStepTitle: (stepConfig as any)?.stepTitle,
                            matchesType,
                            matchesTitle,
                            matchesQuestionText,
                            matchesStepTitle,
                            finalMatch: (matchesType || matchesTitle || matchesQuestionText || matchesStepTitle) && r.response !== undefined
                        });
                    }

                    return (matchesType || matchesTitle || matchesQuestionText || matchesStepTitle) && r.response !== undefined;
                });

                // Log específico para LongText
                if (stepType === 'long_text') {
                    console.log('🔍 [DEBUG LongText] Respuesta encontrada (lógica flexible):', found);
                }

                if (found && found.response !== undefined) {
                    // Extraer string real si la respuesta es un objeto con campo 'value'
                    if (typeof found.response === 'object' && found.response !== null && 'value' in found.response) {
                        savedResponses = found.response.value;
                    } else {
                        savedResponses = found.response;
                    }

                    // Log específico para LongText
                    if (stepType === 'long_text') {
                        console.log('✅ [DEBUG LongText] Respuesta extraída (lógica flexible):', savedResponses);
                    }
                }
            }
        } else if (savedResponse !== undefined) {
            savedResponses = savedResponse;
        }

        // Log específico para LongText
        if (stepType === 'long_text') {
            console.log('🔍 [DEBUG LongText] savedResponses final:', savedResponses);
        }

        // Inyectar savedResponses en el config del paso
        const configWithSaved = {
            ...(stepConfig || {}),
            savedResponses,
        };
        const finalProps = {
            ...restOfStepProps,
            stepType,
            stepConfig: configWithSaved,
            config: configWithSaved,
            savedResponse: savedResponses,
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
