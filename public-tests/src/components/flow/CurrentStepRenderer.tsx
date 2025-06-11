import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useModuleResponses } from '../../hooks/useModuleResponses';
import { ApiClient, APIStatus } from '../../lib/api';
import { useParticipantStore } from '../../stores/participantStore';
import { RenderError } from './RenderError';
import { stepComponentMap } from './steps';
import { CurrentStepProps } from './types';

const SMART_VOC_ROUTER_STEP_TYPE = 'smart_voc_module';
const DEMOGRAPHIC_STEP_TYPE = 'demographic';

type EnrichedStepConfig = Record<string, unknown> | null;

const CurrentStepRenderer: React.FC<CurrentStepProps> = ({
    stepType,
    stepConfig,
    stepId,
    stepName,
    researchId,
    token,
    onLoginSuccess,
    onStepComplete,
    onError,
}) => {
    const [error, setError] = useState<string | null>(null);
    const [enrichedStepConfig, setEnrichedStepConfig] = useState<EnrichedStepConfig>(null);
    const [isLoadingResponses, setIsLoadingResponses] = useState<boolean>(false);

    const participantIdFromStore = useParticipantStore(state => state.participantId);
    const responsesDataFromStore = useParticipantStore(state => state.responsesData);
    const apiClient = useMemo(() => new ApiClient(), []);

    // Usar useModuleResponses para obtener respuestas centralizadas
    const {
        data: moduleResponsesFromAPI,
        isLoading: isLoadingModuleResponses,
        error: moduleResponsesError
    } = useModuleResponses({
        researchId: researchId || undefined,
        participantId: participantIdFromStore || undefined,
        autoFetch: !!(researchId && participantIdFromStore),
    });

    // Función helper para encontrar respuesta por stepId/stepType
    const findSavedResponse = useCallback((searchStepId: string, searchStepType: string) => {
        console.log(`🔍 [CurrentStepRenderer] Buscando respuesta guardada para:`, {
            searchStepId,
            searchStepType,
            stepName,
            localResponsesCount: responsesDataFromStore?.modules?.all_steps?.length || 0,
            apiResponsesCount: Array.isArray(moduleResponsesFromAPI) ? moduleResponsesFromAPI.length : 0
        });

        // 🚨 NUEVO: Verificar si el usuario ya interactuó - Si es así, NO retornar savedResponse obsoleto
        const hasInteracted = typeof window !== 'undefined' && window.sessionStorage &&
            window.sessionStorage.getItem(`userInteraction_${searchStepId}_${searchStepType}`) === 'true';

        if (hasInteracted) {
            console.log(`🚫 [CurrentStepRenderer] User interacted with ${searchStepId}, NOT returning savedResponse to prevent overwrite`);
            return null;
        }

        // Buscar en respuestas del store local primero
        const localResponses = responsesDataFromStore?.modules?.all_steps || [];
        console.log(`🔍 [CurrentStepRenderer] Respuestas locales disponibles:`, localResponses.map(r => ({
            id: r.id,
            stepType: r.stepType,
            stepTitle: r.stepTitle,
            responsePreview: typeof r.response === 'string' ? r.response.substring(0, 50) + '...' : typeof r.response,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            rawResponse: r.response
        })));

                let foundResponse = localResponses.find(resp => {
            const idMatch = resp.id === searchStepId;
            const typeAndTitleMatch = resp.stepType === searchStepType && resp.stepTitle === stepName;
            const titleOnlyMatch = resp.stepTitle === stepName; // 🔧 NUEVA LÓGICA: Solo por título
            console.log(`🔍 [CurrentStepRenderer] Checking local response:`, {
                responseId: resp.id,
                responseStepType: resp.stepType,
                responseStepTitle: resp.stepTitle,
                searchStepId,
                searchStepType,
                stepName,
                idMatch,
                typeAndTitleMatch,
                titleOnlyMatch,
                overall: idMatch || typeAndTitleMatch || titleOnlyMatch
            });
            return idMatch || typeAndTitleMatch || titleOnlyMatch; // 🔧 AÑADIR titleOnlyMatch
        });

        console.log(`🔍 [CurrentStepRenderer] Respuesta encontrada en store local:`, foundResponse ? {
            id: foundResponse.id,
            stepType: foundResponse.stepType,
            stepTitle: foundResponse.stepTitle,
            hasResponse: !!foundResponse.response
        } : 'No encontrada');

                // Si no se encuentra localmente, buscar en respuestas de la API
        if (!foundResponse && Array.isArray(moduleResponsesFromAPI)) {
            console.log(`🔍 [CurrentStepRenderer] Buscando en respuestas de API:`, moduleResponsesFromAPI.map((r: any) => ({
                id: r?.id,
                stepType: r?.stepType,
                stepTitle: r?.stepTitle,
                stepId: r?.stepId,
                responsePreview: typeof r?.response === 'string' ? r.response.substring(0, 50) + '...' : typeof r?.response,
                createdAt: r?.createdAt,
                updatedAt: r?.updatedAt,
                rawResponse: r?.response
            })));

                        const apiResponse = (moduleResponsesFromAPI as unknown[]).find((resp: unknown) => {
                if (typeof resp !== 'object' || resp === null) return false;
                const r = resp as { id?: string; stepType?: string; stepTitle?: string; stepId?: string };
                return r.id === searchStepId ||
                       r.stepId === searchStepId ||
                       (r.stepType === searchStepType && r.stepTitle === stepName) ||
                       (r.stepType === searchStepType) ||
                       (r.stepTitle === stepName); // 🔧 AÑADIR: Buscar solo por título también
            });

            console.log(`🔍 [CurrentStepRenderer] Respuesta encontrada en API:`, apiResponse ? {
                id: (apiResponse as any)?.id,
                stepType: (apiResponse as any)?.stepType,
                stepTitle: (apiResponse as any)?.stepTitle,
                hasResponse: !!(apiResponse as any)?.response
            } : 'No encontrada');

            // Convertir respuesta de API al formato esperado
            if (apiResponse && typeof apiResponse === 'object') {
                const apiResp = apiResponse as {
                    id?: string;
                    stepType?: string;
                    stepTitle?: string;
                    response?: unknown;
                    createdAt?: string;
                    updatedAt?: string;
                };
                foundResponse = {
                    id: apiResp.id || searchStepId,
                    stepType: apiResp.stepType || searchStepType,
                    stepTitle: apiResp.stepTitle || stepName || '',
                    response: apiResp.response,
                    createdAt: apiResp.createdAt || new Date().toISOString(),
                    updatedAt: apiResp.updatedAt || new Date().toISOString(),
                };
                console.log(`✅ [CurrentStepRenderer] Respuesta convertida desde API:`, foundResponse);
            }
        }

        console.log(`🔍 [CurrentStepRenderer] Resultado final findSavedResponse:`, foundResponse ? {
            id: foundResponse.id,
            stepType: foundResponse.stepType,
            stepTitle: foundResponse.stepTitle,
            responsePreview: typeof foundResponse.response === 'string' ? foundResponse.response.substring(0, 50) + '...' : typeof foundResponse.response,
            createdAt: foundResponse.createdAt,
            updatedAt: foundResponse.updatedAt,
            dataSource: foundResponse.createdAt ? 'API o Store con timestamps' : 'Store local'
        } : 'No encontrada');

        return foundResponse || null;
    }, [responsesDataFromStore, moduleResponsesFromAPI, stepName]);

    useEffect(() => {
        if (stepConfig && researchId && participantIdFromStore && stepId &&
            (stepType === SMART_VOC_ROUTER_STEP_TYPE || stepType === DEMOGRAPHIC_STEP_TYPE)) {
            setIsLoadingResponses(true);
            setEnrichedStepConfig(null);
            setError(null);

            apiClient.getModuleResponses(researchId, participantIdFromStore)
                .then(response => {
                    const newEnrichedConfig = JSON.parse(JSON.stringify(stepConfig));

                    // Type guard para response.data y response.data.data
                    const hasDataData = (obj: unknown): obj is { data: { responses: unknown[] } } => {
                        return (
                            typeof obj === 'object' && obj !== null &&
                            'data' in obj && typeof (obj as { data?: unknown }).data === 'object' && (obj as { data?: unknown }).data !== null &&
                            'responses' in ((obj as { data: unknown }).data as Record<string, unknown>) && Array.isArray(((obj as { data: unknown }).data as { responses: unknown[] }).responses)
                        );
                    };

                    if (hasDataData(response) && !('error' in response && response.error)) {
                        const allParticipantResponsesDoc = response.data;
                        const actualResponsesArray = allParticipantResponsesDoc.responses;

                        // Type guard para elementos del array
                        const isRecord = (val: unknown): val is Record<string, unknown> => typeof val === 'object' && val !== null;

                        if (Array.isArray(actualResponsesArray)) {
                            if (stepType === SMART_VOC_ROUTER_STEP_TYPE) {
                                if (newEnrichedConfig.questions && Array.isArray(newEnrichedConfig.questions)) {
                                    newEnrichedConfig.questions = newEnrichedConfig.questions.map((question: Record<string, unknown>) => {
                                        const savedResponseItem = actualResponsesArray.find(
                                            (r): r is Record<string, unknown> => isRecord(r) && 'stepType' in r && r.stepType === question.type && 'moduleId' in r && r.moduleId === stepId
                                        );

                                        if (savedResponseItem) {
                                            return {
                                                ...question,
                                                savedResponseData: {
                                                    id: (savedResponseItem as { id?: string }).id,
                                                    response: (savedResponseItem as { response?: unknown }).response
                                                }
                                            };
                                        }
                                        console.warn(`[CurrentStepRenderer - ${SMART_VOC_ROUTER_STEP_TYPE}] No saved response found for question type ${(question as { type?: string }).type} (moduleId: ${stepId})`);
                                        return question;
                                    });
                                }
                            } else if (stepType === DEMOGRAPHIC_STEP_TYPE) {
                                const demographicResponseItem = actualResponsesArray.find(
                                    (r): r is Record<string, unknown> => isRecord(r) && (('stepId' in r && r.stepId === stepId) || ('stepType' in r && r.stepType === DEMOGRAPHIC_STEP_TYPE))
                                );
                                if (demographicResponseItem && 'response' in demographicResponseItem) {
                                    newEnrichedConfig.savedResponses = (demographicResponseItem as { response?: unknown }).response || {};
                                } else {
                                    console.warn(`[CurrentStepRenderer - ${DEMOGRAPHIC_STEP_TYPE}] No saved response found for step ${stepId} (or type ${DEMOGRAPHIC_STEP_TYPE})`);
                                    newEnrichedConfig.savedResponses = {};
                                }
                            }
                        }
                        setEnrichedStepConfig(newEnrichedConfig);
                    } else {
                        // Para participantes nuevos sin respuestas previas, configurar respuesta vacía
                        if (response.apiStatus === APIStatus.NOT_FOUND || response.status === 404) {
                            if (stepType === DEMOGRAPHIC_STEP_TYPE) {
                                newEnrichedConfig.savedResponses = {};
                            }
                            setEnrichedStepConfig(newEnrichedConfig);
                        } else if (response.message) {
                            console.error("[CurrentStepRenderer] Error fetching module responses:", response.message, response);
                            setError(response.message);
                            setEnrichedStepConfig(newEnrichedConfig);
                        } else {
                            // Sin mensaje de error específico, usar configuración base
                            setEnrichedStepConfig(newEnrichedConfig);
                        }
                    }
                })
                .catch(err => {
                    console.error("[CurrentStepRenderer] Exception fetching module responses:", err);
                    setError(err.message || "Excepción al cargar respuestas previas.");
                    const fallbackConfig = JSON.parse(JSON.stringify(stepConfig));
                    setEnrichedStepConfig(fallbackConfig);
                })
                .finally(() => {
                    setIsLoadingResponses(false);
                });
        } else if (stepType !== SMART_VOC_ROUTER_STEP_TYPE && stepType !== DEMOGRAPHIC_STEP_TYPE) {
            setEnrichedStepConfig(null);
            setIsLoadingResponses(false);
        }
    }, [stepType, stepConfig, researchId, participantIdFromStore, apiClient, stepId]);

    const renderStepWithWarning = useCallback(
        (content: React.ReactNode) => (
            <div className="w-full h-full">
                {content}
            </div>
        ),
        []
    );

    const handleError = useCallback((message: string) => {
        setError(message);
        if (onError) {
            onError(message, stepType);
        }
    }, [onError, stepType]);

    const finalMappedProps = useMemo(() => {
        const isGenerallyMock = !stepConfig;
        let currentConfigToUse = stepConfig;

        if (stepType === DEMOGRAPHIC_STEP_TYPE && enrichedStepConfig) {
            currentConfigToUse = enrichedStepConfig;
        }

        // Buscar respuesta guardada para este step específico
        const savedResponse = findSavedResponse(stepId || '', stepType);

        const baseProps = {
            stepType,
            stepId,
            stepName,
            researchId,
            token,
            onLoginSuccess,
            onStepComplete: onStepComplete || (() => {}),
            onError: handleError,
            isMock: isGenerallyMock,
            // Pasar respuesta guardada a todos los componentes
            savedResponse: savedResponse || null,
            // Pasar también el ID de respuesta para actualizaciones
            savedResponseId: savedResponse ? savedResponse.id : null,
        };

        const getStringProp = (obj: unknown, key: string): string | undefined => {
            if (typeof obj === 'object' && obj !== null && key in obj) {
                const val = (obj as Record<string, unknown>)[key];
                return typeof val === 'string' ? val : undefined;
            }
            return undefined;
        };

        // Agregar respuesta guardada a la configuración si existe
        if (savedResponse && currentConfigToUse) {
            console.log(`✅ [CurrentStepRenderer] Agregando respuesta a config:`, {
                stepType,
                stepName,
                savedResponseId: savedResponse.id,
                savedResponseData: savedResponse.response,
                configExists: !!currentConfigToUse
            });
            currentConfigToUse = {
                ...currentConfigToUse,
                savedResponses: savedResponse.response,
                savedResponseId: savedResponse.id,
            };
            console.log(`✅ [CurrentStepRenderer] Config actualizada:`, {
                hasSavedResponses: !!(currentConfigToUse as any).savedResponses,
                savedResponsesValue: (currentConfigToUse as any).savedResponses
            });
        } else {
            console.log(`❌ [CurrentStepRenderer] NO se agrega respuesta a config:`, {
                hasSavedResponse: !!savedResponse,
                hasCurrentConfig: !!currentConfigToUse,
                stepType,
                stepName
            });
        }

        if (stepType === 'smartvoc_csat' || stepType === 'smartvoc_ces' || stepType === 'smartvoc_nps' || stepType === 'smartvoc_cv' || stepType === 'smartvoc_nev') {
            return {
                ...baseProps,
                stepConfig: currentConfigToUse,
                questionConfig: currentConfigToUse || {},
                questionText: getStringProp(currentConfigToUse, 'questionText') || stepName || 'Pregunta SmartVOC',
                instructions: getStringProp(currentConfigToUse, 'instructions'),
                companyName: getStringProp(currentConfigToUse, 'companyName'),
                moduleId: stepId,
                // Pasar configuración específica para SmartVOC
                config: currentConfigToUse,
                ...(stepType === 'smartvoc_csat' ? { onStepComplete: baseProps.onStepComplete } : { onNext: baseProps.onStepComplete }),
            };
        }

        if (stepComponentMap[stepType]) {
            const componentSpecificProps: Record<string, unknown> = { ...baseProps };
            if (stepType !== 'smartvoc_csat' && stepType !== 'smartvoc_ces' && stepType !== 'smartvoc_nps') {
                componentSpecificProps.stepConfig = currentConfigToUse;
            }
            // Asegurar que config se pasa a todos los componentes
            componentSpecificProps.config = currentConfigToUse;
            return componentSpecificProps;
        }

        return baseProps;
    }, [stepType, stepConfig, stepId, stepName, researchId, token, onLoginSuccess, onStepComplete, handleError, enrichedStepConfig, findSavedResponse]);

    const renderContent = useCallback(() => {
        // Solo mostrar error si hay un error real, no solo por falta de respuestas previas
        if (error) {
            return <div className="p-6 text-center text-red-500">Error al cargar datos: {error}</div>;
        }

        // No mostrar error de moduleResponsesError si es solo porque no hay respuestas previas
        if (moduleResponsesError && moduleResponsesError !== 'Error cargando las respuestas del módulo.') {
            return <div className="p-6 text-center text-red-500">Error al cargar datos: {moduleResponsesError}</div>;
        }

        if ((stepType === SMART_VOC_ROUTER_STEP_TYPE || stepType === DEMOGRAPHIC_STEP_TYPE) && isLoadingResponses) {
            return <div className="w-full h-full flex items-center justify-center p-6 text-center text-neutral-500">Cargando datos previos...</div>;
        }

        // Mostrar loading para otros tipos de step si están cargando respuestas
        if (isLoadingModuleResponses && stepType !== SMART_VOC_ROUTER_STEP_TYPE && stepType !== DEMOGRAPHIC_STEP_TYPE) {
            return <div className="w-full h-full flex items-center justify-center p-6 text-center text-neutral-500">Cargando respuestas...</div>;
        }

        const ComponentToRender = stepComponentMap[stepType];

        if (ComponentToRender) {
            return renderStepWithWarning(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <ComponentToRender {...(finalMappedProps as any)} key={`${stepId}-${stepType}`} />,
            );
        } else {
            console.warn(`[CurrentStepRenderer] Tipo de paso no manejado: ${stepType}`);
            return <RenderError stepType={stepType} />;
        }
    }, [error, moduleResponsesError, stepType, finalMappedProps, renderStepWithWarning, isLoadingResponses, isLoadingModuleResponses, stepId]);

    return (
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center p-6 text-center text-neutral-500">Cargando módulo...</div>}>
            {renderContent()}
        </Suspense>
    );
};

export default CurrentStepRenderer;
