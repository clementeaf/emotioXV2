import { useCallback, useMemo } from 'react';
import { ExpandedStep } from '../types/flow'; 
import { smartVOCTypeMap } from './utils'; 
import { UseFlowBuilderProps } from './types';
import { ProcessedResearchFormConfig } from './useResearchForms';

const extractCoreStepConfigs = (flowDataModules: ProcessedResearchFormConfig[]) => {
    
    let demographicsQuestions: unknown = null;
    let welcomeConfig: unknown = null;
    let thankyouConfig: unknown = null;

    for (const processedModule of flowDataModules) {
        
        const moduleData = processedModule.config;
        if (!moduleData) {
            continue;
        }

        const moduleSK = (moduleData as { sk?: string }).sk;
        
        switch (moduleSK) {
            case 'EYE_TRACKING_CONFIG':
                
                if ('demographicQuestions' in moduleData && (moduleData as { demographicQuestions?: unknown }).demographicQuestions) {
                    const demoQuestionsFromApi = (moduleData as { demographicQuestions?: unknown }).demographicQuestions;
                    
                    // Verificar que existe y es un objeto
                    if (demoQuestionsFromApi && typeof demoQuestionsFromApi === 'object' && demoQuestionsFromApi !== null) {
                        // Verificar si hay al menos una pregunta habilitada
                        const hasEnabledQuestions = Object.values(demoQuestionsFromApi).some((question: unknown) => {
                            return question && typeof question === 'object' && question !== null && 
                                   'enabled' in question && (question as { enabled?: boolean }).enabled === true;
                        });
                        
                        if (hasEnabledQuestions) {
                            demographicsQuestions = {
                                questions: demoQuestionsFromApi,
                                title: (moduleData as { title?: string }).title || 'Preguntas Demográficas',
                                description: (moduleData as { description?: string }).description || 'Por favor, complete las siguientes preguntas:'
                            };
                            console.log('[extractCoreStepConfigs] ✅ Configuración demográfica encontrada con preguntas habilitadas');
                        } else {
                            console.warn('[extractCoreStepConfigs] Configuración demográfica encontrada pero ninguna pregunta está habilitada');
                        }
                    }
                }
                break;
            case 'WELCOME_SCREEN':
                welcomeConfig = { ...(moduleData as object) };
                break;
            case 'THANK_YOU_SCREEN':
                thankyouConfig = { ...(moduleData as object) };
                break;
            default:
                break;
        }
    }
    
    return { demographicsQuestions, welcomeConfig, thankyouConfig };
};

const processSmartVocQuestions = (
    moduleSpecificQuestions: unknown[],
    _moduleTitleFromBackend: string | undefined,
    parentModuleResponseKey: string
): ExpandedStep[] => {
    const steps: ExpandedStep[] = [];
    if (Array.isArray(moduleSpecificQuestions) && moduleSpecificQuestions.length > 0) {
        for (const question of moduleSpecificQuestions) {
            if (typeof question !== 'object' || question === null) continue;
            const q = question as { id?: string; title?: string; type?: string };
            const originalQuestionType = q.type;
            const upperQuestionType = typeof originalQuestionType === 'string' ? originalQuestionType.toUpperCase() : undefined;
            const frontendType = upperQuestionType && smartVOCTypeMap[upperQuestionType] ? smartVOCTypeMap[upperQuestionType] : undefined;
            
            if (frontendType) {
                steps.push({
                    id: q.id || `${frontendType}_${steps.length + Date.now()}`,
                    name: q.title || `Feedback: ${originalQuestionType || 'Desconocido'}`,
                    type: frontendType,
                    config: question,
                    responseKey: parentModuleResponseKey
                });
            } else {
                console.warn(`[useFlowBuilder processSmartVocQuestions] No mapeado: tipo "${upperQuestionType}" (Q ID ${q.id})`);
            }
        }
    }
    return steps;
};

const processCognitiveTaskQuestions = (
    moduleSpecificQuestions: unknown[],
    moduleTitleFromBackend: string | undefined,
    parentModuleResponseKey: string
): ExpandedStep[] => {
    const steps: ExpandedStep[] = [];
    if (Array.isArray(moduleSpecificQuestions) && moduleSpecificQuestions.length > 0) {
        for (const question of moduleSpecificQuestions) {
            if (typeof question !== 'object' || question === null) continue;
            const q = question as { id?: string; title?: string; type?: string };
            const originalQuestionType = q.type;
            const frontendType = typeof originalQuestionType === 'string' ? `cognitive_${originalQuestionType.toLowerCase()}` : undefined;
            if (frontendType) {
                steps.push({
                    id: q.id || `${frontendType}_${steps.length + Date.now()}`,
                    name: q.title || `${moduleTitleFromBackend || 'Tarea Cognitiva'}: ${originalQuestionType || 'Desconocido'}`,
                    type: frontendType,
                    config: question,
                    responseKey: parentModuleResponseKey
                });
            } else {
                console.warn(`[useFlowBuilder processCognitiveTaskQuestions] No se pudo generar frontendType para tipo: "${originalQuestionType}" (Q ID ${q.id})`);
            }
        }
    }
    return steps;
};

