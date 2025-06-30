import { useCallback, useEffect, useState } from 'react';
import { useGDPRConsent } from './useGDPRConsent';
import { usePermissionRejection } from './usePermissionRejection';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  country?: string;
  method: 'gps' | 'ip' | 'none';
  timestamp: number;
}

interface GeolocationWithConsentState {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  consentStatus: 'unknown' | 'granted' | 'denied' | 'expired';
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  hasAttemptedGPS: boolean;
}

interface UseGeolocationWithConsentReturn extends GeolocationWithConsentState {
  requestLocation: () => Promise<LocationData | null>;
  clearLocation: () => void;
  retryWithGPS: () => Promise<LocationData | null>;
  useIPLocation: () => Promise<LocationData | null>;
}

export const useGeolocationWithConsent = (): UseGeolocationWithConsentReturn => {
  const [state, setState] = useState<GeolocationWithConsentState>({
    location: null,
    isLoading: false,
    error: null,
    consentStatus: 'unknown',
    permissionStatus: 'unknown',
    hasAttemptedGPS: false,
  });

  const { consentState, canUseGeolocation } = useGDPRConsent();
  const {
    gpsPermission,
    requestGPSPermission,
    getLocationByIP,
    resetPermissions
  } = usePermissionRejection();

  // Sincronizar estado de permisos
  useEffect(() => {
    setState(prev => ({
      ...prev,
      consentStatus: consentState.hasConsented ? 'granted' : consentState.hasRejected ? 'denied' : 'unknown',
      permissionStatus: gpsPermission,
    }));
  }, [consentState.hasConsented, consentState.hasRejected, gpsPermission]);

  // Solicitar ubicación con manejo completo de consentimiento y permisos
  const requestLocation = useCallback(async (): Promise<LocationData | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1. Verificar consentimiento GDPR
      if (!canUseGeolocation) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Consentimiento GDPR requerido'
        }));
        return null;
      }

      // 2. Intentar obtener ubicación GPS
      setState(prev => ({ ...prev, hasAttemptedGPS: true }));
      const gpsLocation = await requestGPSPermission();

      if (gpsLocation) {
        setState(prev => ({
          ...prev,
          location: gpsLocation,
          isLoading: false
        }));
        return gpsLocation;
      }

      // 3. Si GPS falla, intentar ubicación por IP
      const ipLocationData = await getLocationByIP();

      if (ipLocationData) {
        setState(prev => ({
          ...prev,
          location: ipLocationData,
          isLoading: false
        }));
        return ipLocationData;
      }

      // 4. Si todo falla
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'No se pudo obtener ubicación'
      }));
      return null;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return null;
    }
  }, [canUseGeolocation, requestGPSPermission, getLocationByIP]);

  // Reintentar con GPS específicamente
  const retryWithGPS = useCallback(async (): Promise<LocationData | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const gpsLocation = await requestGPSPermission();

    if (gpsLocation) {
      setState(prev => ({
        ...prev,
        location: gpsLocation,
        isLoading: false
      }));
      return gpsLocation;
    }

    setState(prev => ({
      ...prev,
      isLoading: false,
      error: 'No se pudo obtener ubicación GPS'
    }));
    return null;
  }, [requestGPSPermission]);

  // Usar ubicación por IP específicamente
  const useIPLocation = useCallback(async (): Promise<LocationData | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const ipLocationData = await getLocationByIP();

    if (ipLocationData) {
      setState(prev => ({
        ...prev,
        location: ipLocationData,
        isLoading: false
      }));
      return ipLocationData;
    }

    setState(prev => ({
      ...prev,
      isLoading: false,
      error: 'No se pudo obtener ubicación por IP'
    }));
    return null;
  }, [getLocationByIP]);

  // Limpiar ubicación
  const clearLocation = useCallback(() => {
    setState(prev => ({
      ...prev,
      location: null,
      error: null,
    }));
    resetPermissions();
  }, [resetPermissions]);

  return {
    ...state,
    requestLocation,
    clearLocation,
    retryWithGPS,
    useIPLocation,
  };
};
