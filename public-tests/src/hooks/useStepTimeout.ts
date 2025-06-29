import { useCallback, useEffect, useRef, useState } from 'react';

export interface StepTimeoutConfig {
  enabled: boolean;
  duration: number; // en segundos
  warningThreshold?: number; // porcentaje del tiempo para mostrar advertencia
  autoSubmit?: boolean; // si debe enviar automáticamente al expirar
  showWarning?: boolean; // si debe mostrar advertencia
}

export interface StepTimeoutState {
  isActive: boolean;
  timeRemaining: number;
  isWarning: boolean;
  isExpired: boolean;
  progress: number; // porcentaje de tiempo restante
}

export interface StepTimeoutActions {
  startTimeout: () => void;
  pauseTimeout: () => void;
  resumeTimeout: () => void;
  resetTimeout: () => void;
  extendTimeout: (additionalSeconds: number) => void;
}

/**
 * Hook para manejar timeouts configurables por paso
 */
export const useStepTimeout = (
  config: StepTimeoutConfig,
  onTimeout?: () => void,
  onWarning?: () => void
): StepTimeoutState & StepTimeoutActions => {
  const [state, setState] = useState<StepTimeoutState>({
    isActive: false,
    timeRemaining: config.duration,
    isWarning: false,
    isExpired: false,
    progress: 100
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number | null>(null);

  // Función para calcular el tiempo restante
  const calculateTimeRemaining = useCallback((startTime: number, totalDuration: number): number => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(0, totalDuration - elapsed);
  }, []);

  // Función para actualizar el estado del timeout
  const updateTimeoutState = useCallback((timeRemaining: number) => {
    const progress = Math.max(0, (timeRemaining / config.duration) * 100);
    const warningThreshold = config.warningThreshold || 20; // 20% por defecto
    const isWarning = progress <= warningThreshold && progress > 0;
    const isExpired = timeRemaining <= 0;

    setState(prev => ({
      ...prev,
      timeRemaining,
      isWarning,
      isExpired,
      progress
    }));

    // Ejecutar callbacks
    if (isExpired && !state.isExpired && onTimeout) {
      onTimeout();
    }
    if (isWarning && !state.isWarning && onWarning) {
      onWarning();
    }
  }, [config.duration, config.warningThreshold, state.isExpired, state.isWarning, onTimeout, onWarning]);

  // Función para iniciar el timeout
  const startTimeout = useCallback(() => {
    if (!config.enabled || state.isActive) {
      return;
    }

    const now = Date.now();
    startTimeRef.current = now;
    pausedTimeRef.current = null;

    setState(prev => ({
      ...prev,
      isActive: true,
      timeRemaining: config.duration,
      isWarning: false,
      isExpired: false,
      progress: 100
    }));

    // Configurar intervalo para actualizar cada segundo
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const timeRemaining = calculateTimeRemaining(startTimeRef.current, config.duration);
        updateTimeoutState(timeRemaining);

        // Detener si expiró
        if (timeRemaining <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setState(prev => ({ ...prev, isActive: false }));
        }
      }
    }, 1000);

    console.log(`[StepTimeout] Timeout iniciado: ${config.duration}s`);
  }, [config.enabled, config.duration, state.isActive, calculateTimeRemaining, updateTimeoutState]);

  // Función para pausar el timeout
  const pauseTimeout = useCallback(() => {
    if (!state.isActive || !startTimeRef.current) {
      return;
    }

    pausedTimeRef.current = Date.now();
    setState(prev => ({ ...prev, isActive: false }));

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    console.log('[StepTimeout] Timeout pausado');
  }, [state.isActive]);

  // Función para reanudar el timeout
  const resumeTimeout = useCallback(() => {
    if (state.isActive || !pausedTimeRef.current || !startTimeRef.current) {
      return;
    }

    const pauseDuration = Date.now() - pausedTimeRef.current;
    startTimeRef.current += pauseDuration; // Ajustar tiempo de inicio
    pausedTimeRef.current = null;

    setState(prev => ({ ...prev, isActive: true }));

    // Reconfigurar intervalo
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const timeRemaining = calculateTimeRemaining(startTimeRef.current, config.duration);
        updateTimeoutState(timeRemaining);

        if (timeRemaining <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setState(prev => ({ ...prev, isActive: false }));
        }
      }
    }, 1000);

    console.log('[StepTimeout] Timeout reanudado');
  }, [state.isActive, config.duration, calculateTimeRemaining, updateTimeoutState]);

  // Función para resetear el timeout
  const resetTimeout = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    startTimeRef.current = null;
    pausedTimeRef.current = null;

    setState({
      isActive: false,
      timeRemaining: config.duration,
      isWarning: false,
      isExpired: false,
      progress: 100
    });

    console.log('[StepTimeout] Timeout reseteado');
  }, [config.duration]);

  // Función para extender el timeout
  const extendTimeout = useCallback((additionalSeconds: number) => {
    if (!state.isActive || !startTimeRef.current) {
      return;
    }

    const newDuration = config.duration + additionalSeconds;
    const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const newTimeRemaining = Math.max(0, newDuration - currentElapsed);

    setState(prev => ({
      ...prev,
      timeRemaining: newTimeRemaining,
      progress: Math.max(0, (newTimeRemaining / newDuration) * 100)
    }));

    console.log(`[StepTimeout] Timeout extendido: +${additionalSeconds}s`);
  }, [state.isActive, config.duration]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-submit si está configurado
  useEffect(() => {
    if (state.isExpired && config.autoSubmit && onTimeout) {
      console.log('[StepTimeout] Auto-submit ejecutado por timeout');
      onTimeout();
    }
  }, [state.isExpired, config.autoSubmit, onTimeout]);

  return {
    ...state,
    startTimeout,
    pauseTimeout,
    resumeTimeout,
    resetTimeout,
    extendTimeout
  };
};
