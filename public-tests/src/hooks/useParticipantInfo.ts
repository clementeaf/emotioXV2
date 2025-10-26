import { useCallback, useEffect, useState, useRef } from 'react';

interface ResponseTiming {
  questionKey: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  timestamp: string;
}

interface NavigationState {
  currentQuestion: string;
  lastAnsweredQuestion: string;
  totalQuestions: number;
  progress: number;
  sessionStartTime: number;
}

interface ParticipantInfo {
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    platform: string;
    language: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    source: 'gps' | 'ip';
  };
  navigation: NavigationState;
  responseTimings: ResponseTiming[];
  timestamp: string;
}

interface UseParticipantInfoProps {
  researchId: string;
  trackLocation?: boolean;
  trackDevice?: boolean;
  trackResponseTimes?: boolean;
  trackNavigation?: boolean;
  currentQuestionKey?: string;
  totalQuestions?: number;
}

export const useParticipantInfo = ({ 
  researchId, 
  trackLocation = false, 
  trackDevice = true,
  trackResponseTimes = false,
  trackNavigation = false,
  currentQuestionKey,
  totalQuestions = 0
}: UseParticipantInfoProps) => {
  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🎯 REFS PARA TRACKING
  const currentTimingRef = useRef<ResponseTiming | null>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const lastAnsweredQuestionRef = useRef<string>('');

  const getDeviceInfo = useCallback(() => {
    if (!trackDevice) return null;

    const userAgent = navigator.userAgent;
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    
    if (/tablet|ipad/i.test(userAgent)) {
      deviceType = 'tablet';
    } else if (/mobile|android|iphone/i.test(userAgent)) {
      deviceType = 'mobile';
    }

    return {
      type: deviceType,
      userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      platform: navigator.platform,
      language: navigator.language
    };
  }, [trackDevice]);

  const getLocation = useCallback(async (): Promise<ParticipantInfo['location'] | null> => {
    if (!trackLocation) return null;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        });
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        source: 'gps' as const
      };
    } catch (error) {
      console.warn('Error obteniendo ubicación GPS:', error);
      return null;
    }
  }, [trackLocation]);

  // 🎯 FUNCIONES PARA TRACKING DE TIEMPOS
  const startResponseTiming = useCallback((questionKey: string) => {
    if (!trackResponseTimes) return;

    const timing: ResponseTiming = {
      questionKey,
      startTime: Date.now(),
      timestamp: new Date().toISOString()
    };

    currentTimingRef.current = timing;
  }, [trackResponseTimes]);

  const endResponseTiming = useCallback((questionKey: string) => {
    if (!trackResponseTimes || !currentTimingRef.current) return;

    const endTime = Date.now();
    const duration = endTime - currentTimingRef.current.startTime;

    const completedTiming: ResponseTiming = {
      ...currentTimingRef.current,
      endTime,
      duration
    };

    // Actualizar el estado con el timing completado
    setParticipantInfo(prev => {
      if (!prev) return prev;
      
      const updatedTimings = [
        ...prev.responseTimings.filter(t => t.questionKey !== questionKey),
        completedTiming
      ];

      return {
        ...prev,
        responseTimings: updatedTimings
      };
    });

    currentTimingRef.current = null;
  }, [trackResponseTimes]);

  // 🎯 FUNCIONES PARA TRACKING DE NAVEGACIÓN
  const updateNavigation = useCallback((questionKey: string, isAnswered: boolean = false) => {
    if (!trackNavigation) return;

    if (isAnswered) {
      lastAnsweredQuestionRef.current = questionKey;
    }

    setParticipantInfo(prev => {
      if (!prev) return prev;

      const progress = totalQuestions > 0 ? Math.round(((prev.responseTimings.length + 1) / totalQuestions) * 100) : 0;

      return {
        ...prev,
        navigation: {
          currentQuestion: questionKey,
          lastAnsweredQuestion: lastAnsweredQuestionRef.current,
          totalQuestions,
          progress,
          sessionStartTime: sessionStartTimeRef.current
        }
      };
    });
  }, [trackNavigation, totalQuestions]);

  const collectParticipantInfo = useCallback(async () => {
    if (!researchId) return;

    setIsLoading(true);
    setError(null);

    try {
      const deviceInfo = getDeviceInfo();
      const locationInfo = await getLocation();

      const info: ParticipantInfo = {
        device: deviceInfo || {
          type: 'desktop',
          userAgent: navigator.userAgent,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          platform: navigator.platform,
          language: navigator.language
        },
        location: locationInfo || undefined,
        navigation: {
          currentQuestion: currentQuestionKey || '',
          lastAnsweredQuestion: lastAnsweredQuestionRef.current,
          totalQuestions,
          progress: 0,
          sessionStartTime: sessionStartTimeRef.current
        },
        responseTimings: [],
        timestamp: new Date().toISOString()
      };

      setParticipantInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [researchId, getDeviceInfo, getLocation, currentQuestionKey, totalQuestions]);

  useEffect(() => {
    collectParticipantInfo();
  }, [collectParticipantInfo]);

  // 🎯 ACTUALIZAR NAVEGACIÓN CUANDO CAMBIE LA PREGUNTA ACTUAL
  useEffect(() => {
    if (currentQuestionKey && trackNavigation) {
      updateNavigation(currentQuestionKey);
    }
  }, [currentQuestionKey, trackNavigation, updateNavigation]);

  return {
    participantInfo,
    isLoading,
    error,
    refresh: collectParticipantInfo,
    
    // 🎯 FUNCIONES DE TRACKING
    startResponseTiming,
    endResponseTiming,
    updateNavigation,
    
    // 🎯 HELPERS
    markQuestionAnswered: (questionKey: string) => updateNavigation(questionKey, true),
    getCurrentTiming: () => currentTimingRef.current,
    getSessionDuration: () => Date.now() - sessionStartTimeRef.current
  };
};
