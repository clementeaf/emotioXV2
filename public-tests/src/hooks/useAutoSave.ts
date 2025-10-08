import React, { useCallback } from 'react';
import { useTestStore } from '../stores/useTestStore';
import { useFormDataStore } from '../stores/useFormDataStore';
import { useModuleResponsesQuery, useSaveModuleResponseMutation, useUpdateModuleResponseMutation } from './useApiQueries';
import { useEyeTrackingConfigQuery } from './useEyeTrackingConfigQuery';
import { useOptimizedMonitoringWebSocket } from './useOptimizedMonitoringWebSocket';
import { useUserJourneyTracking } from './useUserJourneyTracking';
import { useResponseTiming } from './useResponseTiming';
import { useAvailableFormsQuery } from './useApiQueries';

interface UseAutoSaveProps {
  currentQuestionKey: string;
}

export const useAutoSave = ({ currentQuestionKey }: UseAutoSaveProps) => {
  const { researchId, participantId } = useTestStore();
  const { getFormData } = useFormDataStore();
  
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

  // Obtener los steps del backend
  const { data: formsData } = useAvailableFormsQuery(researchId || '');

  // Construir los steps usando el orden del backend
  const steps = React.useMemo(() => {
    if (formsData?.steps && formsData?.stepsConfiguration) {
      return formsData.steps
        .map((step: { title: string; questionKey: string }) => {
          const config = formsData.stepsConfiguration[step.questionKey];
          return config ? { ...step, ...config } : null;
        })
        .filter((step: { title: string; questionKey: string } | null): step is NonNullable<typeof step> => step !== null);
    }
    return [];
  }, [formsData?.steps, formsData?.stepsConfiguration]);

  const saveMutation = useSaveModuleResponseMutation({
    onSuccess: () => {
      console.log('[useAutoSave] ✅ Respuesta guardada automáticamente para:', currentQuestionKey);
    },
    onError: (error) => {
      console.error('[useAutoSave] ❌ Error al guardar automáticamente:', error);
    }
  });

  const updateMutation = useUpdateModuleResponseMutation({
    onSuccess: () => {
      console.log('[useAutoSave] ✅ Respuesta actualizada automáticamente para:', currentQuestionKey);
    },
    onError: (error) => {
      console.error('[useAutoSave] ❌ Error al actualizar automáticamente:', error);
    }
  });

  // 🎯 CRONOMETRAJE NO INTRUSIVO
  const { startTiming, endTiming, getTimingData } = useResponseTiming({
    questionKey: currentQuestionKey,
    enabled: shouldTrackTiming
  });

  // 🎯 TRACKING DE RECORRIDO NO INTRUSIVO
  const { trackStepVisit, getJourneyData } = useUserJourneyTracking({
    enabled: shouldTrackUserJourney,
    researchId
  });

  const autoSave = useCallback(async () => {
    if (!researchId || !participantId) {
      console.warn('[useAutoSave] ⚠️ No hay researchId o participantId, no se puede guardar');
      return;
    }

    try {
      console.log('[useAutoSave] 🚀 Iniciando guardado automático para:', currentQuestionKey);
      
      // 🎯 OBTENER DATOS ACTUALES
      const currentFormData = getFormData(currentQuestionKey) || {};
      
      if (!currentFormData || Object.keys(currentFormData).length === 0) {
        console.warn('[useAutoSave] ⚠️ No hay datos para guardar');
        return;
      }

      // 🎯 TRACKING DE RECORRIDO
      if (shouldTrackUserJourney) {
        trackStepVisit(currentQuestionKey, 'visit');
      }

      // 🎯 CRONOMETRAJE
      if (shouldTrackTiming) {
        endTiming();
        const timingData = getTimingData();
        console.log('[useAutoSave] ⏱️ Timing data:', timingData);
      }

      // 🎯 METADATA SEGURO
      const finalMetadata = {
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

      // 🎯 FORMATO DE RESPUESTA OPTIMIZADO PARA EVITAR LÍMITES DE DYNAMODB
      const formatResponseData = (data: unknown): string | number | boolean | string[] | Record<string, string | number | boolean | null> | null => {
        if (data === null || data === undefined) return null;
        if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') return data;
        if (Array.isArray(data)) {
          // 🎯 LIMITAR ARRAYS A 10 ELEMENTOS MÁXIMO
          const limitedArray = data.slice(0, 10).map(item => String(item));
          return limitedArray;
        }
        if (typeof data === 'object') {
          const simpleObject: Record<string, string | number | boolean | null> = {};
          const entries = Object.entries(data as Record<string, unknown>);
          
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
              // 🎯 LIMITAR ARRAYS ANIDADOS A 3 ELEMENTOS MÁXIMO
              simpleObject[key] = value.slice(0, 3).map(item => String(item)).join(',');
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
      const timestamp = new Date().toISOString();
      const now = new Date().toISOString();

      // 🎯 VALIDACIÓN DE TAMAÑO PARA EVITAR LÍMITES DE DYNAMODB
      const responseSize = JSON.stringify(formattedResponse).length;
      if (responseSize > 10000) { // 10KB límite conservador
        console.warn('[useAutoSave] ⚠️ Respuesta muy grande, truncando datos:', responseSize, 'bytes');
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

      // 🎯 VERIFICAR SI EXISTE RESPUESTA
      const existingResponse = moduleResponses?.responses?.find(
        (moduleResponse: { questionKey: string }) => moduleResponse.questionKey === currentQuestionKey
      );
      const hasExistingResponse = !!existingResponse;
      const documentId = moduleResponses?.id;

      if (hasExistingResponse) {
        // UPDATE: Actualizar la respuesta existente - SOLO MANTENER LA RESPUESTA ACTUAL
        const updateData = {
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
        // CREATE: Crear nueva respuesta
        const createData = {
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

      // 🎯 ENVIAR EVENTO WEBSOCKET PARA MONITOREO EN TIEMPO REAL
      if (participantId) {
        const currentStepIndex = steps.findIndex((step: { questionKey: string }) => step.questionKey === currentQuestionKey);
        const progress = Math.round(((currentStepIndex + 1) / steps.length) * 100);

        sendParticipantResponseSaved(
          participantId,
          currentQuestionKey,
          currentFormData,
          currentStepIndex + 1,
          steps.length,
          progress
        );
      }

      console.log('[useAutoSave] ✅ Guardado automático completado para:', currentQuestionKey);

    } catch (error) {
      console.error('[useAutoSave] ❌ Error en guardado automático:', error);
    }
  }, [
    researchId,
    participantId,
    currentQuestionKey,
    getFormData,
    shouldTrackUserJourney,
    shouldTrackTiming,
    trackStepVisit,
    endTiming,
    getTimingData,
    moduleResponses,
    steps,
    saveMutation,
    updateMutation,
    sendParticipantResponseSaved
  ]);

  return { autoSave };
};
