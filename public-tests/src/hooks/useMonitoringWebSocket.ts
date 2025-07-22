import { useCallback, useEffect, useRef } from 'react';
import { MonitoringEvent } from '../../../shared/interfaces/websocket-events.interface';
import { useTestStore } from '../stores/useTestStore';

/**
 * Hook para enviar eventos de monitoreo vía WebSocket
 * Desde public-tests hacia el dashboard
 */
export const useMonitoringWebSocket = () => {
  const { researchId } = useTestStore();
  const wsRef = useRef<WebSocket | null>(null);
  const isConnectedRef = useRef(false);

  // 🎯 CONECTAR AL WEBSOCKET
  const connect = useCallback(() => {
    if (!researchId) return;

    try {
      // 🎯 USAR import.meta.env EN LUGAR DE process.env PARA VITE
      // 🎯 CORREGIR URL: NO AGREGAR /monitoring AL WEBSOCKET
      const wsUrl = import.meta.env.VITE_WS_URL || 'wss://w8dj7wxnl9.execute-api.us-east-1.amazonaws.com/dev';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[MonitoringWebSocket] ✅ Conectado al servidor de monitoreo');
        isConnectedRef.current = true;

        // 🎯 ENVIAR EVENTO DE CONEXIÓN
        sendEvent({
          type: 'MONITORING_CONNECT',
          data: {
            researchId,
            timestamp: new Date().toISOString()
          }
        });
      };

      wsRef.current.onclose = () => {
        console.log('[MonitoringWebSocket] ❌ Desconectado del servidor de monitoreo');
        isConnectedRef.current = false;
      };

      wsRef.current.onerror = (error) => {
        console.error('[MonitoringWebSocket] ❌ Error en WebSocket:', error);
        isConnectedRef.current = false;
      };

    } catch (error) {
      console.error('[MonitoringWebSocket] ❌ Error al conectar:', error);
    }
  }, [researchId]);

  // 🎯 DESCONECTAR
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    isConnectedRef.current = false;
  }, []);

  // 🎯 ENVIAR EVENTO
  const sendEvent = useCallback((event: MonitoringEvent) => {
    if (!wsRef.current || !isConnectedRef.current) {
      console.warn('[MonitoringWebSocket] ⚠️ WebSocket no conectado, evento no enviado:', event.type);
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify(event));
      console.log('[MonitoringWebSocket] ✅ Evento enviado:', event.type);
      return true;
    } catch (error) {
      console.error('[MonitoringWebSocket] ❌ Error enviando evento:', error);
      return false;
    }
  }, []);

  // 🎯 EVENTOS ESPECÍFICOS
  const sendParticipantLogin = useCallback((participantId: string, email?: string) => {
    return sendEvent({
      type: 'PARTICIPANT_LOGIN',
      data: {
        researchId: researchId || '',
        participantId,
        email,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ipAddress: undefined // Se obtiene del servidor
      }
    });
  }, [researchId, sendEvent]);

  const sendParticipantStep = useCallback((
    participantId: string,
    stepName: string,
    stepNumber: number,
    totalSteps: number,
    progress: number,
    duration?: number
  ) => {
    return sendEvent({
      type: 'PARTICIPANT_STEP',
      data: {
        researchId: researchId || '',
        participantId,
        stepName,
        stepNumber,
        totalSteps,
        progress,
        timestamp: new Date().toISOString(),
        duration
      }
    });
  }, [researchId, sendEvent]);

  const sendParticipantDisqualified = useCallback((
    participantId: string,
    reason: string,
    demographicData: Record<string, string>,
    disqualificationType: 'demographics' | 'quota' | 'manual'
  ) => {
    return sendEvent({
      type: 'PARTICIPANT_DISQUALIFIED',
      data: {
        researchId: researchId || '',
        participantId,
        reason,
        demographicData,
        timestamp: new Date().toISOString(),
        disqualificationType
      }
    });
  }, [researchId, sendEvent]);

  const sendParticipantQuotaExceeded = useCallback((
    participantId: string,
    quotaType: string,
    quotaValue: string,
    currentCount: number,
    maxQuota: number,
    demographicData: Record<string, string>
  ) => {
    return sendEvent({
      type: 'PARTICIPANT_QUOTA_EXCEEDED',
      data: {
        researchId: researchId || '',
        participantId,
        quotaType: quotaType as any,
        quotaValue,
        currentCount,
        maxQuota,
        demographicData,
        timestamp: new Date().toISOString()
      }
    });
  }, [researchId, sendEvent]);

  const sendParticipantCompleted = useCallback((
    participantId: string,
    totalDuration: number,
    responsesCount: number
  ) => {
    return sendEvent({
      type: 'PARTICIPANT_COMPLETED',
      data: {
        researchId: researchId || '',
        participantId,
        totalDuration,
        timestamp: new Date().toISOString(),
        responsesCount
      }
    });
  }, [researchId, sendEvent]);

  const sendParticipantError = useCallback((
    participantId: string,
    error: string,
    stepName?: string
  ) => {
    return sendEvent({
      type: 'PARTICIPANT_ERROR',
      data: {
        researchId: researchId || '',
        participantId,
        error,
        stepName,
        timestamp: new Date().toISOString()
      }
    });
  }, [researchId, sendEvent]);

  // 🎯 CONECTAR AL MONTAR
  useEffect(() => {
    if (researchId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [researchId, connect, disconnect]);

  return {
    isConnected: isConnectedRef.current,
    sendParticipantLogin,
    sendParticipantStep,
    sendParticipantDisqualified,
    sendParticipantQuotaExceeded,
    sendParticipantCompleted,
    sendParticipantError
  };
};
