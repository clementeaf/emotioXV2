import React, { useState, useCallback, Suspense, useMemo, useEffect } from 'react';
import { RenderError } from './RenderError';
import { MockDataWarning } from './MockDataWarning';
import { CurrentStepProps } from './types';
import { stepComponentMap } from './steps';
import { ApiClient, APIStatus } from '../../lib/api';
import { useParticipantStore } from '../../stores/participantStore';

const SMART_VOC_ROUTER_STEP_TYPE = 'smart_voc_module';
const DEMOGRAPHIC_STEP_TYPE = 'demographic';

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
    const [_loading, _setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enrichedStepConfig, setEnrichedStepConfig] = useState<any | null>(null);
    const [isLoadingResponses, setIsLoadingResponses] = useState<boolean>(false);

    const participantIdFromStore = useParticipantStore(state => state.participantId);
    const apiClient = useMemo(() => new ApiClient(), []);

    useEffect(() => {
        if (stepConfig && researchId && participantIdFromStore && stepId &&
            (stepType === SMART_VOC_ROUTER_STEP_TYPE || stepType === DEMOGRAPHIC_STEP_TYPE)) {
            setIsLoadingResponses(true);
            setEnrichedStepConfig(null);
            setError(null);

            apiClient.getModuleResponses(researchId, participantIdFromStore)
                .then(response => {
                    const newEnrichedConfig = JSON.parse(JSON.stringify(stepConfig));

                    if (response.data?.data && !response.error) {
                        const allParticipantResponsesDoc = response.data.data;
                        const actualResponsesArray = allParticipantResponsesDoc.responses;

                        if (Array.isArray(actualResponsesArray)) {
                            if (stepType === SMART_VOC_ROUTER_STEP_TYPE) {
                                if (newEnrichedConfig.questions && Array.isArray(newEnrichedConfig.questions)) {
                                    newEnrichedConfig.questions = newEnrichedConfig.questions.map((question: any) => {
                                        const savedResponseItem = actualResponsesArray.find(
                                            (r: any) => r.stepType === question.type && r.moduleId === stepId
                                        );

                                        if (savedResponseItem) {
                                            return {
                                                ...question,
                                                savedResponseData: {
                                                    id: savedResponseItem.id,
                                                    response: savedResponseItem.response
                                                }
                                            };
                                        }
                                        console.warn(`[CurrentStepRenderer - ${SMART_VOC_ROUTER_STEP_TYPE}] No saved response found for question type ${question.type} (moduleId: ${stepId})`);
                                        return question;
                                    });
                                }
                            } else if (stepType === DEMOGRAPHIC_STEP_TYPE) {
                                const demographicResponseItem = actualResponsesArray.find(
                                    (r: any) => r.stepId === stepId || r.stepType === DEMOGRAPHIC_STEP_TYPE
                                );
                                if (demographicResponseItem) {
                                    newEnrichedConfig.savedResponses = demographicResponseItem.response || {};
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
        const isGenerallyMock = !!(!stepConfig);
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

        if (stepType === 'smartvoc_csat' || stepType === 'smartvoc_ces' || stepType === 'smartvoc_nps' || stepType === 'smartvoc_cv' || stepType === 'smartvoc_nev') {
            return {
                ...baseProps,
                stepConfig: currentConfigToUse,
                questionConfig: currentConfigToUse || {},
                questionText: currentConfigToUse?.questionText || stepName || 'Pregunta SmartVOC',
                instructions: currentConfigToUse?.instructions,
                companyName: currentConfigToUse?.companyName,
                moduleId: stepId,
                ...(stepType === 'smartvoc_csat' ? { onStepComplete: baseProps.onStepComplete } : { onNext: baseProps.onStepComplete }),
            };
        }
        
        if (stepComponentMap[stepType]) {
            const componentSpecificProps: any = { ...baseProps };
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
            const warningMessage = finalMappedProps.isMock ? `Configuración para '${stepType}' podría estar incompleta o usando datos de prueba.` : undefined;

            return renderStepWithWarning(
                <ComponentToRender {...finalMappedProps} key={stepId} />,
                finalMappedProps.isMock,
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