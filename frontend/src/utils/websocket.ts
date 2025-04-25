import { useEffect, useRef } from 'react';

import apiEndpoints from '../config/api.config';
import { useAuth } from '../hooks/useAuth';

// Estado de la conexión
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

// Utilidad para el WebSocket
export const useWebSocketConnection = () => {
  const { token } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const statusRef = useRef<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Establecer la conexión
  const connect = () => {
    if (!token) {return;}
    
    try {
      // Cerrar la conexión existente si hay alguna
      if (wsRef.current) {
        wsRef.current.close();
      }

      statusRef.current = ConnectionStatus.CONNECTING;
      
      // Crear nueva conexión con el token como parámetro
      const httpUrl = apiEndpoints.baseURL;
      const wsProtoUrl = httpUrl.replace(/^http/, 'ws'); // Cambiar http:// a ws:// o https:// a wss://
      // Asumir ruta /ws y token como query param (ajustar si es diferente)
      const wsUrl = `${wsProtoUrl}/ws?token=${token}`;
      console.log('[WebSocket] Connecting to:', wsUrl); // Log para depuración
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket conectado');
        statusRef.current = ConnectionStatus.CONNECTED;
        
        // Programar refresh del token 5 minutos antes de que expire
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000; // Convertir a milisegundos
        const timeToExpiry = expiryTime - Date.now();
        const refreshTime = timeToExpiry - (5 * 60 * 1000); // 5 minutos antes
        
        if (tokenRefreshTimerRef.current) {
          clearTimeout(tokenRefreshTimerRef.current);
        }
        
        if (refreshTime > 0) {
          tokenRefreshTimerRef.current = setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                action: 'refreshToken',
                token
              }));
            }
          }, refreshTime);
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.action === 'tokenRefreshed' && data.token) {
            console.log('Token renovado recibido por WebSocket');
            // TODO: Implementar la actualización del token en el estado global de useAuth si es necesario.
            // Actualmente, esta lógica solo actualiza el token en el contexto del WebSocket.
          }
        } catch (error) {
          console.error('Error al procesar mensaje WebSocket:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('Error en WebSocket:', error);
        statusRef.current = ConnectionStatus.ERROR;
      };
      
      ws.onclose = () => {
        console.log('WebSocket desconectado');
        statusRef.current = ConnectionStatus.DISCONNECTED;
        
        // Reintentar conexión después de un tiempo
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000); // Reintentar después de 5 segundos
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Error al establecer conexión WebSocket:', error);
      statusRef.current = ConnectionStatus.ERROR;
    }
  };
  
  // Desconectar
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = null;
    }
    
    statusRef.current = ConnectionStatus.DISCONNECTED;
  };
  
  // Conectar al montar y desconectar al desmontar
  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [token]);
  
  return {
    status: statusRef.current,
    reconnect: connect,
    disconnect
  };
}; 