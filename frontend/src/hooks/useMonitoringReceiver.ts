import { useCallback, useEffect, useRef, useState } from 'react';
import { MonitoringEvent, ParticipantStatus, ResearchMonitoringData } from '../../../shared/interfaces/websocket-events.interface';
import { getDynamicEndpoints } from '../api/dynamic-endpoints';
import { useAuth } from '../providers/AuthProvider';
import { debugEnvironmentVariables } from '../utils/debug-env';

/**
 * Hook para recibir eventos de monitoreo en tiempo real
 * En el dashboard del frontend
 * USANDO ENDPOINTS DINÁMICOS
 */
export const useMonitoringReceiver = (researchId: string) => {
  const { token: contextToken } = useAuth();

  // 🎯 FALLBACK: OBTENER TOKEN DEL LOCALSTORAGE SI EL CONTEXTO NO FUNCIONA
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [endpoints, setEndpoints] = useState<any>(null);
  const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setLocalToken(storedToken);
  }, []);

  // 🎯 USAR TOKEN DEL CONTEXTO O FALLBACK AL LOCALSTORAGE
  const token = contextToken || localToken;

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [monitoringData, setMonitoringData] = useState<ResearchMonitoringData>({
    researchId,
    participants: [],
    totalParticipants: 0,
    activeParticipants: 0,
    completedParticipants: 0,
    disqualifiedParticipants: 0,
    averageProgress: 0,
    lastUpdate: new Date().toISOString()
  });

  // 🎯 CARGAR ENDPOINTS DINÁMICOS
  useEffect(() => {
    const loadEndpoints = async () => {
      try {
        console.log('�� Cargando endpoints para monitoreo...');
        const dynamicEndpoints = await getDynamicEndpoints();
        setEndpoints(dynamicEndpoints);
        console.log('✅ Endpoints de monitoreo cargados:', {
          http: dynamicEndpoints.API_HTTP_ENDPOINT,
          ws: dynamicEndpoints.API_WEBSOCKET_ENDPOINT
        });
      } catch (error) {
        console.error('❌ Error cargando endpoints:', error);
        setEndpoints(null);
      } finally {
        setIsLoadingEndpoints(false);
      }
    };

    loadEndpoints();
  }, []);

  // 🎯 CONECTAR AL WEBSOCKET
  const connect = useCallback(() => {
    if (!token || !researchId || isConnecting || isLoadingEndpoints || !endpoints) {
      return;
    }

    setIsConnecting(true);

    try {
      // 🎯 DIAGNÓSTICO: VERIFICAR VARIABLES DE ENTORNO
      debugEnvironmentVariables();

      // 🎯 USAR URL DINÁMICA DEL WEBSOCKET
      const wsUrl = endpoints.API_WEBSOCKET_ENDPOINT;

      if (!wsUrl) {
        console.error('❌ No se pudo obtener URL de WebSocket desde endpoints dinámicos');
        setIsConnecting(false);
        return;
      }

      console.log('🔌 Intentando conectar a WebSocket dinámico:', wsUrl);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket dinámico conectado exitosamente');
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
          console.log('📡 Mensaje de suscripción enviado:', subscribeMessage);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('❌ WebSocket dinámico desconectado:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);

        // 🎯 DELAY ANTES DE RECONECTAR (5 SEGUNDOS)
        if (event.code !== 1000) { // No es cierre limpio
          console.log('🔄 Programando reconexión en 5 segundos...');
          setTimeout(() => {
            // 🎯 VERIFICAR QUE NO ESTEMOS YA CONECTANDO
            if (token && researchId && !isConnecting) {
              connect();
            }
          }, 5000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Error en WebSocket dinámico:', error);
        setIsConnected(false);
        setIsConnecting(false);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: MonitoringEvent = JSON.parse(event.data);
          console.log('📨 Mensaje recibido en WebSocket dinámico:', message.type);
          handleMonitoringEvent(message);
        } catch (error) {
          console.error('❌ Error procesando mensaje:', error);
        }
      };

    } catch (error) {
      console.error('❌ Error al crear WebSocket dinámico:', error);
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

  // 🎯 MANEJAR EVENTOS DE MONITOREO
  const handleMonitoringEvent = useCallback((event: MonitoringEvent) => {
    switch (event.type) {
      case 'PARTICIPANT_LOGIN':
        handleParticipantLogin(event.data);
        break;
      case 'PARTICIPANT_STEP':
        handleParticipantStep(event.data);
        break;
      case 'PARTICIPANT_DISQUALIFIED':
        handleParticipantDisqualified(event.data);
        break;
      case 'PARTICIPANT_QUOTA_EXCEEDED':
        handleParticipantQuotaExceeded(event.data);
        break;
      case 'PARTICIPANT_COMPLETED':
        handleParticipantCompleted(event.data);
        break;
      case 'PARTICIPANT_ERROR':
        handleParticipantError(event.data);
        break;
      default:
    }
  }, []);

  // 🎯 MANEJAR LOGIN DE PARTICIPANTE
  const handleParticipantLogin = useCallback((data: any) => {
    setMonitoringData(prev => {
      const existingParticipant = prev.participants.find(p => p.participantId === data.participantId);

      if (existingParticipant) {
        // Actualizar participante existente
        const updatedParticipants = prev.participants.map(p =>
          p.participantId === data.participantId
            ? { ...p, lastActivity: data.timestamp, status: 'in_progress' as const }
            : p
        );

        return {
          ...prev,
          participants: updatedParticipants,
          activeParticipants: updatedParticipants.filter(p => p.status === 'in_progress').length,
          lastUpdate: data.timestamp
        };
      } else {
        // Agregar nuevo participante
        const newParticipant: ParticipantStatus = {
          participantId: data.participantId,
          email: data.email,
          status: 'in_progress',
          progress: 0,
          lastActivity: data.timestamp
        };

        const updatedParticipants = [...prev.participants, newParticipant];

        return {
          ...prev,
          participants: updatedParticipants,
          totalParticipants: updatedParticipants.length,
          activeParticipants: updatedParticipants.filter(p => p.status === 'in_progress').length,
          lastUpdate: data.timestamp
        };
      }
    });
  }, []);

  // 🎯 MANEJAR STEP DE PARTICIPANTE
  const handleParticipantStep = useCallback((data: any) => {
    setMonitoringData(prev => {
      const updatedParticipants = prev.participants.map(p =>
        p.participantId === data.participantId
          ? {
            ...p,
            currentStep: data.stepName,
            progress: data.progress,
            lastActivity: data.timestamp,
            duration: data.duration
          }
          : p
      );

      const averageProgress = updatedParticipants.length > 0
        ? updatedParticipants.reduce((sum, p) => sum + p.progress, 0) / updatedParticipants.length
        : 0;

      return {
        ...prev,
        participants: updatedParticipants,
        averageProgress,
        lastUpdate: data.timestamp
      };
    });
  }, []);

  // 🎯 MANEJAR DESCALIFICACIÓN DE PARTICIPANTE
  const handleParticipantDisqualified = useCallback((data: any) => {
    setMonitoringData(prev => {
      const updatedParticipants = prev.participants.map(p =>
        p.participantId === data.participantId
          ? {
            ...p,
            status: 'disqualified' as const,
            disqualificationReason: data.reason,
            lastActivity: data.timestamp
          }
          : p
      );

      return {
        ...prev,
        participants: updatedParticipants,
        disqualifiedParticipants: updatedParticipants.filter(p => p.status === 'disqualified').length,
        activeParticipants: updatedParticipants.filter(p => p.status === 'in_progress').length,
        lastUpdate: data.timestamp
      };
    });
  }, []);

  // 🎯 MANEJAR EXCESO DE CUOTA
  const handleParticipantQuotaExceeded = useCallback((data: any) => {
    setMonitoringData(prev => {
      const updatedParticipants = prev.participants.map(p =>
        p.participantId === data.participantId
          ? {
            ...p,
            status: 'disqualified' as const,
            disqualificationReason: `Cuota excedida: ${data.quotaType} - ${data.quotaValue}`,
            quotaExceeded: {
              type: data.quotaType,
              value: data.quotaValue
            },
            lastActivity: data.timestamp
          }
          : p
      );

      return {
        ...prev,
        participants: updatedParticipants,
        disqualifiedParticipants: updatedParticipants.filter(p => p.status === 'disqualified').length,
        activeParticipants: updatedParticipants.filter(p => p.status === 'in_progress').length,
        lastUpdate: data.timestamp
      };
    });
  }, []);

  // 🎯 MANEJAR COMPLETACIÓN DE PARTICIPANTE
  const handleParticipantCompleted = useCallback((data: any) => {
    setMonitoringData(prev => {
      const updatedParticipants = prev.participants.map(p =>
        p.participantId === data.participantId
          ? {
            ...p,
            status: 'completed' as const,
            progress: 100,
            lastActivity: data.timestamp
          }
          : p
      );

      return {
        ...prev,
        participants: updatedParticipants,
        completedParticipants: updatedParticipants.filter(p => p.status === 'completed').length,
        activeParticipants: updatedParticipants.filter(p => p.status === 'in_progress').length,
        lastUpdate: data.timestamp
      };
    });
  }, []);

  // 🎯 MANEJAR ERROR DE PARTICIPANTE
  const handleParticipantError = useCallback((data: any) => {
    setMonitoringData(prev => {
      const updatedParticipants = prev.participants.map(p =>
        p.participantId === data.participantId
          ? {
            ...p,
            status: 'error' as const,
            lastActivity: data.timestamp
          }
          : p
      );

      return {
        ...prev,
        participants: updatedParticipants,
        lastUpdate: data.timestamp
      };
    });
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
    monitoringData,
    reconnect: connect
  };
};