const processDefaultModuleQuestions = (
    moduleSpecificQuestions: unknown[],
    moduleTitleFromBackend: string | undefined,
    moduleSK: string | undefined,
    parentModuleResponseKey: string
): ExpandedStep[] => {
    const steps: ExpandedStep[] = [];
    if (Array.isArray(moduleSpecificQuestions) && moduleSpecificQuestions.length > 0) {
        for (const question of moduleSpecificQuestions) {
            if (typeof question !== 'object' || question === null) continue;
            const q = question as { id?: string; title?: string; type?: string };
            const originalQuestionType = q.type;
            const frontendType = moduleSK && typeof originalQuestionType === 'string' ? `${moduleSK.toLowerCase()}_${originalQuestionType.toLowerCase()}` : `unknown_${typeof originalQuestionType === 'string' ? originalQuestionType.toLowerCase() : 'question'}`;
            steps.push({
                id: q.id || `${frontendType}_${steps.length + Date.now()}`,
                name: q.title || `${moduleTitleFromBackend || moduleSK || 'Módulo Desconocido'}: ${originalQuestionType || 'Pregunta'}`,
                type: frontendType,
                config: question,
                responseKey: parentModuleResponseKey
            });
        }
    }
    return steps;
};

export const useFlowBuilder = ({ researchFlowApiData, isLoading }: UseFlowBuilderProps & { isLoading?: boolean }): ExpandedStep[] => {
    
    const buildStepsInternal = useCallback(() => {
        
        console.log('[useFlowBuilder] DEBUG - researchFlowApiData:', researchFlowApiData);
        console.log('[useFlowBuilder] DEBUG - isLoading:', isLoading);
        
        const flowDataModules =
            researchFlowApiData && typeof researchFlowApiData === 'object' && researchFlowApiData !== null && 'data' in researchFlowApiData
                ? (researchFlowApiData as { data: unknown }).data
                : undefined;

        console.log('[useFlowBuilder] DEBUG - flowDataModules:', flowDataModules);
        console.log('[useFlowBuilder] DEBUG - Array.isArray(flowDataModules):', Array.isArray(flowDataModules));
        console.log('[useFlowBuilder] DEBUG - flowDataModules.length:', Array.isArray(flowDataModules) ? flowDataModules.length : 'N/A');
        
        // Debug adicional para ver el contenido de los módulos
        if (Array.isArray(flowDataModules)) {
            flowDataModules.forEach((module, index) => {
                console.log(`[useFlowBuilder] DEBUG - Módulo ${index}:`, {
                    id: module.id,
                    originalSk: module.originalSk,
                    config: module.config,
                    hasEyeTrackingConfig: module.originalSk === 'EYE_TRACKING_CONFIG',
                    hasDemographicQuestions: module.config && 'demographicQuestions' in module.config
                });
            });
        }

        if (!isLoading && !(Array.isArray(flowDataModules) && flowDataModules.length > 0)) {
            console.warn('[useFlowBuilder] No hay flowDataModules válidos para construir pasos.');
            console.warn('[useFlowBuilder] DEBUG - Razón: isLoading =', isLoading, ', Array.isArray =', Array.isArray(flowDataModules), ', length =', Array.isArray(flowDataModules) ? flowDataModules.length : 'N/A');
            return [
                { id: 'welcome', name: 'Bienvenida', type: 'welcome', config: { title: '¡Bienvenido!', message: 'Iniciando...'}, responseKey: 'welcome' },
                { id: 'thankyou', name: 'Agradecimiento', type: 'thankyou', config: { title: '¡Muchas Gracias!', message: 'Fin.'}, responseKey: 'thankyou' }
            ];
        }
        
        // Solo llamar extractCoreStepConfigs cuando los datos estén válidos
        if (!Array.isArray(flowDataModules) || flowDataModules.length === 0) {
            return [
                { id: 'welcome', name: 'Bienvenida', type: 'welcome', config: { title: '¡Bienvenido!', message: 'Iniciando...'}, responseKey: 'welcome' },
                { id: 'thankyou', name: 'Agradecimiento', type: 'thankyou', config: { title: '¡Muchas Gracias!', message: 'Fin.'}, responseKey: 'thankyou' }
            ];
        }
        
        const finalSteps: ExpandedStep[] = [];
        const { 
            demographicsQuestions: demographicsConfigFromBackend,
            welcomeConfig: welcomeConfigFromBackend, 
            thankyouConfig: thankyouConfigFromBackend 
        } = extractCoreStepConfigs(flowDataModules as ProcessedResearchFormConfig[]);

        if (demographicsConfigFromBackend && typeof demographicsConfigFromBackend === 'object' && demographicsConfigFromBackend !== null && 'questions' in demographicsConfigFromBackend) {
            const demoConfig = demographicsConfigFromBackend as { questions?: unknown; title?: string; description?: string };
            finalSteps.push({
                id: 'demographic',
                name: 'title' in demoConfig && typeof demoConfig.title === 'string' ? demoConfig.title : 'Preguntas Demográficas',
                type: 'demographic',
                config: { 
                    title: 'title' in demoConfig && typeof demoConfig.title === 'string' ? demoConfig.title : 'Preguntas Demográficas',
                    description: 'description' in demoConfig && typeof demoConfig.description === 'string' ? demoConfig.description : 'Por favor, complete lo siguiente:',
                    demographicsConfig: demoConfig 
                },
                responseKey: 'demographic'
            });
        } else {
            console.warn('[useFlowBuilder] No se encontró configuración demográfica en el backend (EYE_TRACKING_CONFIG.demographicQuestions). No se añadirá el paso demográfico.');
            console.info('[useFlowBuilder] 💡 Para mostrar preguntas demográficas: Ve al panel de administración > Eye Tracking > Recruit, y habilita las preguntas demográficas que desees incluir.');
            
            // Temporal: En modo desarrollo, crear preguntas de prueba
            if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
                console.info('[useFlowBuilder] 🧪 Modo desarrollo detectado: Creando paso demográfico de prueba');
                const developmentDemoConfig = {
                    questions: {
                        age: { enabled: true, required: true, options: ['18-24', '25-34', '35-44', '45-54', '55+'] },
                        gender: { enabled: true, required: true, options: ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'] },
                        educationLevel: { enabled: true, required: false, options: ['Primaria', 'Secundaria', 'Universitaria', 'Posgrado'] }
                    },
                    title: 'Preguntas Demográficas (Modo Desarrollo)',
                    description: 'Estas son preguntas de prueba para desarrollo. En producción, configúralas en el panel de administración.'
                };
                
                finalSteps.push({
                    id: 'demographic',
                    name: developmentDemoConfig.title,
                    type: 'demographic',
                    config: { 
                        title: developmentDemoConfig.title,
                        description: developmentDemoConfig.description,
                        demographicsConfig: developmentDemoConfig 
                    },
                    responseKey: 'demographic'
                });
            }
        }

        const resolvedWelcomeConfig = (welcomeConfigFromBackend && typeof welcomeConfigFromBackend === 'object' && welcomeConfigFromBackend !== null && 'title' in welcomeConfigFromBackend)
            ? welcomeConfigFromBackend as { title?: string; message?: string }
            : { title: 'Bienvenida', message: 'Gracias por participar.' };
        finalSteps.push({ 
            id: 'welcome', 
            name: 'title' in resolvedWelcomeConfig && typeof resolvedWelcomeConfig.title === 'string' ? resolvedWelcomeConfig.title : 'Bienvenida', 
            type: 'welcome', 
            config: resolvedWelcomeConfig,
            responseKey: 'welcome'
        });
        
        // Iterar sobre los módulos para crear los pasos
        for (const processedModule of flowDataModules) {
            const moduleData = processedModule.config;
            if (!moduleData) continue;

            const moduleSK = moduleData.sk;
            const moduleSpecificQuestions = moduleData.questions || [];
            const moduleTitleFromBackend = moduleData.title || moduleData.name;
            const moduleResponseKey = processedModule.id;

            switch (moduleSK) {
                case 'EYE_TRACKING_CONFIG':
                case 'WELCOME_SCREEN':     
                case 'THANK_YOU_SCREEN':
                    break;
                case 'SMART_VOC_FORM':
                    finalSteps.push(...processSmartVocQuestions(moduleSpecificQuestions, moduleTitleFromBackend, moduleResponseKey));
                    break;
                case 'COGNITIVE_TASK':
                    finalSteps.push(...processCognitiveTaskQuestions(moduleSpecificQuestions, moduleTitleFromBackend, moduleResponseKey));
                    break;
                default:
                    finalSteps.push(...processDefaultModuleQuestions(moduleSpecificQuestions, moduleTitleFromBackend, moduleSK, moduleResponseKey));
                    break;
            }
        }

        const resolvedThankYouConfig = (thankyouConfigFromBackend && typeof thankyouConfigFromBackend === 'object' && thankyouConfigFromBackend !== null && 'title' in thankyouConfigFromBackend)
            ? thankyouConfigFromBackend as { title?: string; message?: string }
            : { title: 'Fin', message: 'Gracias por completar el estudio.' };
        finalSteps.push({ 
            id: 'thankyou', 
            name: 'title' in resolvedThankYouConfig && typeof resolvedThankYouConfig.title === 'string' ? resolvedThankYouConfig.title : 'Fin', 
            type: 'thankyou', 
            config: resolvedThankYouConfig,
            responseKey: 'thankyou'
        });

        return finalSteps;
    }, [researchFlowApiData, isLoading]);

    const expandedSteps = useMemo(() => buildStepsInternal(), [buildStepsInternal]);

    return expandedSteps;
}; 