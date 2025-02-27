import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface WebSocketMessage {
  action: string;
  [key: string]: any;
}

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const { token, updateToken } = useAuth();
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseDelay = 1000; // 1 segundo

  const connect = useCallback(() => {
    if (!token) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempts.current = 0;
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      scheduleReconnect();
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.action) {
          case 'token.update':
            if (message.token) {
              updateToken(message.token);
            }
            break;
          // Manejar otros tipos de mensajes aquí
          default:
            console.log('Unhandled message type:', message);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };
  }, [token, updateToken]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    // Exponential backoff
    const delay = baseDelay * Math.pow(2, reconnectAttempts.current);
    
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    reconnectTimeout.current = setTimeout(() => {
      reconnectAttempts.current++;
      connect();
    }, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);

  const requestTokenRefresh = useCallback(() => {
    sendMessage({ action: 'token.refresh' });
  }, [sendMessage]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    sendMessage,
    requestTokenRefresh,
    isConnected: ws.current?.readyState === WebSocket.OPEN,
  };
} 