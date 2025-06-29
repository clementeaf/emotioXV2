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

  // Generar clave única para esta sesión de investigación
  const getStorageKey = useCallback((suffix: string) => {
    const baseKey = `reentry_${researchId || 'unknown'}_${participantId || 'unknown'}`;
    return `${baseKey}_${suffix}`;
  }, [researchId, participantId]);

  // Obtener timestamp de la primera visita
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

  // Obtener timestamp de la última visita
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

  // Resetear contador de reingresos
  const resetReentryCount = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Limpiar datos de localStorage
    const keys = [
      getStorageKey('count'),
      getStorageKey('firstVisit'),
      getStorageKey('lastVisit')
    ];

    keys.forEach(key => localStorage.removeItem(key));

    // Resetear en el store
    useParticipantStore.setState({ reentryCount: 0 });
  }, [getStorageKey]);

  // Obtener información completa de la sesión
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

  // Incrementar contador de reingresos con logging
  const incrementReentryCountWithLogging = useCallback(() => {
    const beforeCount = reentryCount;
    incrementReentryCount();
    updateLastVisitTime();

    console.log(`[ReentryTracking] Reingreso detectado: ${beforeCount} -> ${beforeCount + 1}`);
    console.log(`[ReentryTracking] ResearchId: ${researchId}, ParticipantId: ${participantId}`);
  }, [reentryCount, incrementReentryCount, updateLastVisitTime, researchId, participantId]);

  // Detectar reingreso al montar el componente
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lastVisit = getLastVisitTime();
    const now = Date.now();
    const timeSinceLastVisit = now - lastVisit;

    // Considerar reingreso si han pasado más de 5 segundos desde la última visita
    // o si es la primera vez que se carga
    if (timeSinceLastVisit > 5000 || reentryCount === 0) {
      incrementReentryCountWithLogging();
    }

    // Actualizar timestamp de última visita
    updateLastVisitTime();

    console.log(`[ReentryTracking] Sesión iniciada - Reingresos: ${reentryCount + 1}, Tiempo desde última visita: ${timeSinceLastVisit}ms`);
  }, []); // Solo se ejecuta al montar

  // Detectar cuando el usuario sale de la página
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      console.log(`[ReentryTracking] Usuario saliendo de la página - Reingresos totales: ${reentryCount}`);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log(`[ReentryTracking] Página oculta - Reingresos: ${reentryCount}`);
      } else if (document.visibilityState === 'visible') {
        console.log(`[ReentryTracking] Página visible - Reingresos: ${reentryCount}`);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
