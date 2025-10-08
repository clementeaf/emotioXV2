import React, { useState } from 'react';
import { useAvailableFormsQuery, useModuleResponsesQuery, useSaveModuleResponseMutation, useUpdateModuleResponseMutation } from '../../hooks/useApiQueries';
import { useDemographicValidation, type DemographicQuestions } from '../../hooks/useDemographicValidation';
import { useDisqualificationRedirect } from '../../hooks/useDisqualificationRedirect';
import { useEyeTrackingConfigQuery } from '../../hooks/useEyeTrackingConfigQuery';
import { useOptimizedMonitoringWebSocket } from '../../hooks/useOptimizedMonitoringWebSocket';
import { useResponseTiming } from '../../hooks/useResponseTiming';
import { useUserJourneyTracking } from '../../hooks/useUserJourneyTracking';
import { CreateModuleResponseDto, UpdateModuleResponseDto, StepConfiguration } from '../../lib/types';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { buildTimingMetadata } from '../../utils/timingMetadata';
import { buildUserJourneyMetadata } from '../../utils/userJourneyMetadata';
import { ButtonStepsProps } from './types';

export const ButtonSteps: React.FC<ButtonStepsProps> = ({
  currentQuestionKey,
  isWelcomeScreen = false
}) => {
  const { researchId, participantId } = useTestStore();
  const { goToNextStep } = useStepStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showOptimisticSuccess, setShowOptimisticSuccess] = useState(false);

  // 🚨 FIX: Obtener datos más recientes del store en lugar de usar prop
  const { getFormData } = useFormDataStore();
  const getCurrentFormData = () => getFormData(currentQuestionKey) || {};

  // 🎯 HOOKS PARA DESCALIFICACIÓN
  const { validateDemographics } = useDemographicValidation();
  const { redirectToDisqualification } = useDisqualificationRedirect();

  // 🎯 OBTENER CONFIGURACIÓN DE EYE-TRACKING
  const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');
  const shouldTrackTiming = eyeTrackingConfig?.parameterOptions?.saveResponseTimes || false;
  const shouldTrackUserJourney = eyeTrackingConfig?.parameterOptions?.saveUserJourney || false;

  // 🎯 WEBSOCKET OPTIMIZADO PARA MONITOREO EN TIEMPO REAL
  const { sendParticipantStep, sendParticipantResponseSaved } = useOptimizedMonitoringWebSocket();

  const { data: moduleResponses } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  // 🎯 ESTADO OPTIMISTA LOCAL PARA RESPUESTAS GUARDADAS
  const [, setOptimisticSavedQuestions] = useState<Set<string>>(new Set());

  // Obtener los steps del backend
  const { data: formsData } = useAvailableFormsQuery(researchId || '');

  // Construir los steps usando el orden del backend
  const steps = React.useMemo(() => {
    if (formsData?.steps && formsData.stepsConfiguration && formsData.stepsConfiguration.length > 0) {
      const configMap = new Map();

      formsData.stepsConfiguration.forEach((stepConfig: StepConfiguration) => {
        configMap.set(stepConfig.questionKey, stepConfig);
      });

      // Usar el orden que viene del backend
      return formsData.steps
        .map((questionKey: string) => {
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
      // 🎯 ACTUALIZACIÓN OPTIMISTA: marcar respuesta como guardada inmediatamente
      const { updateBackendResponses } = useStepStore.getState();
      const currentBackendResponses = useStepStore.getState().backendResponses;
      
      // Agregar o actualizar la respuesta actual en el store
      const newResponse = {
        questionKey: currentQuestionKey,
        response: getCurrentFormData()
      };
      
      const updatedResponses = [
        ...currentBackendResponses.filter((r: unknown) => (r as { questionKey?: string }).questionKey !== currentQuestionKey),
        newResponse
      ];
      
      updateBackendResponses(updatedResponses);
      
      console.log('[ButtonSteps] ✅ Actualización optimista aplicada para:', currentQuestionKey);

      // 🎯 ENVIAR EVENTO WEBSOCKET DE RESPUESTA GUARDADA
      if (participantId) {
        const currentStepIndex = steps.findIndex((step: { questionKey: string }) => step.questionKey === currentQuestionKey);
        const progress = Math.round(((currentStepIndex + 1) / steps.length) * 100);

        sendParticipantResponseSaved(
          participantId,
          currentQuestionKey,
          getCurrentFormData(),
          currentStepIndex + 1,
          steps.length,
          progress
        );
      }

      setIsSaving(false);
      
      // 🎯 NAVEGACIÓN SEGURA - VERIFICAR QUE NO HAYA CAMBIOS DE NAVEGACIÓN MANUAL
      setTimeout(() => {
        const store = useStepStore.getState();
        const currentStep = store.currentQuestionKey;
        
        console.log('[ButtonSteps] 🔄 Navegación automática después de CREATE:', {
          fromStep: currentQuestionKey,
          currentStepInStore: currentStep,
          shouldNavigate: currentStep === currentQuestionKey
        });
        
        // 🛡️ SOLO NAVEGAR SI SEGUIMOS EN EL MISMO STEP (no navegación manual del usuario)
        if (currentStep === currentQuestionKey) {
          console.log('[ButtonSteps] ➡️ Ejecutando goToNextStep()...');
          goToNextStep();
        } else {
          console.log('[ButtonSteps] ⏸️ No navegando - usuario cambió de step manualmente');
        }
      }, 300);
    },
    onError: () => {
      setIsSaving(false);
      // 🎯 REVERTIR ESTADO OPTIMISTA EN CASO DE ERROR
      setOptimisticSavedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentQuestionKey);
        return newSet;
      });
    }
  });

  const updateMutation = useUpdateModuleResponseMutation({
    onSuccess: () => {
      // 🎯 ENVIAR EVENTO WEBSOCKET DE RESPUESTA ACTUALIZADA
      if (participantId) {
        const currentStepIndex = steps.findIndex((step: { questionKey: string }) => step.questionKey === currentQuestionKey);
        const progress = Math.round(((currentStepIndex + 1) / steps.length) * 100);

        sendParticipantResponseSaved(
          participantId,
          currentQuestionKey,
          getCurrentFormData(),
          currentStepIndex + 1,
          steps.length,
          progress
        );
      }

      setIsSaving(false);
      setIsNavigating(true);

      // 🎯 NAVEGACIÓN SEGURA DESPUÉS DE UPDATE
      setTimeout(() => {
        const store = useStepStore.getState();
        const currentStep = store.currentQuestionKey;
        
        console.log('[ButtonSteps] 🔄 Navegación automática después de UPDATE:', {
          fromStep: currentQuestionKey,
          currentStepInStore: currentStep,
          shouldNavigate: currentStep === currentQuestionKey
        });
        
        // 🛡️ SOLO NAVEGAR SI SEGUIMOS EN EL MISMO STEP
        if (currentStep === currentQuestionKey) {
          console.log('[ButtonSteps] ➡️ Ejecutando goToNextStep()...');
          goToNextStep();
        } else {
          console.log('[ButtonSteps] ⏸️ No navegando - usuario cambió de step manualmente');
        }
        setIsNavigating(false);
      }, 500);
    },
    onError: (error) => {
      console.error('Error al actualizar:', error);
      setIsSaving(false);
      // 🎯 REVERTIR ESTADO OPTIMISTA EN CASO DE ERROR (aunque este es update)
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

  // 🎯 DETERMINAR SI EXISTE RESPUESTA (SOLO BACKEND - NO ESTADO OPTIMISTA PARA DETECCIÓN)
  const hasExistingResponse = !!existingResponse;

  // Obtener el ID del documento principal para actualizaciones
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

  // 🎯 CRONOMETRAJE NO INTRUSIVO
  const { startTiming, endTiming, getTimingData } = useResponseTiming({
    questionKey: currentQuestionKey,
    enabled: shouldTrackTiming // 🎯 USAR CONFIGURACIÓN REAL
  });

  // 🎯 TRACKING DE RECORRIDO NO INTRUSIVO
  const { trackStepVisit, getJourneyData } = useUserJourneyTracking({
    enabled: shouldTrackUserJourney, // 🎯 USAR CONFIGURACIÓN REAL
    researchId
  });

  const handleClick = async () => {
    // 🛡️ PROTECCIÓN CONTRA DOBLE-CLICK
    if (isSaving || isNavigating) {
      return;
    }

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

    // 🎯 UI OPTIMISTA: FEEDBACK INMEDIATO
    setShowOptimisticSuccess(true);
    setTimeout(() => setShowOptimisticSuccess(false), 1500);
    
    // Solo agregar a optimista si realmente no existe en backend
    if (!existingResponse) {
      setOptimisticSavedQuestions(prev => new Set(prev).add(currentQuestionKey));
    }

    // 🎯 VERIFICAR DESCALIFICACIÓN PARA DEMOGRAPHICS
    const currentFormData = getCurrentFormData();
    if (currentQuestionKey === 'demographics' && currentFormData && Object.keys(currentFormData).length > 0 && eyeTrackingConfig?.demographicQuestions) {
      // Convertir formData a formato string para validación
      const formValuesString = Object.fromEntries(
        Object.entries(currentFormData).map(([key, value]) => [key, String(value || '')])
      ) as Record<string, string>;

      const validationResult = validateDemographics(formValuesString, eyeTrackingConfig.demographicQuestions as DemographicQuestions);

      if (validationResult.isDisqualified) {
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

          // 🎯 OPTIMIZAR DATOS DEMOGRÁFICOS PARA EVITAR LÍMITES DE DYNAMODB
          const optimizeFormData = (data: Record<string, unknown>): Record<string, unknown> => {
            const optimized: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(data)) {
              if (typeof value === 'string') {
                // 🎯 LIMITAR STRINGS A 100 CARACTERES MÁXIMO
                optimized[key] = value.length > 100 ? value.substring(0, 100) + '...' : value;
              } else if (Array.isArray(value)) {
                // 🎯 LIMITAR ARRAYS A 10 ELEMENTOS MÁXIMO
                optimized[key] = value.slice(0, 10);
              } else if (typeof value === 'object' && value !== null) {
                // 🎯 LIMITAR OBJETOS A 5 PROPIEDADES MÁXIMO
                const entries = Object.entries(value as Record<string, unknown>);
                optimized[key] = Object.fromEntries(entries.slice(0, 5));
              } else {
                optimized[key] = value;
              }
            }
            return optimized;
          };

          const optimizedFormData = optimizeFormData(currentFormData);

          // 🎯 GUARDAR CON INFORMACIÓN DE DESCALIFICACIÓN
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
            response: currentFormData,
            timestamp,
            createdAt: now
          }],
          metadata: quotaDisqualificationMetadata
        };

        await saveMutation.mutateAsync(createData);
      } catch (error) {
        console.error('[ButtonSteps] ❌ Error guardando datos de descalificación por cuota:', error);
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

      // 🎯 FALLBACK: Asegurar que metadata cumpla con ResponseMetadataSchema
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

      // 🎯 CONVERTIR currentFormData AL FORMATO CORRECTO PARA BACKEND - OPTIMIZADO PARA DYNAMODB
      const formatResponseData = (data: unknown): string | number | boolean | string[] | Record<string, string | number | boolean | null> | null => {
        if (data === null || data === undefined) {
          return null;
        }
        
        if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
          return data;
        }
        
        if (Array.isArray(data)) {
          // 🎯 LIMITAR ARRAYS A 10 ELEMENTOS MÁXIMO
          const limitedArray = data.slice(0, 10).map(item => String(item));
          return limitedArray;
        }
        
        if (typeof data === 'object') {
          // Convertir objeto complejo a objeto simple con valores primitivos - OPTIMIZADO
          const simpleObject: Record<string, string | number | boolean | null> = {};
          const entries = Object.entries(data as Record<string, unknown>);
          
          // 🎯 EXTRAER LÍMITE DINÁMICO PARA SMARTVOC NEV
          let maxSelections = 3; // Fallback por defecto
          if (currentQuestionKey === 'smartvoc_nev') {
            // Obtener instrucciones del backend para extraer maxSelections
            const currentStepConfig = formsData?.stepsConfiguration?.find(
              (config: any) => config.questionKey === currentQuestionKey
            );
            const instructions = String(currentStepConfig?.contentConfiguration?.instructions || '');
            
            // 🎯 EXTRAER maxSelections DE LAS INSTRUCCIONES (misma lógica que SmartVOCRenderers.tsx)
            const extractMaxSelections = (text: string): number => {
              const patterns = [
                /selecciona\s+maximo\s+(\d+)\s+emociones/i,
                /hasta\s+(\d+)/i,
                /máximo\s+(\d+)/i,
                /máx\s+(\d+)/i,
                /max\s+(\d+)/i,
                /selecciona\s+hasta\s+(\d+)/i,
                /selecciona\s+máximo\s+(\d+)/i,
                /selecciona\s+(\d+)\s+emociones/i,
                /(\d+)\s+emociones/i
              ];
              
              for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                  const number = parseInt(match[1], 10);
                  if (number > 0 && number <= 10) {
                    return number;
                  }
                }
              }
              return 4; // Fallback para SmartVOC NEV
            };
            
            maxSelections = extractMaxSelections(instructions);
            console.log('[ButtonSteps] 🎯 SmartVOC NEV - maxSelections extraído:', maxSelections, 'de instrucciones:', instructions);
          }
          
          // 🎯 LIMITAR OBJETOS A 5 PROPIEDADES MÁXIMO Y VALORES CORTOS
          for (const [key, value] of entries.slice(0, 5)) {
            if (value === null || value === undefined) {
              simpleObject[key] = null;
            } else if (typeof value === 'string') {
              // 🎯 LIMITAR STRINGS A 100 CARACTERES MÁXIMO
              simpleObject[key] = value.length > 100 ? value.substring(0, 100) + '...' : value;
            } else if (typeof value === 'number' || typeof value === 'boolean') {
              simpleObject[key] = value;
            } else if (Array.isArray(value)) {
              // 🎯 USAR LÍMITE DINÁMICO PARA SMARTVOC NEV, 3 PARA OTROS
              const arrayLimit = currentQuestionKey === 'smartvoc_nev' ? maxSelections : 3;
              simpleObject[key] = value.slice(0, arrayLimit).map(item => String(item)).join(',');
              console.log('[ButtonSteps] 🎯 Array limitado a:', arrayLimit, 'elementos para', currentQuestionKey);
            } else if (typeof value === 'object') {
              // 🎯 LIMITAR OBJETOS ANIDADOS A JSON COMPACTO
              const jsonStr = JSON.stringify(value);
              simpleObject[key] = jsonStr.length > 200 ? jsonStr.substring(0, 200) + '...' : jsonStr;
            } else {
              simpleObject[key] = String(value).substring(0, 100);
            }
          }
          return simpleObject;
        }
        
        return String(data).substring(0, 100);
      };

      let formattedResponse = formatResponseData(currentFormData);

      // 🎯 VALIDACIÓN DE TAMAÑO PARA EVITAR LÍMITES DE DYNAMODB
      const responseSize = JSON.stringify(formattedResponse).length;
      if (responseSize > 5000) { // 5KB límite más estricto para respuestas individuales
        console.warn('[ButtonSteps] ⚠️ Respuesta muy grande, truncando datos:', responseSize, 'bytes');
        // Truncar aún más si es necesario
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

      // 🎯 VALIDACIÓN ADICIONAL: VERIFICAR TAMAÑO DEL DOCUMENTO COMPLETO
      const currentDocumentSize = moduleResponses ? JSON.stringify(moduleResponses).length : 0;
      const estimatedNewSize = currentDocumentSize + responseSize;
      
      if (estimatedNewSize > 350000) { // 350KB límite conservador (400KB es el máximo de DynamoDB)
        console.warn('[ButtonSteps] ⚠️ Documento completo muy grande, aplicando truncamiento agresivo:', estimatedNewSize, 'bytes');
        
        // 🎯 TRUNCAMIENTO AGRESIVO PARA EVITAR LÍMITE DE DYNAMODB
        if (typeof formattedResponse === 'object' && formattedResponse !== null) {
          const aggressiveTruncation: Record<string, string | number | boolean | null> = {};
          for (const [key, value] of Object.entries(formattedResponse).slice(0, 2)) { // Solo 2 propiedades
            if (typeof value === 'string') {
              aggressiveTruncation[key] = value.substring(0, 25); // Solo 25 caracteres
            } else {
              aggressiveTruncation[key] = value;
            }
          }
          formattedResponse = aggressiveTruncation;
        }
      }

      if (hasExistingResponse) {
        // UPDATE: Actualizar la respuesta existente
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
          metadata: safeMetadata // 🎯 METADATA SEGURO QUE CUMPLE CON ESQUEMA
        };

        // 🚨 DEBUG: Log de datos que se envían
        console.log('[ButtonSteps] 🔍 Datos UPDATE que se envían:', {
          updateData,
          documentId,
          researchId,
          participantId,
          currentQuestionKey,
          currentFormData: currentFormData,
          currentFormDataType: typeof currentFormData,
          currentFormDataKeys: Object.keys(currentFormData || {})
        });

        // 🚨 VALIDACIÓN: Verificar que documentId existe
        if (!documentId) {
          throw new Error('No se encontró documentId para actualizar la respuesta');
        }

        await updateMutation.mutateAsync({
          responseId: documentId,
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
            response: formattedResponse,
            timestamp,
            createdAt: now,
            updatedAt: undefined
          }],
          metadata: safeMetadata // 🎯 METADATA SEGURO QUE CUMPLE CON ESQUEMA
        };

        await saveMutation.mutateAsync(createData);
      }

      // 🎯 ENVIAR EVENTO WEBSOCKET PARA MONITOREO EN TIEMPO REAL
      if (participantId) {
        const stepNumber = steps.findIndex((step: { questionKey: string }) => step.questionKey === currentQuestionKey) + 1;
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
      }

      // 🎯 FINALIZAR CRONOMETRAJE
      endTiming();

    } catch (error) {
      console.error('Error en la operación:', error);
      setIsSaving(false);
      // 🎯 REVERTIR ESTADO OPTIMISTA EN CASO DE ERROR GENERAL
      setOptimisticSavedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentQuestionKey);
        return newSet;
      });
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
