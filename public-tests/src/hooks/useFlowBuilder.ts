import { useCallback, useMemo } from 'react';
import { ExpandedStep } from '../types/flow';
import { UseFlowBuilderProps } from './types';
import { ProcessedResearchFormConfig } from './useResearchForms';
import { smartVOCTypeMap } from './utils';

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

                    if (demoQuestionsFromApi && typeof demoQuestionsFromApi === 'object' && demoQuestionsFromApi !== null) {
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
            const q = question as { id?: string; title?: string; type?: string; instructions?: string; questionKey?: string };
            const originalQuestionType = q.type;
            const upperQuestionType = typeof originalQuestionType === 'string' ? originalQuestionType.toUpperCase() : undefined;
            const frontendType = upperQuestionType && smartVOCTypeMap[upperQuestionType] ? smartVOCTypeMap[upperQuestionType] : undefined;
            // SOLO usar el questionKey del backend si existe, nunca generarlo si ya existe
            if (!q.questionKey) {
                console.warn(`[useFlowBuilder] ⚠️ Pregunta sin questionKey del backend. ID: ${q.id}, type: ${q.type}`);
            }
            const questionKey = q.questionKey || q.id || `${frontendType || 'smartvoc'}_${steps.length}`;
            console.log(`[useFlowBuilder] Paso SmartVOC: usando questionKey='${questionKey}' (backend='${q.questionKey}') para pregunta ID='${q.id}'`);
            if (frontendType) {
                steps.push({
                    id: q.id || `${frontendType}_${steps.length}`,
                    name: q.title || `Feedback: ${originalQuestionType || 'Desconocido'}`,
                    type: frontendType,
                    config: question,
                    instructions: q.instructions,
                    responseKey: parentModuleResponseKey,
                    questionKey // SIEMPRE propagar el del backend si existe
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
            const q = question as { id?: string; title?: string; type?: string; instructions?: string; questionKey?: string };
            const originalQuestionType = q.type;
            // NUEVO: Evitar doble prefijo cognitive_
            const frontendType = typeof originalQuestionType === 'string' && originalQuestionType.startsWith('cognitive_')
              ? originalQuestionType
              : typeof originalQuestionType === 'string' ? `cognitive_${originalQuestionType.toLowerCase()}` : undefined;
            if (!q.questionKey) {
                console.warn(`[useFlowBuilder] ⚠️ Pregunta cognitiva sin questionKey del backend. ID: ${q.id}, type: ${q.type}`);
            }
            const questionKey = q.questionKey || q.id || `${frontendType || 'cognitive'}_${steps.length}`;
            console.log(`[useFlowBuilder] Paso Cognitivo: usando questionKey='${questionKey}' (backend='${q.questionKey}') para pregunta ID='${q.id}'`);
            if (frontendType) {
                steps.push({
                    id: q.id || `${frontendType}_${steps.length}`,
                    name: q.title || `${moduleTitleFromBackend || 'Tarea Cognitiva'}: ${originalQuestionType || 'Desconocido'}`,
                    type: frontendType,
                    config: question,
                    instructions: q.instructions,
                    responseKey: parentModuleResponseKey,
                    questionKey // SIEMPRE propagar el del backend si existe
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
            const q = question as { id?: string; title?: string; type?: string; instructions?: string; questionKey?: string };
            const originalQuestionType = q.type;
            const frontendType = moduleSK && typeof originalQuestionType === 'string' ? `${moduleSK.toLowerCase()}_${originalQuestionType.toLowerCase()}` : `unknown_${typeof originalQuestionType === 'string' ? originalQuestionType.toLowerCase() : 'question'}`;
            if (!q.questionKey) {
                console.warn(`[useFlowBuilder] ⚠️ Pregunta default sin questionKey del backend. ID: ${q.id}, type: ${q.type}`);
            }
            const questionKey = q.questionKey || q.id || `${frontendType}_${steps.length}`;
            console.log(`[useFlowBuilder] Paso Default: usando questionKey='${questionKey}' (backend='${q.questionKey}') para pregunta ID='${q.id}'`);
            steps.push({
                id: q.id || `${frontendType}_${steps.length}`,
                name: q.title || `${moduleTitleFromBackend || moduleSK || 'Módulo Desconocido'}: ${originalQuestionType || 'Pregunta'}`,
                type: frontendType,
                config: question,
                instructions: q.instructions,
                responseKey: parentModuleResponseKey,
                questionKey // SIEMPRE propagar el del backend si existe
            });
        }
    }
    return steps;
};

export const useFlowBuilder = ({ researchFlowApiData, isLoading }: UseFlowBuilderProps & { isLoading?: boolean }): ExpandedStep[] => {

    const buildStepsInternal = useCallback(() => {

        const flowDataModules =
            researchFlowApiData && typeof researchFlowApiData === 'object' && researchFlowApiData !== null && 'data' in researchFlowApiData
                ? (researchFlowApiData as { data: unknown }).data
                : undefined;

        // Si aún está cargando, devolver pasos vacíos sin warning
        if (isLoading) {
            return [];
        }

        // Solo mostrar warning si ya terminó de cargar pero no hay datos válidos
        if (!(Array.isArray(flowDataModules) && flowDataModules.length > 0)) {
            console.warn('[useFlowBuilder] No hay flowDataModules válidos para construir pasos.');
            console.warn('[useFlowBuilder] DEBUG - researchFlowApiData:', researchFlowApiData);
            console.warn('[useFlowBuilder] DEBUG - flowDataModules:', flowDataModules);
            console.warn('[useFlowBuilder] DEBUG - tipo de flowDataModules:', typeof flowDataModules);

            // Si hay un error en la API, mostrarlo
            if (researchFlowApiData && typeof researchFlowApiData === 'object' && 'error' in researchFlowApiData) {
                console.error('[useFlowBuilder] API Error:', (researchFlowApiData as { error?: unknown; message?: string }).message);
            }

            return [];
        }

        if (!Array.isArray(flowDataModules) || flowDataModules.length === 0) {
            return [];
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
            // NO agregar ningún paso ni fallback ni mock
        }

        const resolvedWelcomeConfig = (welcomeConfigFromBackend && typeof welcomeConfigFromBackend === 'object' && welcomeConfigFromBackend !== null && 'title' in welcomeConfigFromBackend)
            ? welcomeConfigFromBackend as { title?: string; message?: string }
            : null;
        if (resolvedWelcomeConfig) {
            finalSteps.push({
                id: 'welcome',
                name: 'title' in resolvedWelcomeConfig && typeof resolvedWelcomeConfig.title === 'string' ? resolvedWelcomeConfig.title : 'Bienvenida',
                type: 'welcome',
                config: resolvedWelcomeConfig,
                responseKey: 'welcome'
            });
        }

        for (const processedModule of flowDataModules) {
            const moduleData = processedModule.config;
            if (!moduleData) continue;

            const moduleSK = moduleData.sk;
            const moduleSpecificQuestions = moduleData.questions || [];
            const moduleTitleFromBackend = moduleData.title || moduleData.name;
            const moduleResponseKey = processedModule.id;
            const moduleQuestionKey = moduleData.questionKey;

            // 1. Si hay preguntas, SOLO generar pasos para cada pregunta (NO para el módulo)
            if (Array.isArray(moduleSpecificQuestions) && moduleSpecificQuestions.length > 0) {
                for (const question of moduleSpecificQuestions) {
                    if (typeof question !== 'object' || question === null) continue;
                    const q = question as { id?: string; title?: string; type?: string; instructions?: string; questionKey?: string };
                    const questionKey = q.questionKey || moduleQuestionKey || q.id || `${q.type || 'question'}_${finalSteps.length}`;
                    const stepType = q.type || moduleSK || 'question'; // Usar el type de la pregunta directamente
                    finalSteps.push({
                        id: q.id || `${stepType}_${finalSteps.length}`,
                        name: q.title || `${moduleTitleFromBackend || moduleSK || 'Módulo'}: ${q.type || 'Pregunta'}`,
                        type: stepType,
                        config: question,
                        instructions: q.instructions,
                        responseKey: moduleResponseKey,
                        questionKey // SIEMPRE
                    });
                }
            } else if (moduleQuestionKey) {
                // 2. Si NO hay preguntas pero el módulo tiene questionKey, generar paso para el módulo
                finalSteps.push({
                    id: moduleData.id || moduleResponseKey || moduleQuestionKey,
                    name: moduleTitleFromBackend || moduleSK || 'Módulo',
                    type: moduleSK ? moduleSK.toLowerCase() : 'modulo',
                    config: moduleData,
                    instructions: moduleData.instructions,
                    responseKey: moduleResponseKey,
                    questionKey: moduleQuestionKey
                });
            }
        }

        const resolvedThankYouConfig = (thankyouConfigFromBackend && typeof thankyouConfigFromBackend === 'object' && thankyouConfigFromBackend !== null && 'title' in thankyouConfigFromBackend)
            ? thankyouConfigFromBackend as { title?: string; message?: string }
            : null;
        if (resolvedThankYouConfig) {
            finalSteps.push({
                id: 'thankyou',
                name: 'title' in resolvedThankYouConfig && typeof resolvedThankYouConfig.title === 'string' ? resolvedThankYouConfig.title : 'Fin',
                type: 'thankyou',
                config: resolvedThankYouConfig,
                responseKey: 'thankyou'
            });
        }

        return finalSteps;
    }, [researchFlowApiData, isLoading]);

    const expandedSteps = useMemo(() => buildStepsInternal(), [buildStepsInternal]);

    return expandedSteps;
};
