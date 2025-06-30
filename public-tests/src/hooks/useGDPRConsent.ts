import { useCallback, useEffect, useState } from 'react';
import { useGDPRPreferences } from './useGDPRPreferences';

export interface GDPRConsentState {
  hasConsented: boolean | null;
  hasRejected: boolean;
  timestamp: number | null;
  researchId?: string;
}

const GDPR_STORAGE_KEY = 'emotio_gdpr_consent';

export const useGDPRConsent = (researchId?: string) => {
  const [consentState, setConsentState] = useState<GDPRConsentState>({
    hasConsented: null,
    hasRejected: false,
    timestamp: null,
    researchId
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rememberDecision, setRememberDecision] = useState(true);

  const {
    shouldShowConsent,
    markAsShown,
    getStoredConsent,
    preferences
  } = useGDPRPreferences();

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GDPR_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConsentState(prev => ({
          ...prev,
          ...parsed
        }));
      }
    } catch (error) {
      console.warn('Error loading GDPR consent from localStorage:', error);
    }
  }, []);

  // Verificar consentimiento almacenado si recordar decisión está habilitado
  useEffect(() => {
    if (researchId && preferences.rememberDecision) {
      const storedConsent = getStoredConsent(researchId);

      if (storedConsent === 'granted') {
        setConsentState(prev => ({
          ...prev,
          hasConsented: true,
          hasRejected: false,
          timestamp: Date.now(),
          researchId
        }));
      } else if (storedConsent === 'denied') {
        setConsentState(prev => ({
          ...prev,
          hasConsented: false,
          hasRejected: true,
          timestamp: Date.now(),
          researchId
        }));
      }
    }
  }, [researchId, preferences.rememberDecision, getStoredConsent]);

  // Guardar estado en localStorage
  const saveConsentState = useCallback((newState: Partial<GDPRConsentState>) => {
    const updatedState = { ...consentState, ...newState };
    setConsentState(updatedState);

    try {
      localStorage.setItem(GDPR_STORAGE_KEY, JSON.stringify(updatedState));
    } catch (error) {
      console.warn('Error saving GDPR consent to localStorage:', error);
    }
  }, [consentState]);

  // Guardar consentimiento en historial si recordar decisión está habilitado
  const saveConsentToHistory = useCallback((status: 'granted' | 'denied') => {
    if (researchId && preferences.rememberDecision) {
      try {
        const history = localStorage.getItem('emotio_gdpr_consent_history');
        const consentHistory = history ? JSON.parse(history) : {};

        consentHistory[researchId] = {
          status,
          timestamp: Date.now(),
          researchId,
          rememberDecision: preferences.rememberDecision
        };

        localStorage.setItem('emotio_gdpr_consent_history', JSON.stringify(consentHistory));
      } catch (error) {
        console.warn('Error saving consent to history:', error);
      }
    }
  }, [researchId, preferences.rememberDecision]);

  // Manejar aceptación del consentimiento
  const handleAccept = useCallback(() => {
    saveConsentState({
      hasConsented: true,
      hasRejected: false,
      timestamp: Date.now(),
      researchId
    });

    // Guardar en historial si recordar decisión está habilitado
    saveConsentToHistory('granted');

    // Marcar como mostrado
    if (researchId) {
      markAsShown(researchId);
    }

    setIsModalOpen(false);
  }, [saveConsentState, researchId, saveConsentToHistory, markAsShown]);

  // Manejar rechazo del consentimiento
  const handleReject = useCallback(() => {
    saveConsentState({
      hasConsented: false,
      hasRejected: true,
      timestamp: Date.now(),
      researchId
    });

    // Guardar en historial si recordar decisión está habilitado
    saveConsentToHistory('denied');

    // Marcar como mostrado
    if (researchId) {
      markAsShown(researchId);
    }

    setIsModalOpen(false);
  }, [saveConsentState, researchId, saveConsentToHistory, markAsShown]);

  // Abrir modal de consentimiento
  const requestConsent = useCallback(() => {
    // Verificar si debe mostrar el consentimiento según las preferencias
    if (researchId && !shouldShowConsent(researchId)) {
      // Si auto-aceptar está habilitado, aceptar automáticamente
      if (preferences.autoAccept) {
        handleAccept();
        return;
      }

      // Si no debe mostrar, no hacer nada
      return;
    }

    setIsModalOpen(true);
  }, [researchId, shouldShowConsent, preferences.autoAccept, handleAccept]);

  // Cerrar modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Verificar si necesita consentimiento
  const needsConsent = useCallback(() => {
    // Si ya ha consentido, no necesita mostrar el modal
    if (consentState.hasConsented === true) {
      return false;
    }

    // Si ha rechazado, verificar preferencias de frecuencia
    if (consentState.hasRejected === true) {
      if (preferences.notificationFrequency === 'never') {
        return false;
      }
      if (preferences.notificationFrequency === 'once' && researchId) {
        // Verificar si ya se mostró para esta investigación
        try {
          const history = localStorage.getItem('emotio_gdpr_consent_history');
          if (history) {
            const consentHistory = JSON.parse(history);
            const researchConsent = consentHistory[researchId];
            if (researchConsent && researchConsent.shown) {
              return false;
            }
          }
        } catch (error) {
          console.warn('Error checking consent history:', error);
        }
      }
    }

    // Si no hay estado guardado, necesita consentimiento
    return consentState.hasConsented === null;
  }, [consentState, preferences.notificationFrequency, researchId]);

  // Verificar si puede usar geolocalización
  const canUseGeolocation = useCallback(() => {
    return consentState.hasConsented === true;
  }, [consentState]);

  // Resetear consentimiento (útil para testing)
  const resetConsent = useCallback(() => {
    const resetState = {
      hasConsented: null,
      hasRejected: false,
      timestamp: null,
      researchId
    };
    setConsentState(resetState);
    localStorage.removeItem(GDPR_STORAGE_KEY);
  }, [researchId]);

  // Obtener información del consentimiento para logging
  const getConsentInfo = useCallback(() => {
    return {
      hasConsented: consentState.hasConsented,
      hasRejected: consentState.hasRejected,
      timestamp: consentState.timestamp,
      researchId: consentState.researchId,
      needsConsent: needsConsent(),
      canUseGeolocation: canUseGeolocation(),
      rememberDecision,
      preferences
    };
  }, [consentState, needsConsent, canUseGeolocation, rememberDecision, preferences]);

  return {
    // Estado
    consentState,
    isModalOpen,
    rememberDecision,

    // Acciones
    requestConsent,
    handleAccept,
    handleReject,
    closeModal,
    resetConsent,
    setRememberDecision,

    // Utilidades
    needsConsent: needsConsent(),
    canUseGeolocation: canUseGeolocation(),
    getConsentInfo,
    preferences
  };
};
