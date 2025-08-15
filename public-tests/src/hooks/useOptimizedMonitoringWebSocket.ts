import { useCallback, useEffect, useRef, useState } from 'react';
import { MonitoringEvent } from '../../../shared/interfaces/websocket-events.interface';
import { getWebsocketUrl } from '../config/dynamic-endpoints';
import { useTestStore } from '../stores/useTestStore';

/**
 * Hook optimizado para envío eficiente de eventos de monitoreo
 * - Debouncing para eventos frecuentes
 * - Queue para eventos offline
 * - Reconexión automática
 * - Logging reducido en producción
 */
export const useOptimizedMonitoringWebSocket = () => {
  const { researchId } = useTestStore();
  const wsRef = useRef<WebSocket | null>(null);
  const isConnectedRef = useRef(false);
  const eventQueueRef = useRef<MonitoringEvent[]>([]);
  const sentEventsRef = useRef<Set<string>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Estado para tracking de participante
  const [participantState, setParticipantState] = useState<{
    hasLoggedIn: boolean;
    lastStep: string | null;
    lastProgress: number;
  }>({
    hasLoggedIn: false,
    lastStep: null,
    lastProgress: 0
  });

  const isDev = import.meta.env.DEV;

  // 🎯 GENERAR ID ÚNICO PARA EVENTO (evitar duplicados)
  const generateEventId = useCallback((event: MonitoringEvent): string => {
    const timestamp = Date.now();
    const participantId = ('participantId' in event.data) ? event.data.participantId : 'unknown';
    return `${event.type}-${participantId}-${timestamp}`;
  }, []);

  // 🎯 LOGGING INTELIGENTE (reducido en producción)
  const log = useCallback((level: 'info' | 'warn' | 'error', message: string, data?: any) => {
    if (isDev || level === 'error') {
      console[level](`[OptimizedMonitoringWebSocket] ${message}`, data || '');
    }
  }, [isDev]);

  // 🎯 CONECTAR CON RECONEXIÓN AUTOMÁTICA
  const connect = useCallback(() => {
    if (!researchId || isConnectedRef.current) return;

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || getWebsocketUrl();
      log('info', `🔌 Conectando a WebSocket: ${wsUrl}`);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        log('info', '✅ WebSocket conectado exitosamente');
        isConnectedRef.current = true;

        // Enviar eventos en cola
        if (eventQueueRef.current.length > 0) {
          log('info', `📤 Enviando ${eventQueueRef.current.length} eventos en cola`);
          eventQueueRef.current.forEach(event => sendEventNow(event));
          eventQueueRef.current = [];
        }

        // Enviar evento de conexión
        if (researchId) {
          sendEventNow({
            type: 'MONITORING_CONNECT',
            data: {
              researchId,
              timestamp: new Date().toISOString()
            }
          });
        }
      };

      wsRef.current.onclose = (event) => {
        log('warn', `❌ WebSocket desconectado: ${event.code}`, event.reason);
        isConnectedRef.current = false;

        // Reconexión automática (con backoff)
        if (event.code !== 1000) { // No es cierre limpio
          const delay = Math.min(5000 * Math.pow(2, eventQueueRef.current.length / 10), 30000);
          reconnectTimeoutRef.current = setTimeout(() => connect(), delay);
        }
      };

      wsRef.current.onerror = (error) => {
        log('error', '❌ Error en WebSocket:', error);
        isConnectedRef.current = false;
      };

    } catch (error) {
      log('error', '❌ Error creando WebSocket:', error);
    }
  }, [researchId, log]);

  // 🎯 DESCONECTAR
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Limpiar debounce timers
    debounceTimersRef.current.forEach(timer => clearTimeout(timer));
    debounceTimersRef.current.clear();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmount');
      wsRef.current = null;
    }
    isConnectedRef.current = false;
  }, []);

  // 🎯 ENVIAR EVENTO INMEDIATAMENTE (sin debouncing)
  const sendEventNow = useCallback((event: MonitoringEvent) => {
    const eventId = generateEventId(event);
    
    // Evitar duplicados
    if (sentEventsRef.current.has(eventId)) {
      return false;
    }

    if (!wsRef.current || !isConnectedRef.current) {
      // Agregar a cola offline
      eventQueueRef.current.push(event);
      log('warn', `📋 Evento agregado a cola offline: ${event.type}`);
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify(event));
      sentEventsRef.current.add(eventId);
      
      // Limpiar cache de eventos enviados (mantener solo últimos 50)
      if (sentEventsRef.current.size > 50) {
        const firstItems = Array.from(sentEventsRef.current).slice(0, 25);
        sentEventsRef.current = new Set(Array.from(sentEventsRef.current).slice(25));
      }

      log('info', `✅ Evento enviado: ${event.type}`);
      return true;
    } catch (error) {
      log('error', '❌ Error enviando evento:', error);
      return false;
    }
  }, [generateEventId, log]);

  // 🎯 ENVIAR EVENTO CON DEBOUNCING (para eventos frecuentes)
  const sendEventDebounced = useCallback((event: MonitoringEvent, debounceMs = 1000) => {
    const participantId = ('participantId' in event.data) ? event.data.participantId : 'unknown';
    const questionKey = ('questionKey' in event.data) ? event.data.questionKey : 'default';
    const debounceKey = `${event.type}-${participantId}-${questionKey}`;
    
    // Limpiar timer existente
    const existingTimer = debounceTimersRef.current.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Crear nuevo timer
    const timer = setTimeout(() => {
      sendEventNow(event);
      debounceTimersRef.current.delete(debounceKey);
    }, debounceMs);

    debounceTimersRef.current.set(debounceKey, timer);
  }, [sendEventNow]);

  // 🎯 EVENTOS ESPECÍFICOS OPTIMIZADOS

  const sendParticipantLogin = useCallback((participantId: string, email?: string) => {
    // Evitar múltiples logins del mismo participante
    if (participantState.hasLoggedIn) {
      log('info', '⏭️ Login ya enviado, omitiendo duplicado');
      return false;
    }

    const success = sendEventNow({
      type: 'PARTICIPANT_LOGIN',
      data: {
        researchId: researchId || '',
        participantId,
        email,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    });

    if (success) {
      setParticipantState(prev => ({ ...prev, hasLoggedIn: true }));
    }

    return success;
  }, [researchId, sendEventNow, participantState.hasLoggedIn, log]);

  const sendParticipantStep = useCallback((
    participantId: string,
    stepName: string,
    stepNumber: number,
    totalSteps: number,
    progress: number,
    duration?: number
  ) => {
    // Solo enviar si hay cambio significativo
    if (participantState.lastStep === stepName && Math.abs(participantState.lastProgress - progress) < 5) {
      return false; // Cambio menor al 5%, no enviar
    }

    const success = sendEventDebounced({
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
    }, 2000); // Debounce de 2 segundos

    setParticipantState(prev => ({
      ...prev,
      lastStep: stepName,
      lastProgress: progress
    }));

    return success;
  }, [researchId, sendEventDebounced, participantState]);

  const sendParticipantResponseSaved = useCallback((
    participantId: string,
    questionKey: string,
    response: any,
    stepNumber: number,
    totalSteps: number,
    progress: number
  ) => {
    // Este evento es crítico, enviarlo inmediatamente pero con debounce corto
    return sendEventDebounced({
      type: 'PARTICIPANT_RESPONSE_SAVED',
      data: {
        researchId: researchId || '',
        participantId,
        questionKey,
        response,
        timestamp: new Date().toISOString(),
        stepNumber,
        totalSteps,
        progress
      }
    }, 500); // Debounce de 500ms
  }, [researchId, sendEventDebounced]);

  const sendParticipantCompleted = useCallback((
    participantId: string,
    totalDuration: number,
    responsesCount: number
  ) => {
    return sendEventNow({
      type: 'PARTICIPANT_COMPLETED',
      data: {
        researchId: researchId || '',
        participantId,
        totalDuration,
        timestamp: new Date().toISOString(),
        responsesCount
      }
    });
  }, [researchId, sendEventNow]);

  const sendParticipantDisqualified = useCallback((
    participantId: string,
    reason: string,
    demographicData: Record<string, string>,
    disqualificationType: 'demographics' | 'quota' | 'manual'
  ) => {
    return sendEventNow({
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
  }, [researchId, sendEventNow]);

  const sendParticipantQuotaExceeded = useCallback((
    participantId: string,
    quotaType: string,
    quotaValue: string,
    currentCount: number,
    maxQuota: number,
    demographicData: Record<string, string>
  ) => {
    return sendEventNow({
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
  }, [researchId, sendEventNow]);

  const sendParticipantError = useCallback((
    participantId: string,
    error: string,
    stepName?: string
  ) => {
    return sendEventNow({
      type: 'PARTICIPANT_ERROR',
      data: {
        researchId: researchId || '',
        participantId,
        error,
        stepName,
        timestamp: new Date().toISOString()
      }
    });
  }, [researchId, sendEventNow]);

  // 🎯 CONECTAR AL MONTAR
  useEffect(() => {
    if (researchId) {
      connect();
    }

    return disconnect;
  }, [researchId, connect, disconnect]);

  // 🎯 RESET STATE CUANDO CAMBIA RESEARCH
  useEffect(() => {
    setParticipantState({
      hasLoggedIn: false,
      lastStep: null,
      lastProgress: 0
    });
    sentEventsRef.current.clear();
  }, [researchId]);

  return {
    isConnected: isConnectedRef.current,
    queueLength: eventQueueRef.current.length,
    participantState,
    // Métodos optimizados
    sendParticipantLogin,
    sendParticipantStep,
    sendParticipantResponseSaved,
    sendParticipantCompleted,
    sendParticipantDisqualified,
    sendParticipantQuotaExceeded,
    sendParticipantError,
    // Control manual
    connect,
    disconnect
  };
};