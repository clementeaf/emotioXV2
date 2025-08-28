import { getWebsocketUrl } from '@/api/dynamic-endpoints';
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
      return;
    }

    try {
      // 🎯 USAR ENDPOINT CORRECTO DE AWS
      const wsUrl = getWebsocketUrl();


      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
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
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        isConnectedRef.current = false;
      };

      ws.current.onerror = (error) => {
        isConnectedRef.current = false;
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;


          switch (message.event) {
            case WebSocketEvent.MONITORING_CONNECT:
              break;

            case WebSocketEvent.PARTICIPANT_LOGIN:
              const loginData = message.data as ParticipantLoginData;
              // 🎯 AQUÍ PODRÍAS ACTUALIZAR EL ESTADO DEL DASHBOARD
              break;

            case WebSocketEvent.PARTICIPANT_STEP:
              const stepData = message.data as ParticipantStepData;
              // 🎯 AQUÍ PODRÍAS ACTUALIZAR EL PROGRESO DEL PARTICIPANTE
              break;

            case WebSocketEvent.PARTICIPANT_RESPONSE_SAVED:
              const responseData = message.data as ParticipantResponseSavedData;
              // 🎯 AQUÍ PODRÍAS ACTUALIZAR LAS RESPUESTAS Y PROGRESO
              break;

            case WebSocketEvent.PARTICIPANT_DISQUALIFIED:
              break;

            case WebSocketEvent.PARTICIPANT_QUOTA_EXCEEDED:
              break;

            case WebSocketEvent.PARTICIPANT_COMPLETED:
              break;

            case WebSocketEvent.PARTICIPANT_ERROR:
              break;

            default:
          }
        } catch (error) {
        }
      };

    } catch (error) {
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
      return false;
    }

    try {
      ws.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
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
