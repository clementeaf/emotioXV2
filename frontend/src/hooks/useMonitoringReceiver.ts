import { useCallback, useEffect, useRef, useState } from 'react';
import { MonitoringEvent, ParticipantStatus, ResearchMonitoringData } from '../../../shared/interfaces/websocket-events.interface';
import { useAuth } from './useAuth';

/**
 * Hook para recibir eventos de monitoreo en tiempo real
 * En el dashboard del frontend
 */
export const useMonitoringReceiver = (researchId: string) => {
  const { token } = useAuth();
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

  // 🎯 CONECTAR AL WEBSOCKET
  const connect = useCallback(() => {
    if (!token || !researchId) return;

    try {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'wss://w8dj7wxnl9.execute-api.us-east-1.amazonaws.com/dev'}/monitoring`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[MonitoringReceiver] ✅ Conectado al servidor de monitoreo');
        setIsConnected(true);

        // 🎯 SUSCRIBIRSE A EVENTOS DE LA INVESTIGACIÓN
        wsRef.current?.send(JSON.stringify({
          type: 'SUBSCRIBE_RESEARCH',
          data: {
            researchId,
            timestamp: new Date().toISOString()
          }
        }));
      };

      wsRef.current.onclose = () => {
        console.log('[MonitoringReceiver] ❌ Desconectado del servidor de monitoreo');
        setIsConnected(false);
      };

      wsRef.current.onerror = (error) => {
        console.error('[MonitoringReceiver] ❌ Error en WebSocket:', error);
        setIsConnected(false);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: MonitoringEvent = JSON.parse(event.data);
          handleMonitoringEvent(message);
        } catch (error) {
          console.error('[MonitoringReceiver] ❌ Error procesando mensaje:', error);
        }
      };

    } catch (error) {
      console.error('[MonitoringReceiver] ❌ Error al conectar:', error);
    }
  }, [token, researchId]);

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
    console.log('[MonitoringReceiver] 📡 Evento recibido:', event.type);

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
        console.warn('[MonitoringReceiver] ⚠️ Evento no manejado:', event.type);
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
    if (token && researchId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, researchId, connect, disconnect]);

  return {
    isConnected,
    monitoringData,
    reconnect: connect
  };
};
