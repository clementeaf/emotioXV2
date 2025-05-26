import React, { useState, useCallback, Suspense, useMemo, useEffect } from 'react';
import { RenderError } from './RenderError';
import { MockDataWarning } from './MockDataWarning';
import { CurrentStepProps } from './types';
import { stepComponentMap } from './steps';
import { ApiClient, APIStatus } from '../../lib/api';
import { useParticipantStore } from '../../stores/participantStore';

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
    const apiClient = useMemo(() => new ApiClient(), []);

    console.log('CurrentStepRenderer props:', { stepType, stepConfig, stepId, stepName });

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
        };

        const getStringProp = (obj: unknown, key: string): string | undefined => {
            if (typeof obj === 'object' && obj !== null && key in obj) {
                const val = (obj as Record<string, unknown>)[key];
                return typeof val === 'string' ? val : undefined;
            }
            return undefined;
        };

        if (stepType === 'smartvoc_csat' || stepType === 'smartvoc_ces' || stepType === 'smartvoc_nps' || stepType === 'smartvoc_cv' || stepType === 'smartvoc_nev') {
            return {
                ...baseProps,
                stepConfig: currentConfigToUse,
                questionConfig: currentConfigToUse || {},
                questionText: getStringProp(currentConfigToUse, 'questionText') || stepName || 'Pregunta SmartVOC',
                instructions: getStringProp(currentConfigToUse, 'instructions'),
                companyName: getStringProp(currentConfigToUse, 'companyName'),
                moduleId: stepId,
                ...(stepType === 'smartvoc_csat' ? { onStepComplete: baseProps.onStepComplete } : { onNext: baseProps.onStepComplete }),
            };
        }
        
        if (stepComponentMap[stepType]) {
            const componentSpecificProps: Record<string, unknown> = { ...baseProps };
            if (stepType !== 'smartvoc_csat' && stepType !== 'smartvoc_ces' && stepType !== 'smartvoc_nps') {
                componentSpecificProps.stepConfig = currentConfigToUse;
            }
            return componentSpecificProps;
        }

        return baseProps;
    }, [stepType, stepConfig, stepId, stepName, researchId, token, onLoginSuccess, onStepComplete, handleError, enrichedStepConfig]);

    const renderContent = useCallback(() => {
        if (error) {
            return <div className="p-6 text-center text-red-500">Error al cargar datos: {error}</div>;
        }

        if ((stepType === SMART_VOC_ROUTER_STEP_TYPE || stepType === DEMOGRAPHIC_STEP_TYPE) && isLoadingResponses) {
            return <div className="w-full h-full flex items-center justify-center p-6 text-center text-neutral-500">Cargando datos previos...</div>;
        }

        const ComponentToRender = stepComponentMap[stepType];

        if (ComponentToRender) {
            const warningMessage = (finalMappedProps as { isMock?: boolean }).isMock ? `Configuración para '${stepType}' podría estar incompleta o usando datos de prueba.` : undefined;

            return renderStepWithWarning(
                <ComponentToRender {...(finalMappedProps as any)} key={stepId} />,
                Boolean((finalMappedProps as { isMock?: boolean }).isMock),
                warningMessage
            );
        } else {
            console.warn(`[CurrentStepRenderer] Tipo de paso no manejado: ${stepType}`);
            return <RenderError stepType={stepType} />;
        }
    }, [error, stepType, finalMappedProps, renderStepWithWarning, isLoadingResponses, stepId]);

    return (
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center p-6 text-center text-neutral-500">Cargando módulo...</div>}>
            {renderContent()}
        </Suspense>
    );
};

export default CurrentStepRenderer; 