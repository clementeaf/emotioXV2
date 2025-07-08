import { useCallback, useEffect, useRef, useState } from 'react';
import { useParticipantStore } from '../stores/participantStore';

export interface TimingState {
  isGlobalTimerRunning: boolean;
  globalStartTime: number | null;
  globalEndTime: number | null;
  globalDuration: number | null;
  activeSectionTimers: Set<string>;
  sectionTimings: Array<{
    sectionId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
  }>;
}

export interface TimingActions {
  startGlobalTimer: () => void;
  stopGlobalTimer: () => void;
  startSectionTimer: (sectionId: string) => void;
  stopSectionTimer: (sectionId: string) => void;
  getGlobalDuration: () => number | null;
  getSectionDuration: (sectionId: string) => number | null;
  resetAllTimers: () => void;
  getTimingInfo: () => {
    globalStartTime?: number;
    globalEndTime?: number;
    globalDuration?: number;
    sectionTimings: Array<{
      sectionId: string;
      startTime: number;
      endTime?: number;
      duration?: number;
    }>;
  };
}

/**
 * Hook personalizado para manejar la cronometrización de respuestas
 */
export const useResponseTiming = (): TimingState & TimingActions => {
  const [state, setState] = useState<TimingState>({
    isGlobalTimerRunning: false,
    globalStartTime: null,
    globalEndTime: null,
    globalDuration: null,
    activeSectionTimers: new Set(),
    sectionTimings: []
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startGlobalTimer = useParticipantStore(state => state.startGlobalTimer);
  const stopGlobalTimer = useParticipantStore(state => state.stopGlobalTimer);
  const startSectionTimer = useParticipantStore(state => state.startSectionTimer);
  const stopSectionTimer = useParticipantStore(state => state.stopSectionTimer);
  const responsesData = useParticipantStore(state => state.responsesData);

  useEffect(() => {
    const timestamps = responsesData.timestamps;
    const sectionTimings = responsesData.sectionTimings || [];

    const convertedSectionTimings = sectionTimings.map(section => ({
      sectionId: section.sectionId,
      startTime: section.start,
      endTime: section.end,
      duration: section.duration
    }));

    setState(prev => ({
      ...prev,
      globalStartTime: timestamps?.start || null,
      globalEndTime: timestamps?.end || null,
      globalDuration: timestamps?.duration || null,
      isGlobalTimerRunning: !!(timestamps?.start && !timestamps?.end),
      sectionTimings: convertedSectionTimings,
      activeSectionTimers: new Set(
        convertedSectionTimings
          .filter(t => t.startTime && !t.endTime)
          .map(t => t.sectionId)
      )
    }));
  }, [responsesData.timestamps, responsesData.sectionTimings]);

  const handleStartGlobalTimer = useCallback(() => {
    const now = Date.now();

    if (state.isGlobalTimerRunning) {
      console.warn('[ResponseTiming] Timer global ya está iniciado');
      return;
    }

    startGlobalTimer();

    setState(prev => ({
      ...prev,
      isGlobalTimerRunning: true,
      globalStartTime: now,
      globalEndTime: null,
      globalDuration: null
    }));

  }, [startGlobalTimer, state.isGlobalTimerRunning]);

  const handleStopGlobalTimer = useCallback(() => {
    const now = Date.now();

    if (!state.isGlobalTimerRunning) {
      console.warn('[ResponseTiming] Timer global no está iniciado');
      return;
    }

    stopGlobalTimer();

    setState(prev => {
      const duration = prev.globalStartTime ? now - prev.globalStartTime : null;

      const validDuration = duration && duration >= 0 ? duration : null;

      return {
        ...prev,
        isGlobalTimerRunning: false,
        globalEndTime: now,
        globalDuration: validDuration
      };
    });

  }, [stopGlobalTimer, state.isGlobalTimerRunning]);

  const handleStartSectionTimer = useCallback((sectionId: string) => {
    if (!sectionId || typeof sectionId !== 'string') {
      console.error('[ResponseTiming] sectionId inválido:', sectionId);
      return;
    }

    const now = Date.now();

    if (state.activeSectionTimers.has(sectionId)) {
      console.warn(`[ResponseTiming] Timer de sección ${sectionId} ya está iniciado`);
      return;
    }

    startSectionTimer(sectionId);

    setState(prev => ({
      ...prev,
      activeSectionTimers: new Set([...prev.activeSectionTimers, sectionId]),
      sectionTimings: [
        ...prev.sectionTimings.filter(t => t.sectionId !== sectionId),
        { sectionId, startTime: now }
      ]
    }));

  }, [startSectionTimer, state.activeSectionTimers]);

  const handleStopSectionTimer = useCallback((sectionId: string) => {
    if (!sectionId || typeof sectionId !== 'string') {
      console.error('[ResponseTiming] sectionId inválido:', sectionId);
      return;
    }

    const now = Date.now();

    if (!state.activeSectionTimers.has(sectionId)) {
      console.warn(`[ResponseTiming] Timer de sección ${sectionId} no está iniciado`);
      return;
    }

    stopSectionTimer(sectionId);

    setState(prev => {
      const section = prev.sectionTimings.find(t => t.sectionId === sectionId);
      const duration = section?.startTime ? now - section.startTime : null;

      const validDuration = duration && duration >= 0 ? duration : undefined;

      const updatedTimings = prev.sectionTimings.map(t =>
        t.sectionId === sectionId
          ? { ...t, endTime: now, duration: validDuration }
          : t
      );

      const updatedActiveTimers = new Set(prev.activeSectionTimers);
      updatedActiveTimers.delete(sectionId);

      return {
        ...prev,
        activeSectionTimers: updatedActiveTimers,
        sectionTimings: updatedTimings
      };
    });

  }, [stopSectionTimer, state.activeSectionTimers]);

  const getGlobalDuration = useCallback((): number | null => {
    if (state.globalStartTime && state.globalEndTime) {
      const duration = state.globalEndTime - state.globalStartTime;
      return duration >= 0 ? duration : null; // Validar duración positiva
    }
    if (state.globalStartTime && state.isGlobalTimerRunning) {
      const duration = Date.now() - state.globalStartTime;
      return duration >= 0 ? duration : null; // Validar duración positiva
    }
    return null;
  }, [state.globalStartTime, state.globalEndTime, state.isGlobalTimerRunning]);

  const getSectionDuration = useCallback((sectionId: string): number | null => {
    const section = state.sectionTimings.find(t => t.sectionId === sectionId);
    if (!section) return null;

    if (section.endTime && section.duration) {
      return section.duration >= 0 ? section.duration : null;
    }
    if (section.startTime && state.activeSectionTimers.has(sectionId)) {
      const duration = Date.now() - section.startTime;
      return duration >= 0 ? duration : null;
    }
    return null;
  }, [state.sectionTimings, state.activeSectionTimers]);

  const resetAllTimers = useCallback(() => {
    setState({
      isGlobalTimerRunning: false,
      globalStartTime: null,
      globalEndTime: null,
      globalDuration: null,
      activeSectionTimers: new Set(),
      sectionTimings: []
    });

  }, []);

  const getTimingInfo = useCallback(() => {
    return {
      globalStartTime: state.globalStartTime || undefined,
      globalEndTime: state.globalEndTime || undefined,
      globalDuration: getGlobalDuration() || undefined,
      sectionTimings: state.sectionTimings
    };
  }, [state.globalStartTime, state.globalEndTime, state.sectionTimings, getGlobalDuration]);

  useEffect(() => {
    const hasActiveTimers = state.isGlobalTimerRunning || state.activeSectionTimers.size > 0;

    if (hasActiveTimers && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setState(prev => ({ ...prev }));
      }, 1000);
    } else if (!hasActiveTimers && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isGlobalTimerRunning, state.activeSectionTimers.size]);

  useEffect(() => {
    if (!state.isGlobalTimerRunning && !state.globalStartTime) {
      handleStartGlobalTimer();
    }
  }, []);

  return {
    ...state,
    startGlobalTimer: handleStartGlobalTimer,
    stopGlobalTimer: handleStopGlobalTimer,
    startSectionTimer: handleStartSectionTimer,
    stopSectionTimer: handleStopSectionTimer,
    getGlobalDuration,
    getSectionDuration,
    resetAllTimers,
    getTimingInfo
  };
};
