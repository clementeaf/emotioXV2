import { useCallback, useEffect, useState } from 'react';
import { GDPRConsentState, useGDPRConsent } from './useGDPRConsent';
import { GeolocationOptions, GeolocationState, useGeolocation } from './useGeolocation';

export interface GeolocationWithGDPRState extends GeolocationState {
  gdprConsent: GDPRConsentState;
  needsGDPRConsent: boolean;
  canUseGeolocation: boolean;
}

export interface GeolocationWithGDPROptions extends GeolocationOptions {
  researchId?: string;
  researchTitle?: string;
  autoRequestConsent?: boolean;
}

/**
 * Hook que combina geolocalización con consentimiento GDPR
 */
export const useGeolocationWithGDPR = (options: GeolocationWithGDPROptions = {}) => {
  const {
    researchId,
    researchTitle = 'esta investigación',
    autoRequestConsent = true,
    ...geolocationOptions
  } = options;

  // Hook de geolocalización base
  const geolocation = useGeolocation(geolocationOptions);

  // Hook de consentimiento GDPR
  const gdprConsent = useGDPRConsent(researchId);

  // Estado combinado
  const [combinedState, setCombinedState] = useState<GeolocationWithGDPRState>({
    ...geolocation,
    gdprConsent: gdprConsent.consentState,
    needsGDPRConsent: gdprConsent.needsConsent,
    canUseGeolocation: gdprConsent.canUseGeolocation
  });

  // Actualizar estado combinado cuando cambien los hooks
  useEffect(() => {
    setCombinedState(prev => ({
      ...prev,
      ...geolocation,
      gdprConsent: gdprConsent.consentState,
      needsGDPRConsent: gdprConsent.needsConsent,
      canUseGeolocation: gdprConsent.canUseGeolocation
    }));
  }, [geolocation, gdprConsent.consentState, gdprConsent.needsConsent, gdprConsent.canUseGeolocation]);

  // Solicitar ubicación con verificación de consentimiento GDPR
  const requestLocationWithConsent = useCallback(async (): Promise<void> => {
    // Si necesita consentimiento GDPR, mostrarlo primero
    if (gdprConsent.needsConsent) {
      if (autoRequestConsent) {
        gdprConsent.requestConsent();
      }
      return;
    }

    // Si no ha consentido, no proceder
    if (!gdprConsent.canUseGeolocation) {
      console.warn('No se puede usar geolocalización sin consentimiento GDPR');
      return;
    }

    // Proceder con la geolocalización
    await geolocation.requestLocation();
  }, [gdprConsent, geolocation, autoRequestConsent]);

  // Manejar aceptación del consentimiento GDPR
  const handleGDPRAccept = useCallback(() => {
    gdprConsent.handleAccept();
    // Automáticamente solicitar ubicación después del consentimiento
    setTimeout(() => {
      geolocation.requestLocation();
    }, 100);
  }, [gdprConsent, geolocation]);

  // Manejar rechazo del consentimiento GDPR
  const handleGDPRReject = useCallback(() => {
    gdprConsent.handleReject();
    // Intentar obtener ubicación aproximada por IP como fallback
    if (geolocationOptions.fallbackToIP !== false) {
      // El hook base ya maneja el fallback a IP
      console.log('Consentimiento GDPR rechazado, usando ubicación aproximada por IP');
    }
  }, [gdprConsent, geolocationOptions.fallbackToIP]);

  // Verificar si puede proceder con geolocalización
  const canProceedWithGeolocation = useCallback(() => {
    return gdprConsent.canUseGeolocation && geolocation.isGeolocationSupported;
  }, [gdprConsent.canUseGeolocation, geolocation.isGeolocationSupported]);

  // Obtener información completa para logging
  const getGeolocationInfo = useCallback(() => {
    return {
      ...geolocation,
      gdprConsent: gdprConsent.getConsentInfo(),
      canProceed: canProceedWithGeolocation(),
      researchId,
      researchTitle
    };
  }, [geolocation, gdprConsent, canProceedWithGeolocation, researchId, researchTitle]);

  // Resetear todo el estado (útil para testing)
  const resetAll = useCallback(() => {
    gdprConsent.resetConsent();
    // El hook de geolocalización se resetea automáticamente al cambiar las dependencias
  }, [gdprConsent]);

  return {
    // Estado combinado
    ...combinedState,

    // Acciones de GDPR
    requestGDPRConsent: gdprConsent.requestConsent,
    handleGDPRAccept,
    handleGDPRReject,
    closeGDPRModal: gdprConsent.closeModal,
    resetGDPRConsent: gdprConsent.resetConsent,

    // Acciones de geolocalización
    requestLocation: requestLocationWithConsent,
    retry: geolocation.retry,

    // Utilidades
    canProceedWithGeolocation: canProceedWithGeolocation(),
    getGeolocationInfo,
    resetAll,

    // Estado del modal
    isGDPRModalOpen: gdprConsent.isModalOpen,

    // Props para el modal
    gdprModalProps: {
      isOpen: gdprConsent.isModalOpen,
      onAccept: handleGDPRAccept,
      onReject: handleGDPRReject,
      onClose: gdprConsent.closeModal,
      researchTitle
    }
  };
};
