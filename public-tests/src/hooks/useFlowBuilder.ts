import { useCallback, useMemo } from 'react';
import { ExpandedStep } from '../types/flow'; 
import { smartVOCTypeMap } from './utils'; 
import { UseFlowBuilderProps } from './types';
import { ProcessedResearchFormConfig } from './useResearchForms';

const extractCoreStepConfigs = (flowDataModules: ProcessedResearchFormConfig[] | undefined) => {
    let demographicsQuestions: any = null;
    let welcomeConfig: any = null;
    let thankyouConfig: any = null;

    if (Array.isArray(flowDataModules)) {
        for (const processedModule of flowDataModules) {
            const moduleData = processedModule.config;
            if (!moduleData) continue;

            const moduleSK = moduleData.sk;
            switch (moduleSK) {
                case 'EYE_TRACKING_CONFIG':
                    if (moduleData.demographicQuestions) {
                        demographicsQuestions = {
                            questions: moduleData.demographicQuestions,
                            title: moduleData.title,
                            description: moduleData.description
                        };
                    }
                    break;
                case 'WELCOME_SCREEN':
                    welcomeConfig = { ...moduleData };
                    break;
                case 'THANK_YOU_SCREEN':
                    thankyouConfig = { ...moduleData };
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
            } else {
                console.warn(`[useFlowBuilder processSmartVocQuestions] No mapeado: tipo "${upperQuestionType}" (Q ID ${question.id})`);
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
            } else {
                console.warn(`[useFlowBuilder processCognitiveTaskQuestions] No se pudo generar frontendType para tipo: "${originalQuestionType}" (Q ID ${question.id})`);
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
            console.warn('[useFlowBuilder] No hay flowDataModules válidos para construir pasos.');
            return [
                { id: 'welcome', name: 'Bienvenida', type: 'welcome', config: { title: '¡Bienvenido!', message: 'Iniciando...'} },
                { id: 'thankyou', name: 'Agradecimiento', type: 'thankyou', config: { title: '¡Muchas Gracias!', message: 'Fin.'} }
            ];
        }
        
        const finalSteps: ExpandedStep[] = [];
        const { 
            demographicsQuestions: demographicsConfigFromBackend,
            welcomeConfig: welcomeConfigFromBackend, 
            thankyouConfig: thankyouConfigFromBackend 
        } = extractCoreStepConfigs(flowDataModules);

        if (demographicsConfigFromBackend && demographicsConfigFromBackend.questions) {
            finalSteps.push({
                id: 'demographic',
                name: demographicsConfigFromBackend.title || 'Preguntas Demográficas',
                type: 'demographic',
                config: { 
                    title: demographicsConfigFromBackend.title || 'Preguntas Demográficas',
                    description: demographicsConfigFromBackend.description || 'Por favor, complete lo siguiente:',
                    demographicsConfig: demographicsConfigFromBackend 
                }
            });
        } else {
            console.warn('[useFlowBuilder] No se encontró configuración demográfica en el backend (EYE_TRACKING_CONFIG.demographicQuestions). No se añadirá el paso demográfico.');
        }

        const resolvedWelcomeConfig = welcomeConfigFromBackend || { title: 'Bienvenida', message: 'Gracias por participar.' };
        finalSteps.push({ 
            id: 'welcome', 
            name: resolvedWelcomeConfig.title, 
            type: 'welcome', 
            config: resolvedWelcomeConfig 
        });
        
        for (const processedModule of flowDataModules) {
            const moduleData = processedModule.config;
            if (!moduleData) continue;

            const moduleSK = moduleData.sk;
            const moduleSpecificQuestions = moduleData.questions || [];
            const moduleTitleFromBackend = moduleData.title || moduleData.name;

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

        const resolvedThankYouConfig = thankyouConfigFromBackend || { title: 'Fin', message: 'Gracias por completar el estudio.' };
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