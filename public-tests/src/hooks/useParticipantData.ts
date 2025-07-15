import { useCallback, useEffect, useState } from 'react';
import { ApiClient } from '../lib/api';
import { useResponsesStore } from '../stores/useResponsesStore';
import { ConsolidatedMetadata, DeviceInfo, LocationInfo, SessionInfo } from './types';

// Interfaces para tipado de respuestas
interface ModuleResponse {
  questionKey: string;
  response: unknown;
  stepType: string;
  stepTitle: string;
}

interface ApiResponseData {
  data?: {
    responses?: ModuleResponse[];
  };
  responses?: ModuleResponse[];
}

/**
 * Hook consolidado que maneja respuestas y metadata automáticamente
 * Reemplaza múltiples hooks duplicados
 */
export const useParticipantData = (
  researchId: string | null,
  participantId: string | null
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ConsolidatedMetadata>(() => ({
    deviceInfo: getDeviceInfo(),
    locationInfo: { method: 'none', timestamp: Date.now() },
    sessionInfo: getSessionInfo(),
    timingInfo: { startTime: Date.now(), sectionTimings: [] }
  }));

  // NUEVO: Usar el store local de respuestas
  const {
    saveLocalResponse,
    getLocalResponse,
    hasLocalResponse,
    updateLocalResponse,
    deleteLocalResponse,
    clearAllResponses: clearLocalResponses
  } = useResponsesStore();

  function getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const screen = window.screen;
    const language = navigator.language;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Detectar navegador
    let browser = 'Unknown';
    let browserVersion = '';
    if (userAgent.includes('Chrome')) {
      browser = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || '';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+)/)?.[1] || '';
    } else if (userAgent.includes('Safari')) {
      browser = 'Safari';
      browserVersion = userAgent.match(/Version\/(\d+)/)?.[1] || '';
    }

    // Detectar OS
    let os = 'Unknown';
    let osVersion = '';
    if (userAgent.includes('Windows')) {
      os = 'Windows';
      osVersion = userAgent.match(/Windows NT (\d+\.\d+)/)?.[1] || '';
    } else if (userAgent.includes('Mac')) {
      os = 'macOS';
      osVersion = userAgent.match(/Mac OS X (\d+_\d+)/)?.[1] || '';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
      osVersion = userAgent.match(/Android (\d+\.\d+)/)?.[1] || '';
    } else if (userAgent.includes('iOS')) {
      os = 'iOS';
      osVersion = userAgent.match(/OS (\d+_\d+)/)?.[1] || '';
    }

    // Detectar tipo de conexión
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string; type?: string } }).connection;
    const connectionType = connection ? connection.effectiveType || connection.type : undefined;

    return {
      deviceType: 'desktop', // Assuming deviceType is not passed as an argument
      userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      platform: navigator.platform,
      language,
      browser,
      browserVersion,
      os,
      osVersion,
      connectionType,
      timezone
    };
  }

  function getSessionInfo(): SessionInfo {
    const storageKey = `session_${researchId || 'unknown'}_${participantId || 'unknown'}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      const data = JSON.parse(stored);
      return {
        ...data,
        totalSessionTime: Date.now() - data.sessionStartTime,
        currentStepKey: '',
        stepProgress: 0
      };
    }

    const sessionInfo: SessionInfo = {
      reentryCount: 0,
      sessionStartTime: Date.now(),
      lastVisitTime: Date.now(),
      totalSessionTime: 0,
      isFirstVisit: true,
      currentStepKey: '',
      stepProgress: 0
    };

    localStorage.setItem(storageKey, JSON.stringify(sessionInfo));
    return sessionInfo;
  }

  const getLocationInfo = useCallback(async (): Promise<LocationInfo> => {
    try {
      // Intentar GPS primero
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          method: 'gps',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.warn('GPS no disponible, intentando IP');
    }

    try {
      // Fallback a IP
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city,
          country: data.country_name,
          region: data.region,
          ipAddress: data.ip,
          method: 'ip',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.warn('Ubicación por IP no disponible');
    }

    return {
      method: 'none',
      timestamp: Date.now()
    };
  }, []);

  // Inicializar metadata sin geolocalización automática
  useEffect(() => {
    setMetadata(prev => ({
      ...prev,
      sessionInfo: {
        ...prev.sessionInfo,
        currentStepKey: '',
        totalSessionTime: Date.now() - prev.sessionInfo.sessionStartTime
      }
    }));
  }, []);

  const sendResponse = useCallback(async (questionKey: string, response: unknown): Promise<boolean> => {
    if (!researchId || !participantId || !questionKey) {
      console.error('[useParticipantData] ❌ Faltan datos requeridos');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiClient = new ApiClient();
      const locationInfo = await getLocationInfo();

      const updatedMetadata = {
        ...metadata,
        locationInfo,
        sessionInfo: {
          ...metadata.sessionInfo,
          currentStepKey: '',
          totalSessionTime: Date.now() - metadata.sessionInfo.sessionStartTime
        }
      };

      const result = await apiClient.saveModuleResponse({
        researchId,
        participantId,
        stepType: 'module_response',
        stepTitle: questionKey,
        questionKey,
        response,
        metadata: updatedMetadata
      });

      if (result.error) {
        console.error('[useParticipantData] ❌ Error enviando respuesta:', result.message);
        setError(result.message || 'Error desconocido');
        return false;
      }

      saveLocalResponse(questionKey, response, 'module_response', questionKey);

      return true;
    } catch (error) {
      console.error('[useParticipantData] 💥 Exception:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [researchId, participantId, metadata, getLocationInfo, saveLocalResponse]);

  const getResponse = useCallback(async (questionKey: string): Promise<unknown | null> => {
    if (!researchId || !participantId || !questionKey) {
      console.error('[useParticipantData] ❌ Faltan datos requeridos:', { researchId, participantId, questionKey });
      return null;
    }

    try {
      const localResponse = getLocalResponse(questionKey);
      if (localResponse) {
        return localResponse.response;
      }

      // Si no está localmente, buscar en el backend
      const apiClient = new ApiClient();
      const result = await apiClient.getModuleResponses(researchId, participantId);

      if (result.error) {
        console.error('[useParticipantData] ❌ Error obteniendo respuestas:', result.message);
        return null;
      }

            const responses = (result.data as ApiResponseData)?.data?.responses ||
                       (result.data as ApiResponseData)?.responses || [];

      const foundResponse = responses.find((r: ModuleResponse) => r.questionKey === questionKey);

      if (foundResponse) {
        // NUEVO: Guardar en local storage para futuras consultas
        saveLocalResponse(questionKey, foundResponse.response, foundResponse.stepType, foundResponse.stepTitle);
        return foundResponse.response;
      }

      return null;
    } catch (error) {
      console.error('[useParticipantData] 💥 Error obteniendo respuesta:', error);
      return null;
    }
  }, [researchId, participantId, getLocalResponse, saveLocalResponse]);

  const updateResponse = useCallback(async (questionKey: string, newResponse: unknown): Promise<boolean> => {
    const success = await sendResponse(questionKey, newResponse);
    if (success) {
      // NUEVO: Actualizar también en local storage
      updateLocalResponse(questionKey, newResponse);
    }
    return success;
  }, [sendResponse, updateLocalResponse]);

  const deleteAllResponses = useCallback(async (): Promise<boolean> => {
    if (!researchId || !participantId) {
      console.error('[useParticipantData] ❌ Faltan researchId o participantId');
      return false;
    }

    try {
      const apiClient = new ApiClient();
      const result = await apiClient.deleteAllResponses(researchId, participantId);

      if (result.error) {
        console.error('[useParticipantData] ❌ Error eliminando respuestas:', result.message);
        return false;
      }

      clearLocalResponses();

      return true;
    } catch (error) {
      console.error('[useParticipantData] 💥 Error eliminando respuestas:', error);
      return false;
    }
  }, [researchId, participantId, clearLocalResponses]);

  const startSession = useCallback(() => {
    const sessionInfo: SessionInfo = {
      reentryCount: 0,
      sessionStartTime: Date.now(),
      lastVisitTime: Date.now(),
      totalSessionTime: 0,
      isFirstVisit: true,
      currentStepKey: '',
      stepProgress: 0
    };

    setMetadata(prev => ({
      ...prev,
      sessionInfo,
      timingInfo: {
        ...prev.timingInfo,
        startTime: Date.now()
      }
    }));

    const storageKey = `session_${researchId || 'unknown'}_${participantId || 'unknown'}`;
    localStorage.setItem(storageKey, JSON.stringify(sessionInfo));
  }, [researchId, participantId]);

  const endSession = useCallback(() => {
    setMetadata(prev => ({
      ...prev,
      timingInfo: {
        ...prev.timingInfo,
        endTime: Date.now(),
        duration: Date.now() - prev.timingInfo.startTime
      }
    }));
  }, []);

  const updateCurrentStep = useCallback((stepKey: string) => {
    setMetadata(prev => ({
      ...prev,
      sessionInfo: {
        ...prev.sessionInfo,
        currentStepKey: stepKey
      }
    }));
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setMetadata(prev => ({
      ...prev,
      sessionInfo: {
        ...prev.sessionInfo,
        stepProgress: progress
      }
    }));
  }, []);

  return {
    isLoading,
    error,
    metadata,
    sendResponse,
    getResponse,
    updateResponse,
    deleteAllResponses,
    startSession,
    endSession,
    updateCurrentStep,
    updateProgress
  };
};
