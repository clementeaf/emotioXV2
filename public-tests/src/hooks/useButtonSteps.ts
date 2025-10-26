import React, { useState, useCallback } from 'react';
import { useAvailableFormsQuery, useModuleResponsesQuery, useSaveModuleResponseMutation, useUpdateModuleResponseMutation } from './useApiQueries';
// import { useDemographicValidation, type DemographicQuestions } from './useDemographicValidation';
import { useParticipantInfo } from './useParticipantInfo';
import { CreateModuleResponseDto, UpdateModuleResponseDto, StepConfiguration } from '../lib/types';
import { useFormDataStore } from '../stores/useFormDataStore';
import { useStepStore } from '../stores/useStepStore';
import { useTestStore } from '../stores/useTestStore';
import { buildTimingMetadata } from '../utils/timingMetadata';
import { buildUserJourneyMetadata } from '../utils/userJourneyMetadata';
import { formatResponseData, optimizeFormData } from '../utils/responseFormatter';

interface UseButtonStepsProps {
  currentQuestionKey: string;
  isWelcomeScreen?: boolean;
}

export const useButtonSteps = ({ currentQuestionKey, isWelcomeScreen = false }: UseButtonStepsProps) => {
  const { researchId, participantId } = useTestStore();
  const { goToNextStep } = useStepStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showOptimisticSuccess, setShowOptimisticSuccess] = useState(false);

  const { getFormData } = useFormDataStore();
  const getCurrentFormData = useCallback(() => getFormData(currentQuestionKey) || {}, [getFormData, currentQuestionKey]);

  // const { validateDemographics } = useDemographicValidation();

  // 🎯 SIMPLIFICADO: Solo tracking básico
  const { participantInfo, startResponseTiming, endResponseTiming } = useParticipantInfo({
    researchId: researchId || '',
    trackLocation: false,
    trackDevice: true,
    trackResponseTimes: false,
    trackNavigation: false
  });

  const { data: moduleResponses } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );
  
  // 🎯 HELPER PARA OBTENER DATOS FINALES (local vs backend)
  const getFinalFormData = useCallback((): Record<string, unknown> => {
    const currentFormData = getCurrentFormData();
    const backendResponse = moduleResponses?.responses?.find(
      (response: { questionKey: string }) => response.questionKey === currentQuestionKey
    );
    const backendData = (backendResponse?.response as Record<string, unknown>) || {};
    
    const localDataStr = JSON.stringify(currentFormData || {});
    const backendDataStr = JSON.stringify(backendData);
    const hasLocalChanges = localDataStr !== backendDataStr && localDataStr !== '{}';
    
    return hasLocalChanges ? (currentFormData || {}) : backendData;
  }, [getCurrentFormData, moduleResponses, currentQuestionKey]);

  const [, setOptimisticSavedQuestions] = useState<Set<string>>(new Set());

  const { data: formsData } = useAvailableFormsQuery(researchId || '');

  const steps = React.useMemo(() => {
    if (formsData?.steps && formsData.stepsConfiguration && formsData.stepsConfiguration.length > 0) {
      const configMap = new Map();

      formsData.stepsConfiguration.forEach((stepConfig: StepConfiguration) => {
        configMap.set(stepConfig.questionKey, stepConfig);
      });

      return formsData.steps
        .map((questionKey: string) => {
          const stepConfig = configMap.get(questionKey);
          if (!stepConfig) {
            return null;
          }

          let title = '';
          switch (questionKey) {
            case 'demographics':
              title = 'Preguntas demográficas';
              break;
            case 'welcome_screen':
              title = 'Bienvenido';
              break;
            case 'thank_you_screen':
              title = 'Gracias por participar';
              break;
            case 'smartvoc_csat':
              title = String(stepConfig.contentConfiguration?.title || 'CSAT');
              break;
            case 'cognitive_navigation_flow':
              title = 'Navegación Cognitiva';
              break;
            default:
              title = String(stepConfig.contentConfiguration?.title || questionKey);
          }

          return {
            title: title,
            questionKey: stepConfig.questionKey
          };
        })
        .filter((step: { title: string; questionKey: string } | null): step is NonNullable<typeof step> => step !== null);
    }
    return [];
  }, [formsData?.steps, formsData?.stepsConfiguration]);

  const saveMutation = useSaveModuleResponseMutation({
    onSuccess: () => {
      const { updateBackendResponses } = useStepStore.getState();
      const currentBackendResponses = useStepStore.getState().backendResponses;
      
      const newResponse = {
        questionKey: currentQuestionKey,
        response: getFinalFormData()
      };
      
      const updatedResponses = [
        ...currentBackendResponses.filter((r: unknown) => (r as { questionKey?: string }).questionKey !== currentQuestionKey),
        newResponse
      ];
      
      updateBackendResponses(updatedResponses);
      
      // 🎯 SIMPLIFICADO: Sin WebSocket tracking

      setIsSaving(false);
      
      setTimeout(() => {
        const store = useStepStore.getState();
        const currentStep = store.currentQuestionKey;
    
        if (currentStep === currentQuestionKey) {
          goToNextStep();
        }
      }, 300);
    },
    onError: () => {
      setIsSaving(false);
      setOptimisticSavedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentQuestionKey);
        return newSet;
      });
    }
  });

  const updateMutation = useUpdateModuleResponseMutation({
    onSuccess: () => {
      // 🎯 SIMPLIFICADO: Sin WebSocket tracking

      setIsSaving(false);
      setIsNavigating(true);

      setTimeout(() => {
        const store = useStepStore.getState();
        const currentStep = store.currentQuestionKey;
        
        if (currentStep === currentQuestionKey) {
          // Navigation logging removido
          goToNextStep();
        }
        setIsNavigating(false);
      }, 500);
    },
    onError: (error) => {
      setIsSaving(false);
      setOptimisticSavedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentQuestionKey);
        return newSet;
      });
    }
  });

  const existingResponse = moduleResponses?.responses?.find(
    (moduleResponse: { questionKey: string }) => moduleResponse.questionKey === currentQuestionKey
  );

  // 🎯 SOLO CONSIDERAR RESPUESTA EXISTENTE SI NO ESTÁ VACÍA
  const hasValidResponse = !!(existingResponse?.response && 
    typeof existingResponse.response === 'object' && 
    Object.keys(existingResponse.response).length > 0);
    
  const hasExistingResponse = hasValidResponse;
  
  const documentId = moduleResponses?.id;

  const getButtonText = (): string => {
    if (isWelcomeScreen) {
      return 'Comenzar';
    }

    if (isSaving) {
      return 'Guardando...';
    }

    if (showOptimisticSuccess) {
      return '✓ Guardado';
    }

    if (isNavigating) {
      return 'Pasando a la siguiente pregunta';
    }

    if (hasExistingResponse) {
      return 'Actualizar y continuar';
    } else {
      return 'Guardar y continuar';
    }
  };

  const isDisabled = isSaving || isNavigating;

  // 🎯 SIMPLIFICADO: Timing y tracking básico
  const startTiming = () => startResponseTiming(currentQuestionKey);
  const endTiming = () => endResponseTiming(currentQuestionKey);
  const getTimingData = () => ({ startTime: Date.now(), endTime: Date.now(), duration: 0 });
  const trackStepVisit = () => {};
  const getJourneyData = () => ({ 
    navigationPath: [], 
    totalSteps: 0, 
    totalTime: 0, 
    hasBackNavigation: false, 
    skippedSteps: [], 
    currentStep: '', 
    sessionStartTime: Date.now() 
  });

  const handleClick = useCallback(async () => {
    if (isSaving || isNavigating) {
      return;
    }

    if (isWelcomeScreen) {
      setIsNavigating(true);
      setTimeout(() => {
        const store = useStepStore.getState();
        store.goToNextStep();
        setIsNavigating(false);
      }, 1000);
      return;
    }

    setShowOptimisticSuccess(true);
    setTimeout(() => setShowOptimisticSuccess(false), 1500);
    
    if (!existingResponse) {
      setOptimisticSavedQuestions(prev => new Set(prev).add(currentQuestionKey));
    }

    const currentFormData = getCurrentFormData();
    
    // 🎯 OBTENER DATOS DEL BACKEND PARA COMPARAR
    const backendResponse = moduleResponses?.responses?.find(
      (response: { questionKey: string }) => response.questionKey === currentQuestionKey
    );
    const backendData = backendResponse?.response || {};
    
    // 🎯 DETECTAR SI HAY CAMBIOS REALES
    const localDataStr = JSON.stringify(currentFormData || {});
    const backendDataStr = JSON.stringify(backendData);
    const hasLocalChanges = localDataStr !== backendDataStr && localDataStr !== '{}';
    
    // 🎯 USAR DATOS BACKEND SI NO HAY CAMBIOS LOCALES (evita enviar {})
    const finalFormData = hasLocalChanges ? (currentFormData || {}) : backendData;
    
    
    if (currentQuestionKey === 'demographics' && finalFormData && Object.keys(finalFormData).length > 0) {
      const formValuesString = Object.fromEntries(
        Object.entries(finalFormData).map(([key, value]) => [key, String(value || '')])
      ) as Record<string, string>;

      // const validationResult = validateDemographics(formValuesString, eyeTrackingConfig.demographicQuestions as DemographicQuestions);

      // if (validationResult.isDisqualified) {
        try {
          const timestamp = new Date().toISOString();
          const now = new Date().toISOString();
          const timingData = getTimingData();
          const enhancedMetadata = buildTimingMetadata(currentQuestionKey, timingData, {});
          const journeyData = getJourneyData();
          const finalMetadata = buildUserJourneyMetadata(journeyData, enhancedMetadata);

          const disqualificationMetadata = {
            ...finalMetadata,
            isDisqualified: true,
            disqualificationReason: 'Demographics validation failed', // validationResult.reason,
            disqualificationType: 'demographics'
          };

          const optimizedFormData = optimizeFormData(finalFormData as Record<string, unknown>);

          const createData: CreateModuleResponseDto = {
            researchId: researchId || '',
            participantId: participantId || '',
            questionKey: currentQuestionKey,
            responses: [{
              questionKey: currentQuestionKey,
              response: optimizedFormData,
              timestamp,
              createdAt: now
            }],
            metadata: disqualificationMetadata
          };

          await saveMutation.mutateAsync(createData);
        } catch (error) {
          // Error saving demographics data - continue with flow
        }

        // 🎯 SIMPLIFICADO: Sin redirección de descalificación
        // return;
      // }
    }

    const quotaResult = useFormDataStore.getState().quotaResult;
    if (quotaResult && quotaResult.status === 'DISQUALIFIED_OVERQUOTA') {
      try {
        const timestamp = new Date().toISOString();
        const now = new Date().toISOString();
        const timingData = getTimingData();
        const enhancedMetadata = buildTimingMetadata(currentQuestionKey, timingData, {});
        const journeyData = getJourneyData();
        const finalMetadata = buildUserJourneyMetadata(journeyData, enhancedMetadata);

        const quotaDisqualificationMetadata = {
          ...finalMetadata,
          isDisqualified: true,
          disqualificationReason: quotaResult.reason || 'Cuota alcanzada',
          disqualificationType: 'quota',
          quotaInfo: {
            demographicType: quotaResult.demographicType,
            demographicValue: quotaResult.demographicValue,
            currentCount: quotaResult.order,
            maxQuota: quotaResult.quotaLimit
          }
        };

        const createData: CreateModuleResponseDto = {
          researchId: researchId || '',
          participantId: participantId || '',
          questionKey: currentQuestionKey,
          responses: [{
            questionKey: currentQuestionKey,
            response: finalFormData,
            timestamp,
            createdAt: now
          }],
          metadata: quotaDisqualificationMetadata
        };

        await saveMutation.mutateAsync(createData);
      } catch (error) {
        // Error saving quota disqualification data - continue with redirection
      }

      // 🎯 SIMPLIFICADO: Sin redirección de descalificación
      return;
    }

    startTiming();
    trackStepVisit();

    setIsSaving(true);

    try {
      const timestamp = new Date().toISOString();
      const now = new Date().toISOString();
      const timingData = getTimingData();
      const enhancedMetadata = buildTimingMetadata(currentQuestionKey, timingData, {});
      const journeyData = getJourneyData();
      const finalMetadata = buildUserJourneyMetadata(journeyData, enhancedMetadata);

      const safeMetadata = Object.keys(finalMetadata).length > 0 ? finalMetadata : {
        deviceInfo: {
          deviceType: 'desktop' as const,
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          platform: navigator.platform,
          language: navigator.language
        },
        timingInfo: {
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 0
        }
      };

      // Obtener instrucciones para smartvoc_nev
      const stepConfig = formsData?.stepsConfiguration?.find(
        (config: StepConfiguration) => config.questionKey === currentQuestionKey
      );
      const instructions = stepConfig?.contentConfiguration?.instructions as string | undefined;
      
      let formattedResponse = formatResponseData(finalFormData, currentQuestionKey, instructions);

      const responseSize = JSON.stringify(formattedResponse).length;
      if (responseSize > 5000 && currentQuestionKey !== 'smartvoc_nev') {
        if (typeof formattedResponse === 'object' && formattedResponse !== null) {
          const truncatedResponse: Record<string, string | number | boolean | null> = {};
          for (const [key, value] of Object.entries(formattedResponse).slice(0, 3)) {
            if (typeof value === 'string') {
              truncatedResponse[key] = value.substring(0, 50);
            } else {
              truncatedResponse[key] = value;
            }
          }
          formattedResponse = truncatedResponse;
        }
      }

      const currentDocumentSize = moduleResponses ? JSON.stringify(moduleResponses).length : 0;
      const estimatedNewSize = currentDocumentSize + responseSize;
      
      if (estimatedNewSize > 350000 && currentQuestionKey !== 'smartvoc_nev') {
        
        if (typeof formattedResponse === 'object' && formattedResponse !== null) {
          const aggressiveTruncation: Record<string, string | number | boolean | null> = {};
          for (const [key, value] of Object.entries(formattedResponse).slice(0, 2)) {
            if (typeof value === 'string') {
              aggressiveTruncation[key] = value.substring(0, 25);
            } else {
              aggressiveTruncation[key] = value;
            }
          }
          formattedResponse = aggressiveTruncation;
        }
      }

      if (hasExistingResponse) {
        const updateData: UpdateModuleResponseDto = {
          researchId: researchId || '',
          participantId: participantId || '',
          questionKey: currentQuestionKey,
          responses: [{
            questionKey: currentQuestionKey,
            response: formattedResponse,
            timestamp,
            createdAt: existingResponse?.createdAt || now,
            updatedAt: now
          }],
          metadata: safeMetadata
        };

        if (!documentId) {
          throw new Error('No se encontró documentId para actualizar la respuesta');
        }

        await updateMutation.mutateAsync({
          responseId: documentId,
          data: updateData
        });
      } else {
        const createData: CreateModuleResponseDto = {
          researchId: researchId || '',
          participantId: participantId || '',
          questionKey: currentQuestionKey,
          responses: [{
            questionKey: currentQuestionKey,
            response: formattedResponse,
            timestamp,
            createdAt: now,
            updatedAt: undefined
          }],
          metadata: safeMetadata
        };

        await saveMutation.mutateAsync(createData);
      }

      // 🎯 SIMPLIFICADO: Sin WebSocket tracking

      endTiming();

    } catch (error) {
      setIsSaving(false);
      setOptimisticSavedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentQuestionKey);
        return newSet;
      });
    }
  }, [
    isSaving,
    isNavigating,
    isWelcomeScreen,
    existingResponse,
    currentQuestionKey,
    getCurrentFormData,
    moduleResponses,
    formsData?.stepsConfiguration,
    // 🎯 SIMPLIFICADO: Sin validaciones complejas
    startTiming,
    trackStepVisit,
    getTimingData,
    getJourneyData,
    researchId,
    participantId,
    saveMutation,
    updateMutation,
    hasExistingResponse,
    documentId,
    endTiming
  ]);

  return {
    buttonText: getButtonText(),
    isDisabled,
    handleClick
  };
};
