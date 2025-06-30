import { useCallback, useEffect, useState } from 'react';

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

  // Manejar aceptación del consentimiento
  const handleAccept = useCallback(() => {
    saveConsentState({
      hasConsented: true,
      hasRejected: false,
      timestamp: Date.now(),
      researchId
    });
    setIsModalOpen(false);
  }, [saveConsentState, researchId]);

  // Manejar rechazo del consentimiento
  const handleReject = useCallback(() => {
    saveConsentState({
      hasConsented: false,
      hasRejected: true,
      timestamp: Date.now(),
      researchId
    });
    setIsModalOpen(false);
  }, [saveConsentState, researchId]);

  // Abrir modal de consentimiento
  const requestConsent = useCallback(() => {
    setIsModalOpen(true);
  }, []);

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

    // Si ha rechazado, tampoco necesita mostrar el modal
    if (consentState.hasRejected === true) {
      return false;
    }

    // Si no hay estado guardado, necesita consentimiento
    return consentState.hasConsented === null;
  }, [consentState]);

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
      canUseGeolocation: canUseGeolocation()
    };
  }, [consentState, needsConsent, canUseGeolocation]);

  return {
    // Estado
    consentState,
    isModalOpen,

    // Acciones
    requestConsent,
    handleAccept,
    handleReject,
    closeModal,
    resetConsent,

    // Utilidades
    needsConsent: needsConsent(),
    canUseGeolocation: canUseGeolocation(),
    getConsentInfo
  };
};
