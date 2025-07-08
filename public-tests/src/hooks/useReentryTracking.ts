import { useCallback, useEffect } from 'react';
import { useParticipantStore } from '../stores/participantStore';

export interface ReentryTrackingState {
  reentryCount: number;
  sessionStartTime: number;
  lastVisitTime: number;
  totalSessionTime: number;
  isFirstVisit: boolean;
}

export interface ReentryTrackingActions {
  incrementReentryCount: () => void;
  resetReentryCount: () => void;
  getSessionInfo: () => ReentryTrackingState;
}

/**
 * Hook personalizado para manejar el tracking de reingresos a la aplicación
 */
export const useReentryTracking = (): ReentryTrackingState & ReentryTrackingActions => {
  const reentryCount = useParticipantStore(state => state.reentryCount);
  const incrementReentryCount = useParticipantStore(state => state.incrementReentryCount);
  const researchId = useParticipantStore(state => state.researchId);
  const participantId = useParticipantStore(state => state.participantId);

  const getStorageKey = useCallback((suffix: string) => {
    const baseKey = `reentry_${researchId || 'unknown'}_${participantId || 'unknown'}`;
    return `${baseKey}_${suffix}`;
  }, [researchId, participantId]);

  const getFirstVisitTime = useCallback((): number => {
    if (typeof window === 'undefined') return Date.now();

    const key = getStorageKey('firstVisit');
    const stored = localStorage.getItem(key);

    if (stored) {
      return parseInt(stored, 10);
    } else {
      const now = Date.now();
      localStorage.setItem(key, now.toString());
      return now;
    }
  }, [getStorageKey]);

  const getLastVisitTime = useCallback((): number => {
    if (typeof window === 'undefined') return Date.now();

    const key = getStorageKey('lastVisit');
    const stored = localStorage.getItem(key);

    if (stored) {
      return parseInt(stored, 10);
    } else {
      const now = Date.now();
      localStorage.setItem(key, now.toString());
      return now;
    }
  }, [getStorageKey]);

  // Actualizar timestamp de última visita
  const updateLastVisitTime = useCallback(() => {
    if (typeof window === 'undefined') return;

    const key = getStorageKey('lastVisit');
    const now = Date.now();
    localStorage.setItem(key, now.toString());
  }, [getStorageKey]);

  const resetReentryCount = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Limpiar datos de localStorage
    const keys = [
      getStorageKey('count'),
      getStorageKey('firstVisit'),
      getStorageKey('lastVisit')
    ];

    keys.forEach(key => localStorage.removeItem(key));

    useParticipantStore.setState({ reentryCount: 0 });
  }, [getStorageKey]);

  const getSessionInfo = useCallback((): ReentryTrackingState => {
    const sessionStartTime = getFirstVisitTime();
    const lastVisitTime = getLastVisitTime();
    const totalSessionTime = Date.now() - sessionStartTime;

    return {
      reentryCount,
      sessionStartTime,
      lastVisitTime,
      totalSessionTime,
      isFirstVisit: reentryCount === 0
    };
  }, [reentryCount, getFirstVisitTime, getLastVisitTime]);

  const incrementReentryCountWithLogging = useCallback(() => {
    incrementReentryCount();
    updateLastVisitTime();

  }, [reentryCount, incrementReentryCount, updateLastVisitTime, researchId, participantId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lastVisit = getLastVisitTime();
    const now = Date.now();
    const timeSinceLastVisit = now - lastVisit;

    if (timeSinceLastVisit > 5000 || reentryCount === 0) {
      incrementReentryCountWithLogging();
    }

    updateLastVisitTime();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
  }, [reentryCount]);

  return {
    reentryCount,
    sessionStartTime: getFirstVisitTime(),
    lastVisitTime: getLastVisitTime(),
    totalSessionTime: Date.now() - getFirstVisitTime(),
    isFirstVisit: reentryCount === 0,
    incrementReentryCount: incrementReentryCountWithLogging,
    resetReentryCount,
    getSessionInfo
  };
};
