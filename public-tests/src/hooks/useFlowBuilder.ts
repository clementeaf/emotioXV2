import { useCallback, useMemo } from 'react';
import { ExpandedStep } from '../types/flow'; 
import { DEFAULT_DEMOGRAPHICS_CONFIG } from '../types/demographics'; 
import { smartVOCTypeMap } from './utils'; 
import { UseFlowBuilderProps } from './types';

const extractCoreStepConfigs = (flowDataModules: any[] | undefined) => {
    let demographicsQuestions: any = null;
    let welcomeConfig: any = null;
    let thankyouConfig: any = null;

    if (Array.isArray(flowDataModules)) {
        for (const module of flowDataModules) {
            const moduleSK = module?.sk;
            switch (moduleSK) {
                case 'EYE_TRACKING_CONFIG':
                    if (module.demographicQuestions) {
                        demographicsQuestions = module.demographicQuestions;
                    }
                    break;
                case 'WELCOME_SCREEN':
                    welcomeConfig = { ...module };
                    break;
                case 'THANK_YOU_SCREEN':
                    thankyouConfig = { ...module };
                    break;
            }
        }
    }
    return { demographicsQuestions, welcomeConfig, thankyouConfig };
};

const processSmartVocQuestions = (
    moduleSpecificQuestions: any[],
    _moduleTitleFromBackend: string | undefined
): ExpandedStep[] => {
    const steps: ExpandedStep[] = [];
    if (Array.isArray(moduleSpecificQuestions) && moduleSpecificQuestions.length > 0) {
        for (const question of moduleSpecificQuestions) {
            const originalQuestionType = question.type;
            const upperQuestionType = originalQuestionType?.toUpperCase();
            const frontendType = smartVOCTypeMap[upperQuestionType];
            if (frontendType) {
                steps.push({
                    id: question.id || `${frontendType}_${steps.length + Date.now()}`,
                    name: question.title || `Feedback: ${originalQuestionType || 'Desconocido'}`,
                    type: frontendType,
                    config: question
                });
            }
        }
    }
    return steps;
};

const processCognitiveTaskQuestions = (
    moduleSpecificQuestions: any[],
    moduleTitleFromBackend: string | undefined
): ExpandedStep[] => {
    const steps: ExpandedStep[] = [];
    if (Array.isArray(moduleSpecificQuestions) && moduleSpecificQuestions.length > 0) {
        for (const question of moduleSpecificQuestions) {
            const originalQuestionType = question.type;
            const frontendType = originalQuestionType ? `cognitive_${originalQuestionType.toLowerCase()}` : undefined;
            if (frontendType) {
                steps.push({
                    id: question.id || `${frontendType}_${steps.length + Date.now()}`,
                    name: question.title || `${moduleTitleFromBackend || 'Tarea Cognitiva'}: ${originalQuestionType || 'Desconocido'}`,
                    type: frontendType,
                    config: question
                });
            }
        }
    }
    return steps;
};

const processDefaultModuleQuestions = (
    moduleSpecificQuestions: any[],
    moduleTitleFromBackend: string | undefined,
    moduleSK: string | undefined
): ExpandedStep[] => {
    const steps: ExpandedStep[] = [];
    if (Array.isArray(moduleSpecificQuestions) && moduleSpecificQuestions.length > 0) {
        for (const question of moduleSpecificQuestions) {
            const originalQuestionType = question.type;
            const frontendType = moduleSK && originalQuestionType ? `${moduleSK.toLowerCase()}_${originalQuestionType.toLowerCase()}` : `unknown_${originalQuestionType?.toLowerCase() || 'question'}`;
            steps.push({
                id: question.id || `${frontendType}_${steps.length + Date.now()}`,
                name: question.title || `${moduleTitleFromBackend || moduleSK || 'Módulo Desconocido'}: ${originalQuestionType || 'Pregunta'}`,
                type: frontendType,
                config: question
            });
        }
    }
    return steps;
};

