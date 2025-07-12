import React, { Suspense } from 'react';
import { useParticipantStore } from '../../stores/participantStore';
import { QuestionType } from '../../types/question-types.enum';
import { RenderError } from './RenderError';
import { stepComponentMap } from './steps';
import { CurrentStepProps } from './types';

interface CurrentStepRendererProps extends CurrentStepProps {
    responsesData?: any[];
    questionKey?: string; // NUEVO: questionKey para identificación única de preguntas
}

const CurrentStepRenderer: React.FC<CurrentStepRendererProps> = ({
    stepType,
    stepConfig,
    savedResponse,
    onStepComplete,
    responsesData = [],
    questionKey, // NUEVO: questionKey como identificador principal
    ...restOfStepProps
}) => {
    // NUEVO: Obtener acceso al diccionario global
    const getQuestionByKey = useParticipantStore(state => state.getQuestionByKey);

    // NUEVO: Obtener la pregunta desde el diccionario global usando questionKey
    const questionData = questionKey ? getQuestionByKey(questionKey) : null;

    // NUEVO: Logs de advertencia solo para questionKeys críticos
    if (questionKey && !questionData) {
        // Solo mostrar warning para questionKeys que no sean fallbacks o temporales
        if (!questionKey.includes('unknown_') && !questionKey.includes('temp_') && !questionKey.includes('debug_')) {
            console.warn(`[CurrentStepRenderer] ⚠️ questionKey no encontrado en diccionario global: ${questionKey}`);
            console.warn(`[CurrentStepRenderer] ⚠️ stepType: ${stepType}, stepId: ${restOfStepProps.stepId}`);
        }
    }

    // NUEVO: Determinar el componente a renderizar usando ENUM QuestionType
    let ComponentToRender = null;
    let renderComponentName = '';

    // Intentar mapear usando el ENUM QuestionType primero
    if (questionKey) {
        // Buscar en el ENUM si el questionKey coincide con algún valor
        const enumValues = Object.values(QuestionType);
        const matchingEnumValue = enumValues.find(value => questionKey.includes(value as string));

        if (matchingEnumValue) {
            renderComponentName = matchingEnumValue as string;
            ComponentToRender = stepComponentMap[matchingEnumValue as string];

        }
    }

    // FALLBACK: Si no se encontró por ENUM, usar questionData.renderComponent
    if (!ComponentToRender && questionData && questionData.renderComponent) {
        renderComponentName = questionData.renderComponent;
        ComponentToRender = stepComponentMap[renderComponentName] || stepComponentMap[questionData.type];
    }

    // FALLBACK FINAL: Si no hay questionData o renderComponent, usar stepType (para compatibilidad)
    if (!ComponentToRender) {
        ComponentToRender = stepComponentMap[stepType];
    }

    if (typeof ComponentToRender === "undefined" || !ComponentToRender) {
        const errorMessage = questionKey
            ? `Tipo de paso no encontrado para questionKey: ${questionKey} (stepType: ${stepType})`
            : `Tipo de paso no encontrado: ${stepType}`;
        console.error(`[CurrentStepRenderer] ❌ ${errorMessage}`);
        return <RenderError message={errorMessage} />;
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
        // Buscar respuesta previa en responsesData para smartvoc
        let smartvocSavedResponse = undefined;
        if (responsesData && Array.isArray(responsesData)) {
            const stepTitle = config.title || config.description || config.questionText;
            const found = responsesData.find((r: any) => {
                const typeMatch = r.stepType === stepType;
                const titleMatch = r.stepTitle === stepTitle;
                const hasResponse = r.response !== undefined;
                return typeMatch && titleMatch && hasResponse;
            });
            if (found) {
                smartvocSavedResponse = found.response;
            }
        }
        mappedProps = {
            questionText: config.title || config.description || config.questionText,
            instructions: config.instructions,
            companyName: config.config?.companyName,
            config: config.config,
            stepId: config.id,
            stepName: config.title || config.description,
            required: config.required,
            savedResponse: smartvocSavedResponse || finalSavedResponse,
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
        if (preferenceSavedResponse && typeof preferenceSavedResponse === 'object') {
            initialValues = preferenceSavedResponse;
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
        'cognitive_navigation_flow', // NUEVO: Agregar navigation flow
        'cognitive_preference_test', // NUEVO: Agregar preference test
        'preference_test', // NUEVO: Agregar preference test
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
        let savedResponses = undefined;
        const dataArray = responsesDataAny;

        if (dataArray.length > 0) {
            let foundById;
            if (stepConfig && (stepConfig as any).id) {
                foundById = (dataArray as any[]).find((r: any) => {
                    const match = r.id === (stepConfig as any).id && r.response !== undefined;
                    return match;
                });
            }
            if (foundById) {
                savedResponses = foundById.response;
            }

            // NUEVO: Buscar por questionKey si no se encontró por id
            if (!foundById && questionKey) {
                const foundByQuestionKey = (dataArray as any[]).find((r: any) => {
                    return r.questionKey === questionKey && r.response !== undefined;
                });
                if (foundByQuestionKey) {
                    savedResponses = foundByQuestionKey.response;
                }
            }

            // Si sigue sin encontrarse, buscar por stepType y stepTitle
            if (!foundById && !savedResponses) {
                const stepTitle = (stepConfig as any)?.title || (stepConfig as any)?.questionText;
                const found = (dataArray as any[]).find((r: any) => {
                    const typeMatch = r.stepType === stepType;
                    const titleMatch = r.stepTitle === stepTitle;
                    const hasResponse = r.response !== undefined;
                    return typeMatch && titleMatch && hasResponse;
                });
                if (found) {
                    savedResponses = found.response;
                }
            }

            // Si sigue sin encontrarse, tomar la última respuesta de tipo cognitive_long_text
            if (!savedResponses) {
                const allLongTextResponses = (dataArray as any[]).filter((r: any) => r.stepType === 'cognitive_long_text' && r.response !== undefined);
                if (allLongTextResponses.length > 0) {
                    allLongTextResponses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    savedResponses = allLongTextResponses[0].response;
                }
            }
        }

        const configWithSaved = {
            ...(stepConfig || {}),
            savedResponses,
        };

        const { onLoginSuccess, onError, ...safeStepProps } = restOfStepProps;
        return (
            <ComponentToRender
                {...safeStepProps}
                stepType={stepType}
                stepConfig={configWithSaved}
                savedResponse={savedResponses}
                onStepComplete={onStepComplete}
                questionKey={(stepConfig && (stepConfig as any).questionKey) || questionKey}
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
            <ComponentToRender {...finalProps as any} questionKey={(stepConfig && (stepConfig as any).questionKey) || questionKey} />
        </Suspense>
    );
};

export default CurrentStepRenderer;
