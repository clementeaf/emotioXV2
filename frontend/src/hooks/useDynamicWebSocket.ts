import { useCallback, useEffect, useRef, useState } from 'react';
import { DYNAMIC_API_ENDPOINTS } from '../api/dynamic-endpoints';
import { useAuth } from '../providers/AuthProvider';

/**
 * Hook que usa endpoints dinámicos para WebSocket
 * Carga las URLs desde el servidor para mantener sincronización
 */
export const useDynamicWebSocket = (researchId: string) => {
  const { token: contextToken } = useAuth();
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [endpoints, setEndpoints] = useState<any>(null);
  const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(true);

  // 🎯 FALLBACK: OBTENER TOKEN DEL LOCALSTORAGE SI EL CONTEXTO NO FUNCIONA
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setLocalToken(storedToken);
  }, []);

  // 🎯 USAR TOKEN DEL CONTEXTO O FALLBACK AL LOCALSTORAGE
  const token = contextToken || localToken;

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 🎯 CARGAR ENDPOINTS DINÁMICOS
  useEffect(() => {
    const loadEndpoints = () => {
      try {
        const dynamicEndpoints = DYNAMIC_API_ENDPOINTS;
        setEndpoints(dynamicEndpoints);
      } catch (error) {
        setEndpoints(null);
      } finally {
        setIsLoadingEndpoints(false);
      }
    };

    loadEndpoints();
  }, []);

  // 🎯 CONECTAR AL WEBSOCKET CON ENDPOINTS DINÁMICOS
  const connect = useCallback(() => {
    if (!token || !researchId || isConnecting || isLoadingEndpoints || !endpoints) {
      return;
    }

    setIsConnecting(true);

    try {
      // 🎯 USAR URL DINÁMICA DEL WEBSOCKET
      const wsUrl = endpoints.ws;

      if (!wsUrl) {
        setIsConnecting(false);
        return;
      }


      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);

        // 🎯 SUSCRIBIRSE A EVENTOS DE LA INVESTIGACIÓN
        const subscribeMessage = {
          type: 'SUBSCRIBE_RESEARCH',
          data: {
            researchId,
            timestamp: new Date().toISOString()
          }
        };

        // 🎯 VERIFICAR QUE EL WEBSOCKET ESTÉ LISTO ANTES DE ENVIAR
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(subscribeMessage));
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);

        // 🎯 DELAY ANTES DE RECONECTAR (5 SEGUNDOS)
        if (event.code !== 1000) { // No es cierre limpio
          setTimeout(() => {
            // 🎯 VERIFICAR QUE NO ESTEMOS YA CONECTANDO
            if (token && researchId && !isConnecting) {
              connect();
            }
          }, 5000);
        }
      };

      wsRef.current.onerror = (error) => {
        setIsConnected(false);
        setIsConnecting(false);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          // Aquí puedes manejar los mensajes según necesites
        } catch (error) {
        }
      };

    } catch (error) {
      setIsConnecting(false);
    }
  }, [token, researchId, endpoints, isLoadingEndpoints]);

  // 🎯 DESCONECTAR
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // 🎯 CONECTAR AL MONTAR
  useEffect(() => {
    if (token && researchId && !isLoadingEndpoints && endpoints) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, researchId, endpoints, isLoadingEndpoints]);

  return {
    isConnected,
    isLoadingEndpoints,
    endpoints,
    reconnect: connect,
    disconnect
  };
};