export const useFlowBuilder = ({ researchFlowApiData }: UseFlowBuilderProps): ExpandedStep[] => {
    
    const buildStepsInternal = useCallback(() => {
        const flowDataModules = researchFlowApiData?.data;

        if (!(Array.isArray(flowDataModules) && flowDataModules.length > 0)) {
            return [
                { id: 'demographic', name: 'Preguntas demográficas', type: 'demographic', config: { title: 'Preguntas demográficas', description: 'Configuración demográfica por defecto.', demographicsConfig: DEFAULT_DEMOGRAPHICS_CONFIG } },
                { id: 'welcome', name: 'Bienvenida', type: 'welcome', config: { title: '¡Bienvenido!', message: 'Configuración de bienvenida por defecto.'} },
                { id: 'thankyou', name: 'Agradecimiento', type: 'thankyou', config: { title: '¡Muchas Gracias!', message: 'Configuración de agradecimiento por defecto.'} }
            ];
        }
        
        const finalSteps: ExpandedStep[] = [];
        const { 
            demographicsQuestions: demographicsQuestionsFromBackend, 
            welcomeConfig: welcomeConfigFromBackend, 
            thankyouConfig: thankyouConfigFromBackend 
        } = extractCoreStepConfigs(flowDataModules);

        const currentDemographicsQuestions = demographicsQuestionsFromBackend || DEFAULT_DEMOGRAPHICS_CONFIG.questions;
        finalSteps.push({
            id: 'demographic',
            name: (demographicsQuestionsFromBackend as any)?.title || DEFAULT_DEMOGRAPHICS_CONFIG.title || 'Preguntas demográficas',
            type: 'demographic',
            config: {
                title: (demographicsQuestionsFromBackend as any)?.title || DEFAULT_DEMOGRAPHICS_CONFIG.title || 'Preguntas demográficas',
                description: (demographicsQuestionsFromBackend as any)?.description || DEFAULT_DEMOGRAPHICS_CONFIG.description || 'Por favor, responde...',
                demographicsConfig: {
                    ...DEFAULT_DEMOGRAPHICS_CONFIG,
                    questions: currentDemographicsQuestions
                }
            }
        });

        const resolvedWelcomeConfig = welcomeConfigFromBackend || { title: '¡Bienvenido!', message: 'Gracias por tu tiempo.' };
        finalSteps.push({ 
            id: 'welcome', 
            name: resolvedWelcomeConfig.title, 
            type: 'welcome', 
            config: resolvedWelcomeConfig 
        });
        
        for (const module of flowDataModules) {
            const moduleSK = module?.sk;
            const moduleSpecificQuestions = (module as any)?.questions || [];
            const moduleTitleFromBackend = (module as any)?.title || (module as any)?.name;

            switch (moduleSK) {
                case 'EYE_TRACKING_CONFIG':
                case 'WELCOME_SCREEN':
                case 'THANK_YOU_SCREEN':
                    break;
                case 'SMART_VOC_FORM':
                    finalSteps.push(...processSmartVocQuestions(moduleSpecificQuestions, moduleTitleFromBackend));
                    break;
                case 'COGNITIVE_TASK':
                    finalSteps.push(...processCognitiveTaskQuestions(moduleSpecificQuestions, moduleTitleFromBackend));
                    break;
                default:
                    finalSteps.push(...processDefaultModuleQuestions(moduleSpecificQuestions, moduleTitleFromBackend, moduleSK));
                    break;
            }
        }

        const resolvedThankYouConfig = thankyouConfigFromBackend || { title: '¡Muchas Gracias!', message: 'Hemos recibido tus respuestas.' };
        finalSteps.push({ 
            id: 'thankyou', 
            name: resolvedThankYouConfig.title, 
            type: 'thankyou', 
            config: resolvedThankYouConfig 
        });

        return finalSteps;
    }, [researchFlowApiData]);

    const expandedSteps = useMemo(() => buildStepsInternal(), [buildStepsInternal]);

    return expandedSteps;
}; 