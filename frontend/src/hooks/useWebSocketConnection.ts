import { useCallback, useEffect, useRef } from 'react';

import {
  ParticipantLoginData,
  ParticipantResponseSavedData,
  ParticipantStepData,
  WebSocketEvent,
  WebSocketMessage
} from '../../../shared/src/types/websocket.types';
import { useAuth } from '../providers/AuthProvider';

const TOKEN_REFRESH_INTERVAL = 12 * 60 * 60 * 1000; // 12 horas

export const useWebSocketConnection = () => {
  const ws = useRef<WebSocket | null>(null);
  const { token } = useAuth();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!token) { return; }

    const wsUrl = `wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      // // console.log('WebSocket conectado');
      // Iniciar el intervalo de renovación del token
      tokenRefreshIntervalRef.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            event: WebSocketEvent.TOKEN_REFRESH,
            data: { token }
          }));
        }
      }, TOKEN_REFRESH_INTERVAL);
    };

    ws.current.onclose = () => {
      // // console.log('WebSocket desconectado');
      // Limpiar el intervalo de renovación del token
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
      // Intentar reconectar después de 5 segundos
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };

    ws.current.onerror = (error) => {
      console.error('Error en WebSocket:', error);
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;

        switch (message.event) {
          case WebSocketEvent.TOKEN_REFRESHED:
            const { token: newToken } = message.data as { token: string };
            // // console.log('WebSocket recibió token actualizado (no se actualizó en useAuth)');
            break;
          case WebSocketEvent.ERROR:
            console.error('Error del servidor:', message.data);
            break;

          // 🎯 MONITORING EVENTS
          case WebSocketEvent.MONITORING_CONNECT:
            console.log('[WebSocket] 🎯 MONITORING_CONNECT:', message.data);
            break;

          case WebSocketEvent.PARTICIPANT_LOGIN:
            const loginData = message.data as ParticipantLoginData;
            console.log('[WebSocket] 🎯 PARTICIPANT_LOGIN:', loginData);
            // 🎯 AQUÍ PODRÍAS ACTUALIZAR EL ESTADO DEL DASHBOARD
            break;

          case WebSocketEvent.PARTICIPANT_STEP:
            const stepData = message.data as ParticipantStepData;
            console.log('[WebSocket] 🎯 PARTICIPANT_STEP:', stepData);
            // 🎯 AQUÍ PODRÍAS ACTUALIZAR EL PROGRESO DEL PARTICIPANTE
            break;

          case WebSocketEvent.PARTICIPANT_RESPONSE_SAVED:
            const responseData = message.data as ParticipantResponseSavedData;
            console.log('[WebSocket] 🎯 PARTICIPANT_RESPONSE_SAVED:', responseData);
            // 🎯 AQUÍ PODRÍAS ACTUALIZAR LAS RESPUESTAS Y PROGRESO
            break;

          case WebSocketEvent.PARTICIPANT_DISQUALIFIED:
            console.log('[WebSocket] 🎯 PARTICIPANT_DISQUALIFIED:', message.data);
            break;

          case WebSocketEvent.PARTICIPANT_QUOTA_EXCEEDED:
            console.log('[WebSocket] 🎯 PARTICIPANT_QUOTA_EXCEEDED:', message.data);
            break;

          case WebSocketEvent.PARTICIPANT_COMPLETED:
            console.log('[WebSocket] 🎯 PARTICIPANT_COMPLETED:', message.data);
            break;

          case WebSocketEvent.PARTICIPANT_ERROR:
            console.log('[WebSocket] 🎯 PARTICIPANT_ERROR:', message.data);
            break;
        }
      } catch (error) {
        console.error('Error al procesar mensaje:', error);
      }
    };
  }, [token]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (tokenRefreshIntervalRef.current) {
      clearInterval(tokenRefreshIntervalRef.current);
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket no está conectado');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    sendMessage,
    isConnected: ws.current?.readyState === WebSocket.OPEN
  };
};
