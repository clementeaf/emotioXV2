/**
 * Hook WebSocket Unificado para EmotioXV2
 * Combina useWebSocket.ts y useWebSocketConnection.ts en una sola implementación
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getWebsocketUrl } from '../api/config';
import { useAuth } from '@/providers/AuthProvider';

interface WebSocketMessage {
  action?: string;
  event?: string;
  data?: any;
  [key: string]: any;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastError: string | null;
}

const TOKEN_REFRESH_INTERVAL = 12 * 60 * 60 * 1000; // 12 horas
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000; // 1 segundo

/**
 * Hook unificado para WebSocket
 * Combina funcionalidad de conexión, reconexión y manejo de mensajes
 */
export function useWebSocketUnified() {
  const ws = useRef<WebSocket | null>(null);
  const { token } = useAuth();
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    lastError: null,
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!token) {
      setState(prev => ({ ...prev, lastError: 'No hay token de autenticación' }));
      return;
    }

    if (state.isConnecting) return;

    setState(prev => ({ ...prev, isConnecting: true, lastError: null }));

    try {
      const wsUrl = `${getWebsocketUrl()}?token=${token}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          reconnectAttempts: 0,
          lastError: null,
        }));

        // Iniciar intervalo de renovación de token
        tokenRefreshIntervalRef.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
              action: 'token.refresh',
              event: 'TOKEN_REFRESH',
              data: { token }
            }));
          }
        }, TOKEN_REFRESH_INTERVAL);
      };

      ws.current.onclose = (event) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));

        // Limpiar intervalo de renovación
        if (tokenRefreshIntervalRef.current) {
          clearInterval(tokenRefreshIntervalRef.current);
        }

        // Intentar reconectar si no fue un cierre intencional
        if (event.code !== 1000 && state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          scheduleReconnect();
        }
      };

      ws.current.onerror = (error) => {
        setState(prev => ({
          ...prev,
          lastError: 'Error de conexión WebSocket',
          isConnecting: false,
        }));
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          setState(prev => ({
            ...prev,
            lastError: 'Error al procesar mensaje del servidor',
          }));
        }
      };
    } catch (error) {
      setState(prev => ({
        ...prev,
        lastError: 'Error al crear conexión WebSocket',
        isConnecting: false,
      }));
    }
  }, [token, state.reconnectAttempts, state.isConnecting]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    // Manejar diferentes formatos de mensajes
    const action = message.action || message.event;

    switch (action) {
      case 'token.update':
      case 'TOKEN_REFRESHED':
        if (message.data?.token) {
          // Aquí podrías actualizar el token en el contexto de autenticación
        }
        break;

      case 'error':
      case 'ERROR':
        setState(prev => ({
          ...prev,
          lastError: message.data?.message || 'Error del servidor',
        }));
        break;

      default:
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      setState(prev => ({
        ...prev,
        lastError: 'No se pudo reconectar después de múltiples intentos',
      }));
      return;
    }

    // Backoff exponencial
    const delay = BASE_RECONNECT_DELAY * Math.pow(2, state.reconnectAttempts);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
      connect();
    }, delay);
  }, [connect, state.reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close(1000, 'Cierre intencional');
      ws.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (tokenRefreshIntervalRef.current) {
      clearInterval(tokenRefreshIntervalRef.current);
    }

    setState({
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      lastError: null,
    });
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    } else {
      setState(prev => ({
        ...prev,
        lastError: 'No se puede enviar mensaje: WebSocket desconectado',
      }));
      return false;
    }
  }, []);

  const requestTokenRefresh = useCallback(() => {
    return sendMessage({ action: 'token.refresh' });
  }, [sendMessage]);

  // Conectar automáticamente cuando hay token
  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  return {
    // Estado
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    reconnectAttempts: state.reconnectAttempts,
    lastError: state.lastError,

    // Métodos
    connect,
    disconnect,
    sendMessage,
    requestTokenRefresh,

    // Utilidades
    canSendMessage: state.isConnected && ws.current?.readyState === WebSocket.OPEN,
  };
}

export default useWebSocketUnified;
