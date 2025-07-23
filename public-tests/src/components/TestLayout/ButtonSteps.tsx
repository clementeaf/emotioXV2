import React, { useState } from 'react';
import { useAvailableFormsQuery, useModuleResponsesQuery, useSaveModuleResponseMutation, useUpdateModuleResponseMutation } from '../../hooks/useApiQueries';
import { useDemographicValidation } from '../../hooks/useDemographicValidation';
import { useDisqualificationRedirect } from '../../hooks/useDisqualificationRedirect';
import { useEyeTrackingConfigQuery } from '../../hooks/useEyeTrackingConfigQuery';
import { useMonitoringWebSocket } from '../../hooks/useMonitoringWebSocket';
import { useResponseTiming } from '../../hooks/useResponseTiming';
import { useUserJourneyTracking } from '../../hooks/useUserJourneyTracking';
import { CreateModuleResponseDto, UpdateModuleResponseDto } from '../../lib/types';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { buildTimingMetadata } from '../../utils/timingMetadata';
import { buildUserJourneyMetadata } from '../../utils/userJourneyMetadata';
import { ButtonStepsProps } from './types';

export const ButtonSteps: React.FC<ButtonStepsProps> = ({
  currentQuestionKey,
  formData = {},
  isWelcomeScreen = false
}) => {
  const { researchId, participantId } = useTestStore();
  const { setCurrentQuestionKey, goToNextStep } = useStepStore();
  const { clearFormData } = useFormDataStore();
  const { getNextStep } = useStepStore();
  const nextStep = getNextStep();
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // 🎯 HOOKS PARA DESCALIFICACIÓN
  const { validateDemographics } = useDemographicValidation();
  const { redirectToDisqualification } = useDisqualificationRedirect();

  // 🎯 OBTENER CONFIGURACIÓN DE EYE-TRACKING
  const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');
  const shouldTrackTiming = eyeTrackingConfig?.parameterOptions?.saveResponseTimes || false;
  const shouldTrackUserJourney = eyeTrackingConfig?.parameterOptions?.saveUserJourney || false;

  // 🎯 WEBSOCKET PARA MONITOREO EN TIEMPO REAL
  const { sendParticipantStep } = useMonitoringWebSocket();

  const { data: moduleResponses } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  // Obtener los steps del backend
  const { data: formsData } = useAvailableFormsQuery(researchId || '');

  // Construir los steps usando el orden del backend
  const steps = React.useMemo(() => {
    if (formsData?.steps && formsData.stepsConfiguration && formsData.stepsConfiguration.length > 0) {
      const configMap = new Map();

      formsData.stepsConfiguration.forEach((stepConfig: any) => {
        configMap.set(stepConfig.questionKey, stepConfig);
      });

      // Usar el orden que viene del backend
      return formsData.steps
        .map(questionKey => {
          const stepConfig = configMap.get(questionKey);
          if (!stepConfig) {
            console.warn('[ButtonSteps] ⚠️ Step no encontrado en configuración:', questionKey);
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
              title = 'Pregunta CSAT';
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
        .filter(step => step !== null);
    }
    return [];
  }, [formsData?.steps, formsData?.stepsConfiguration]);

  // Obtener el estado de los steps para navegación
  const { getNextStep: getStoreNextStep } = useStepStore();
  const storeNextStep = getStoreNextStep();



  // Log para depuración
  console.log('[ButtonSteps] Estado actual:', {
    currentQuestionKey,
    nextStep,
    formData,
    isWelcomeScreen
  });

  const saveMutation = useSaveModuleResponseMutation({
    onSuccess: (data) => {
      // 🚨 ACTUALIZAR EL STORE INMEDIATAMENTE PARA AVANZAR EL STEP
      const store = useStepStore.getState();
      store.updateBackendResponses([
        ...store.backendResponses,
        { questionKey: currentQuestionKey, response: formData || {} }
      ]);
      setIsSaving(false);
      setTimeout(() => {
        goToNextStep();
      }, 100);
    },
    onError: () => {
      setIsSaving(false);
      // Manejo de error
    }
  });

  const updateMutation = useUpdateModuleResponseMutation({
    onSuccess: () => {
      setIsSaving(false);
      setIsNavigating(true);

      // Navegar automáticamente al siguiente step después de actualizar
      setTimeout(() => {
        console.log('[ButtonSteps] Navegando después de actualizar, nextStep:', nextStep);
        goToNextStep(); // Usar el método del store
        setIsNavigating(false);
      }, 1000);
    },
    onError: (error) => {
      console.error('Error al actualizar:', error);
      setIsSaving(false);
    }
  });

  const existingResponse = moduleResponses?.responses?.find(
    response => response.questionKey === currentQuestionKey
  );

  // 🎯 VERIFICAR SI HAY DATOS PERSISTIDOS LOCALMENTE
  const { getFormData } = useFormDataStore();
  const localData = getFormData(currentQuestionKey);
  const hasLocalData = localData && Object.keys(localData).length > 0;

  // 🎯 DETERMINAR SI EXISTE RESPUESTA (BACKEND O LOCAL)
  const hasExistingResponse = existingResponse || hasLocalData;

  // 🎯 LOG PARA DEBUG
  console.log('[ButtonSteps] 🔍 DETECCIÓN DE RESPUESTAS:', {
    currentQuestionKey,
    existingResponse: !!existingResponse,
    hasLocalData,
    hasExistingResponse,
    moduleResponses: moduleResponses?.responses?.map(r => r.questionKey),
    localData
  });

  // Obtener el ID del documento principal para actualizaciones
  const documentId = moduleResponses?.id;

  const getButtonText = (): string => {
    if (isWelcomeScreen) {
      return 'Comenzar';
    }

    if (isSaving) {
      return 'Guardando...';
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

  // 🎯 CRONOMETRAJE NO INTRUSIVO
  const { startTiming, endTiming, getTimingData, isTracking } = useResponseTiming({
    questionKey: currentQuestionKey,
    enabled: shouldTrackTiming // 🎯 USAR CONFIGURACIÓN REAL
  });

  // 🎯 TRACKING DE RECORRIDO NO INTRUSIVO
  const { trackStepVisit, getJourneyData, isTracking: isJourneyTracking } = useUserJourneyTracking({
    enabled: shouldTrackUserJourney, // 🎯 USAR CONFIGURACIÓN REAL
    researchId
  });

  const handleClick = async () => {
    if (isWelcomeScreen) {
      setIsNavigating(true);
      setTimeout(() => {
        // Navegar al siguiente step usando el store
        const store = useStepStore.getState();
        store.goToNextStep();
        setIsNavigating(false);
      }, 1000);
      return;
    }

    // 🎯 VERIFICAR DESCALIFICACIÓN PARA DEMOGRAPHICS
    if (currentQuestionKey === 'demographics' && formData && eyeTrackingConfig?.demographicQuestions) {
      // Convertir formData a formato string para validación
      const formValuesString = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, String(value || '')])
      ) as Record<string, string>;

      const validationResult = validateDemographics(formValuesString, eyeTrackingConfig.demographicQuestions);

      if (validationResult.isDisqualified) {
        console.log('[ButtonSteps] Usuario descalificado:', validationResult);

        // 🎯 NUEVO: GUARDAR ANTES DE REDIRIGIR
        try {
          const timestamp = new Date().toISOString();
          const now = new Date().toISOString();

          // 🎯 OBTENER DATOS DE TIMING
          const timingData = getTimingData();
          const enhancedMetadata = buildTimingMetadata(currentQuestionKey, timingData, {});

          // 🎯 OBTENER DATOS DE RECORRIDO
          const journeyData = getJourneyData();
          const finalMetadata = buildUserJourneyMetadata(journeyData, enhancedMetadata);

          // 🎯 AGREGAR INFORMACIÓN DE DESCALIFICACIÓN AL METADATA
          const disqualificationMetadata = {
            ...finalMetadata,
            isDisqualified: true,
            disqualificationReason: validationResult.reason,
            disqualificationType: 'demographics'
          };

          // 🎯 GUARDAR CON INFORMACIÓN DE DESCALIFICACIÓN
          const createData: CreateModuleResponseDto = {
            researchId: researchId || '',
            participantId: participantId || '',
            questionKey: currentQuestionKey,
            responses: [{
              questionKey: currentQuestionKey,
              response: formData || {},
              timestamp,
              createdAt: now
            }],
            metadata: disqualificationMetadata
          };

          await saveMutation.mutateAsync(createData);
          console.log('[ButtonSteps] ✅ Datos guardados antes de descalificación');
        } catch (error) {
          console.error('[ButtonSteps] ❌ Error guardando datos de descalificación:', error);
          // Continuar con redirección aunque falle el guardado
        }

        // 🎯 REDIRIGIR A DESCALIFICACIÓN
        redirectToDisqualification(eyeTrackingConfig, validationResult.reason);
        return; // 🎯 NO CONTINUAR CON EL FLUJO NORMAL
      }
    }

    // 🎯 NUEVO: VERIFICAR DESCALIFICACIÓN POR CUOTAS
    const quotaResult = useFormDataStore.getState().quotaResult;
    if (quotaResult && quotaResult.status === 'DISQUALIFIED_OVERQUOTA') {
      console.log('[ButtonSteps] Usuario descalificado por cuota:', quotaResult);

      // 🎯 GUARDAR ANTES DE REDIRIGIR
      try {
        const timestamp = new Date().toISOString();
        const now = new Date().toISOString();

        // 🎯 OBTENER DATOS DE TIMING
        const timingData = getTimingData();
        const enhancedMetadata = buildTimingMetadata(currentQuestionKey, timingData, {});

        // 🎯 OBTENER DATOS DE RECORRIDO
        const journeyData = getJourneyData();
        const finalMetadata = buildUserJourneyMetadata(journeyData, enhancedMetadata);

        // 🎯 AGREGAR INFORMACIÓN DE DESCALIFICACIÓN POR CUOTA AL METADATA
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

        // 🎯 GUARDAR CON INFORMACIÓN DE DESCALIFICACIÓN POR CUOTA
        const createData: CreateModuleResponseDto = {
          researchId: researchId || '',
          participantId: participantId || '',
          questionKey: currentQuestionKey,
          responses: [{
            questionKey: currentQuestionKey,
            response: formData || {},
            timestamp,
            createdAt: now
          }],
          metadata: quotaDisqualificationMetadata
        };

        await saveMutation.mutateAsync(createData);
        console.log('[ButtonSteps] ✅ Datos guardados antes de descalificación por cuota');
      } catch (error) {
        console.error('[ButtonSteps] ❌ Error guardando datos de descalificación por cuota:', error);
        // Continuar con redirección aunque falle el guardado
      }

      // 🎯 REDIRIGIR A DESCALIFICACIÓN POR CUOTA
      redirectToDisqualification(eyeTrackingConfig || undefined, quotaResult.reason || 'Cuota alcanzada');
      return; // 🎯 NO CONTINUAR CON EL FLUJO NORMAL
    }

    // 🎯 INICIAR CRONOMETRAJE (si está habilitado)
    startTiming();

    // 🎯 TRACKING DE RECORRIDO (si está habilitado)
    trackStepVisit(currentQuestionKey, 'complete');

    setIsSaving(true);

    try {
      const timestamp = new Date().toISOString();
      const now = new Date().toISOString();

      // 🎯 OBTENER DATOS DE TIMING
      const timingData = getTimingData();
      const enhancedMetadata = buildTimingMetadata(currentQuestionKey, timingData, {});

      // 🎯 OBTENER DATOS DE RECORRIDO
      const journeyData = getJourneyData();
      const finalMetadata = buildUserJourneyMetadata(journeyData, enhancedMetadata);

      if (hasExistingResponse) {
        // UPDATE: Actualizar la respuesta existente
        const updateData: UpdateModuleResponseDto = {
          researchId: researchId || '',
          participantId: participantId || '',
          questionKey: currentQuestionKey,
          responses: [{
            questionKey: currentQuestionKey,
            response: formData || {},
            timestamp,
            createdAt: existingResponse?.createdAt || now,
            updatedAt: now
          }],
          metadata: finalMetadata // 🎯 METADATA CON TIMING Y RECORRIDO
        };

        await updateMutation.mutateAsync({
          responseId: documentId || '',
          data: updateData
        });
      } else {
        // CREATE: Crear nueva respuesta
        const createData: CreateModuleResponseDto = {
          researchId: researchId || '',
          participantId: participantId || '',
          questionKey: currentQuestionKey,
          responses: [{
            questionKey: currentQuestionKey,
            response: formData || {},
            timestamp,
            createdAt: now,
            updatedAt: undefined
          }],
          metadata: finalMetadata // 🎯 METADATA CON TIMING Y RECORRIDO
        };

        await saveMutation.mutateAsync(createData);
      }

      // 🎯 ENVIAR EVENTO WEBSOCKET PARA MONITOREO EN TIEMPO REAL
      if (participantId) {
        const stepNumber = steps.findIndex(step => step.questionKey === currentQuestionKey) + 1;
        const totalSteps = steps.length;
        const progress = Math.round((stepNumber / totalSteps) * 100);

        sendParticipantStep(
          participantId,
          currentQuestionKey,
          stepNumber,
          totalSteps,
          progress,
          timingData?.duration
        );

        console.log('[ButtonSteps] 📡 Evento WebSocket enviado:', {
          participantId,
          stepName: currentQuestionKey,
          stepNumber,
          totalSteps,
          progress,
          duration: timingData?.duration
        });
      }

      // 🎯 FINALIZAR CRONOMETRAJE
      endTiming();

    } catch (error) {
      console.error('Error en la operación:', error);
      setIsSaving(false);
    }
  };

  return (
    <div className="flex justify-center mt-8">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${isDisabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }`}
      >
        {getButtonText()}
      </button>
    </div>
  );
};
