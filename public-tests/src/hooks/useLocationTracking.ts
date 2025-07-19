import { useCallback, useEffect, useState } from 'react';
import { getApiUrl } from '../config/endpoints.js';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  source: 'gps' | 'ip';
}

interface LocationTrackingState {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  hasConsent: boolean;
  hasRequested: boolean;
  requestLocation: () => Promise<void>;
  rejectLocation: () => void;
  clearLocation: () => void;
}

interface UseLocationTrackingProps {
  researchId: string | null;
  trackLocationEnabled: boolean;
}

/**
 * Hook para manejar el tracking de ubicación con consentimiento
 * Solo solicita ubicación si trackLocation está habilitado en la configuración
 */
export const useLocationTracking = ({
  researchId,
  trackLocationEnabled
}: UseLocationTrackingProps): LocationTrackingState => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  // Verificar si ya se ha solicitado consentimiento
  useEffect(() => {
    const consentKey = `location_consent_${researchId}`;
    const storedConsent = localStorage.getItem(consentKey);

    if (storedConsent) {
      const consentData = JSON.parse(storedConsent);
      setHasConsent(consentData.hasConsent);
      setHasRequested(true);

      // Si ya dio consentimiento, cargar ubicación guardada
      if (consentData.hasConsent && consentData.location) {
        setLocation(consentData.location);
      }
    }
  }, [researchId]);

  // Función para obtener ubicación por GPS
  const getGPSLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
            source: 'gps'
          };
          resolve(locationData);
        },
        (error) => {
          reject(new Error(`Error de geolocalización: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      );
    });
  }, []);

  // Función para obtener ubicación aproximada por IP
  const getIPLocation = useCallback(async (): Promise<LocationData> => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: new Date().toISOString(),
        source: 'ip'
      };
    } catch (error) {
      throw new Error('No se pudo obtener ubicación por IP');
    }
  }, []);

  // Función principal para solicitar ubicación
  const requestLocation = useCallback(async () => {
    if (!trackLocationEnabled || !researchId) {
      console.log('[useLocationTracking] Tracking de ubicación deshabilitado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Intentar GPS primero
      const locationData = await getGPSLocation();

      // Guardar consentimiento y ubicación
      const consentKey = `location_consent_${researchId}`;
      const consentData = {
        hasConsent: true,
        timestamp: new Date().toISOString(),
        location: locationData
      };

      localStorage.setItem(consentKey, JSON.stringify(consentData));
      setLocation(locationData);
      setHasConsent(true);
      setHasRequested(true);

      // Enviar al backend
      await sendLocationToBackend(locationData);

      console.log('[useLocationTracking] Ubicación obtenida por GPS:', locationData);
    } catch (gpsError) {
      console.warn('[useLocationTracking] GPS falló, intentando IP:', gpsError);

      try {
        // Fallback a IP
        const ipLocationData = await getIPLocation();

        // Guardar consentimiento y ubicación
        const consentKey = `location_consent_${researchId}`;
        const consentData = {
          hasConsent: true,
          timestamp: new Date().toISOString(),
          location: ipLocationData
        };

        localStorage.setItem(consentKey, JSON.stringify(consentData));
        setLocation(ipLocationData);
        setHasConsent(true);
        setHasRequested(true);

        // Enviar al backend
        await sendLocationToBackend(ipLocationData);

        console.log('[useLocationTracking] Ubicación obtenida por IP:', ipLocationData);
      } catch (ipError) {
        setError('No se pudo obtener ubicación');
        console.error('[useLocationTracking] Error obteniendo ubicación:', ipError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [trackLocationEnabled, researchId, getGPSLocation, getIPLocation]);

  // Función para enviar ubicación al backend
  const sendLocationToBackend = useCallback(async (locationData: LocationData) => {
    if (!researchId) return;

    try {
      const response = await fetch(`${getApiUrl('location-tracking')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          researchId,
          location: locationData,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      console.log('[useLocationTracking] Ubicación enviada al backend exitosamente');
    } catch (error) {
      console.error('[useLocationTracking] Error enviando ubicación al backend:', error);
      // No lanzar error para no interrumpir el flujo
    }
  }, [researchId]);

  // Función para rechazar tracking
  const rejectLocation = useCallback(() => {
    const consentKey = `location_consent_${researchId}`;
    const consentData = {
      hasConsent: false,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(consentKey, JSON.stringify(consentData));
    setHasConsent(false);
    setHasRequested(true);

    console.log('[useLocationTracking] Tracking de ubicación rechazado');
  }, [researchId]);

  // Función para limpiar datos de ubicación
  const clearLocation = useCallback(() => {
    if (researchId) {
      const consentKey = `location_consent_${researchId}`;
      localStorage.removeItem(consentKey);
    }
    setLocation(null);
    setHasConsent(false);
    setHasRequested(false);
    setError(null);
  }, [researchId]);

  return {
    location,
    isLoading,
    error,
    hasConsent,
    hasRequested,
    requestLocation,
    rejectLocation,
    clearLocation
  };
};
