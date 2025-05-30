import React, { useState, useCallback, Suspense, useMemo, useEffect } from 'react';
import { RenderError } from './RenderError';
import { MockDataWarning } from './MockDataWarning';
import { CurrentStepProps } from './types';
import { stepComponentMap } from './steps';
import { ApiClient, APIStatus } from '../../lib/api';
import { useParticipantStore } from '../../stores/participantStore';
import { useModuleResponses } from '../../hooks/useModuleResponses';

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

    console.log('CurrentStepRenderer props:', { stepType, stepConfig, stepId, stepName });
    console.log('CurrentStepRenderer moduleResponses:', { moduleResponsesFromAPI, isLoadingModuleResponses });

    // Función helper para encontrar respuesta por stepId/stepType
    const findSavedResponse = useCallback((searchStepId: string, searchStepType: string) => {
        // Buscar en respuestas del store local primero
        const localResponses = responsesDataFromStore?.modules?.all_steps || [];
        let foundResponse = localResponses.find(resp => 
            resp.id === searchStepId || 
            (resp.stepType === searchStepType && resp.stepTitle === stepName)
        );

        // Si no se encuentra localmente, buscar en respuestas de la API
        if (!foundResponse && Array.isArray(moduleResponsesFromAPI)) {
            const apiResponse = (moduleResponsesFromAPI as unknown[]).find((resp: unknown) => {
                if (typeof resp !== 'object' || resp === null) return false;
                const r = resp as { id?: string; stepType?: string; stepTitle?: string; stepId?: string };
                return r.id === searchStepId || 
                       r.stepId === searchStepId ||
                       (r.stepType === searchStepType && r.stepTitle === stepName) ||
                       (r.stepType === searchStepType);
            });
            
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
            }
        }

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
                        if (response.apiStatus !== APIStatus.NOT_FOUND && response.message) {
                            console.error("[CurrentStepRenderer] Error fetching module responses:", response.message, response);
                            setError(response.message);
                        }
                        setEnrichedStepConfig(newEnrichedConfig);
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
        (content: React.ReactNode, isMock: boolean, warningMessage?: string) => (
            <div className="relative w-full flex flex-col items-center justify-center min-h-full p-4 sm:p-8">
                {isMock && <MockDataWarning message={warningMessage} />}
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
        console.log(`[CurrentStepRenderer] Respuesta encontrada para ${stepId} (${stepType}):`, savedResponse);

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
            currentConfigToUse = {
                ...currentConfigToUse,
                savedResponses: savedResponse.response,
                savedResponseId: savedResponse.id,
            };
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
        if (error || moduleResponsesError) {
            return <div className="p-6 text-center text-red-500">Error al cargar datos: {error || moduleResponsesError}</div>;
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
            const warningMessage = (finalMappedProps as { isMock?: boolean }).isMock ? `Configuración para '${stepType}' podría estar incompleta o usando datos de prueba.` : undefined;

            return renderStepWithWarning(
                <ComponentToRender {...(finalMappedProps as any)} key={`${stepId}-${stepType}`} />,
                Boolean((finalMappedProps as { isMock?: boolean }).isMock),
                warningMessage
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