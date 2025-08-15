import { useCallback, useEffect, useRef, useState } from 'react';
import { MonitoringEvent, ParticipantStatus, ResearchMonitoringData } from '../../../shared/interfaces/websocket-events.interface';
import { DYNAMIC_API_ENDPOINTS, getWebsocketUrl } from '../api/dynamic-endpoints';
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
    const loadEndpoints = () => {
      try {
        console.log('🔍 Cargando endpoints para monitoreo...');
        const dynamicEndpoints = DYNAMIC_API_ENDPOINTS;
        setEndpoints(dynamicEndpoints);
        console.log('✅ Endpoints de monitoreo cargados:', {
          http: dynamicEndpoints.http,
          ws: dynamicEndpoints.ws
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

      // 🎯 USAR ENDPOINT CORRECTO DE AWS
      const wsUrl = getWebsocketUrl();

      console.log('🔌 Intentando conectar a WebSocket de monitoreo:', wsUrl);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket dinámico conectado exitosamente');
        setIsConnected(true);
        setIsConnecting(false);

        // 🎯 ENVIAR EVENTO DE CONEXIÓN DE MONITOREO (mismo formato que public-tests)
        const connectMessage = {
          type: 'MONITORING_CONNECT',
          data: {
            researchId,
            timestamp: new Date().toISOString()
          }
        };

        // 🎯 VERIFICAR QUE EL WEBSOCKET ESTÉ LISTO ANTES DE ENVIAR
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(connectMessage));
          console.log('📡 Mensaje de conexión de monitoreo enviado:', connectMessage);
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
    console.log('[useMonitoringReceiver] 📨 Procesando evento:', {
      type: event.type,
      data: event.data
    });

    switch (event.type) {
      case 'PARTICIPANT_LOGIN':
        console.log('[useMonitoringReceiver] 🎯 Llamando handleParticipantLogin');
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
        console.log('[useMonitoringReceiver] ⚠️ Evento no manejado:', event.type);
    }
  }, []);

  // 🎯 MANEJAR LOGIN DE PARTICIPANTE
  const handleParticipantLogin = useCallback((data: any) => {
    console.log('[useMonitoringReceiver] 🎯 PARTICIPANT_LOGIN recibido:', {
      participantId: data.participantId,
      email: data.email,
      researchId: data.researchId,
      timestamp: data.timestamp
    });

    setMonitoringData(prev => {
      console.log('[useMonitoringReceiver] 📊 Estado anterior:', {
        totalParticipants: prev.totalParticipants,
        participants: prev.participants.map(p => ({ participantId: p.participantId, email: p.email }))
      });

      const existingParticipant = prev.participants.find(p => p.participantId === data.participantId);

      if (existingParticipant) {
        console.log('[useMonitoringReceiver] 🔄 Actualizando participante existente:', existingParticipant.participantId);

        // Actualizar participante existente
        const updatedParticipants = prev.participants.map(p =>
          p.participantId === data.participantId
            ? { ...p, lastActivity: data.timestamp, status: 'in_progress' as const }
            : p
        );

        const newState = {
          ...prev,
          participants: updatedParticipants,
          activeParticipants: updatedParticipants.filter(p => p.status === 'in_progress').length,
          lastUpdate: data.timestamp
        };

        console.log('[useMonitoringReceiver] ✅ Estado actualizado (existente):', {
          totalParticipants: newState.totalParticipants,
          activeParticipants: newState.activeParticipants,
          participants: newState.participants.map(p => ({ participantId: p.participantId, email: p.email, status: p.status }))
        });

        return newState;
      } else {
        console.log('[useMonitoringReceiver] 🆕 Agregando nuevo participante:', data.participantId);

        // Agregar nuevo participante
        const newParticipant: ParticipantStatus = {
          participantId: data.participantId,
          email: data.email,
          status: 'in_progress',
          progress: 0,
          lastActivity: data.timestamp
        };

        const updatedParticipants = [...prev.participants, newParticipant];

        const newState = {
          ...prev,
          participants: updatedParticipants,
          totalParticipants: updatedParticipants.length,
          activeParticipants: updatedParticipants.filter(p => p.status === 'in_progress').length,
          lastUpdate: data.timestamp
        };

        console.log('[useMonitoringReceiver] ✅ Estado actualizado (nuevo):', {
          totalParticipants: newState.totalParticipants,
          activeParticipants: newState.activeParticipants,
          participants: newState.participants.map(p => ({ participantId: p.participantId, email: p.email, status: p.status }))
        });

        return newState;
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
    console.log('[useMonitoringReceiver] 🔄 useEffect de conexión:', {
      token: !!token,
      researchId,
      isLoadingEndpoints,
      endpoints: !!endpoints,
      isConnecting
    });

    if (token && researchId && !isLoadingEndpoints && endpoints) {
      console.log('[useMonitoringReceiver] ✅ Condiciones cumplidas, conectando...');
      connect();
    } else {
      console.log('[useMonitoringReceiver] ⚠️ No se conectó:', {
        reason: !token ? 'No hay token' :
          !researchId ? 'No hay researchId' :
            isLoadingEndpoints ? 'Cargando endpoints' :
              !endpoints ? 'No hay endpoints' :
                isConnecting ? 'Ya conectando' : 'Desconocido'
      });
    }

    return () => {
      console.log('[useMonitoringReceiver] 🧹 Limpiando conexión');
      disconnect();
    };
  }, [token, researchId, endpoints, isLoadingEndpoints]);

  return {
    isConnected,
    monitoringData,
    reconnect: connect
  };
};
