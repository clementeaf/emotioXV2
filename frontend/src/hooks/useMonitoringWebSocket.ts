import { useCallback, useEffect, useRef } from 'react';
import {
  ParticipantLoginData,
  ParticipantResponseSavedData,
  ParticipantStepData,
  WebSocketEvent,
  WebSocketMessage
} from '../../../shared/src/types/websocket.types';

/**
 * Hook específico para WebSocket de monitoreo
 * Conecta al mismo endpoint que public-tests
 */
export const useMonitoringWebSocket = (researchId?: string) => {
  const ws = useRef<WebSocket | null>(null);
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    if (!researchId) {
      console.log('[MonitoringWebSocket] ⚠️ No hay researchId, no se puede conectar');
      return;
    }

    try {
      // 🎯 USAR ENDPOINT CORRECTO DE AWS
      const wsUrl = 'wss://w8dj7wxnl9.execute-api.us-east-1.amazonaws.com/dev';

      console.log('[MonitoringWebSocket] 🔌 Intentando conectar a:', wsUrl);

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[MonitoringWebSocket] ✅ Conectado al servidor de monitoreo');
        isConnectedRef.current = true;

        // 🎯 ENVIAR EVENTO DE CONEXIÓN DE MONITOREO
        sendEvent({
          event: WebSocketEvent.MONITORING_CONNECT,
          data: {
            researchId,
            timestamp: new Date().toISOString()
          }
        });
      };

      ws.current.onclose = (event) => {
        console.log('[MonitoringWebSocket] ❌ Desconectado del servidor de monitoreo:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        isConnectedRef.current = false;
      };

      ws.current.onerror = (error) => {
        console.error('[MonitoringWebSocket] ❌ Error en WebSocket:', error);
        isConnectedRef.current = false;
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;

          console.log('[MonitoringWebSocket] 📨 Mensaje recibido:', message.event);

          switch (message.event) {
            case WebSocketEvent.MONITORING_CONNECT:
              console.log('[MonitoringWebSocket] 🎯 MONITORING_CONNECT:', message.data);
              break;

            case WebSocketEvent.PARTICIPANT_LOGIN:
              const loginData = message.data as ParticipantLoginData;
              console.log('[MonitoringWebSocket] 🎯 PARTICIPANT_LOGIN:', loginData);
              // 🎯 AQUÍ PODRÍAS ACTUALIZAR EL ESTADO DEL DASHBOARD
              break;

            case WebSocketEvent.PARTICIPANT_STEP:
              const stepData = message.data as ParticipantStepData;
              console.log('[MonitoringWebSocket] 🎯 PARTICIPANT_STEP:', stepData);
              // 🎯 AQUÍ PODRÍAS ACTUALIZAR EL PROGRESO DEL PARTICIPANTE
              break;

            case WebSocketEvent.PARTICIPANT_RESPONSE_SAVED:
              const responseData = message.data as ParticipantResponseSavedData;
              console.log('[MonitoringWebSocket] 🎯 PARTICIPANT_RESPONSE_SAVED:', responseData);
              // 🎯 AQUÍ PODRÍAS ACTUALIZAR LAS RESPUESTAS Y PROGRESO
              break;

            case WebSocketEvent.PARTICIPANT_DISQUALIFIED:
              console.log('[MonitoringWebSocket] 🎯 PARTICIPANT_DISQUALIFIED:', message.data);
              break;

            case WebSocketEvent.PARTICIPANT_QUOTA_EXCEEDED:
              console.log('[MonitoringWebSocket] 🎯 PARTICIPANT_QUOTA_EXCEEDED:', message.data);
              break;

            case WebSocketEvent.PARTICIPANT_COMPLETED:
              console.log('[MonitoringWebSocket] 🎯 PARTICIPANT_COMPLETED:', message.data);
              break;

            case WebSocketEvent.PARTICIPANT_ERROR:
              console.log('[MonitoringWebSocket] 🎯 PARTICIPANT_ERROR:', message.data);
              break;

            default:
              console.log('[MonitoringWebSocket] ⚠️ Evento no manejado:', message.event);
          }
        } catch (error) {
          console.error('[MonitoringWebSocket] ❌ Error al procesar mensaje:', error);
        }
      };

    } catch (error) {
      console.error('[MonitoringWebSocket] ❌ Error al conectar:', error);
      isConnectedRef.current = false;
    }
  }, [researchId]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    isConnectedRef.current = false;
  }, []);

  const sendEvent = useCallback((message: WebSocketMessage) => {
    if (!ws.current || !isConnectedRef.current) {
      console.warn('[MonitoringWebSocket] ⚠️ WebSocket no conectado, evento no enviado:', message.event);
      return false;
    }

    try {
      ws.current.send(JSON.stringify(message));
      console.log('[MonitoringWebSocket] ✅ Evento enviado:', message.event);
      return true;
    } catch (error) {
      console.error('[MonitoringWebSocket] ❌ Error enviando evento:', error);
      return false;
    }
  }, []);

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
    sendEvent
  };
};
