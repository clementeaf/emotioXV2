import { useCallback, useEffect, useState } from 'react';
import { useParticipantStore } from '../stores/participantStore';
import { useGeolocation } from './useGeolocation';

export interface LocationTrackingState {
  isEnabled: boolean;
  isTracking: boolean;
  locationData: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    city?: string;
    country?: string;
    region?: string;
    ipAddress?: string;
  };
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported';
  error: string | null;
}

/**
 * Hook para manejar el tracking de ubicación basado en la configuración de la investigación
 */
export const useLocationTracking = (eyeTrackingConfig?: any) => {
  const [state, setState] = useState<LocationTrackingState>({
    isEnabled: false,
    isTracking: false,
    locationData: {},
    permissionStatus: 'prompt',
    error: null
  });

  // Verificar si el tracking de ubicación está habilitado en la configuración
  const isLocationTrackingEnabled = useCallback(() => {
    if (!eyeTrackingConfig) return false;

    // Buscar en diferentes ubicaciones posibles de la configuración
    const possiblePaths = [
      (eyeTrackingConfig as any).linkConfig?.trackLocation,
      (eyeTrackingConfig as any).parameterOptions?.saveLocationInfo,
      (eyeTrackingConfig as any).trackLocation
    ];

    const trackLocation = possiblePaths.find(value => value !== undefined);
    return trackLocation !== undefined ? Boolean(trackLocation) : false;
  }, [eyeTrackingConfig]);

  // Hook de geolocalización
  const {
    latitude,
    longitude,
    accuracy,
    city,
    country,
    region,
    ipAddress,
    isLoading,
    error,
    permissionStatus,
    isGeolocationSupported,
    requestLocation,
    retry
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
    fallbackToIP: true
  });

  // Actualizar estado cuando cambia la configuración
  useEffect(() => {
    const enabled = isLocationTrackingEnabled();
    setState(prev => ({
      ...prev,
      isEnabled: enabled,
      isTracking: enabled && isLoading
    }));
  }, [isLocationTrackingEnabled, isLoading]);

  // Actualizar datos de ubicación cuando se obtienen
  useEffect(() => {
    if (latitude || longitude || city || country) {
      setState(prev => ({
        ...prev,
        locationData: {
          latitude,
          longitude,
          accuracy,
          city,
          country,
          region,
          ipAddress
        },
        permissionStatus,
        error: error || null
      }));
    }
  }, [latitude, longitude, accuracy, city, country, region, ipAddress, permissionStatus, error]);

  // Guardar ubicación en el store cuando se obtiene
  const saveLocationToStore = useCallback(() => {
    if (state.isEnabled && (latitude || longitude || city || country)) {
      const currentResponsesData = useParticipantStore.getState().responsesData;

      // Actualizar la metadata en el store
      const updatedResponsesData = {
        ...currentResponsesData,
        locationInfo: {
          latitude,
          longitude,
          accuracy,
          city,
          country,
          region,
          ipAddress
        }
      };

      // Aquí podrías actualizar el store si tienes una función para ello
      // Por ahora, solo logueamos la información
      console.log('Ubicación guardada en store:', updatedResponsesData.locationInfo);
    }
  }, [state.isEnabled, latitude, longitude, accuracy, city, country, region, ipAddress]);

  // Guardar ubicación automáticamente cuando se obtiene
  useEffect(() => {
    if (state.isEnabled && (latitude || longitude || city || country)) {
      saveLocationToStore();
    }
  }, [state.isEnabled, latitude, longitude, city, country, saveLocationToStore]);

  // Función para iniciar el tracking manualmente
  const startTracking = useCallback(() => {
    if (state.isEnabled && isGeolocationSupported) {
      requestLocation();
    }
  }, [state.isEnabled, isGeolocationSupported, requestLocation]);

  // Función para detener el tracking
  const stopTracking = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTracking: false
    }));
  }, []);

  return {
    ...state,
    isGeolocationSupported,
    startTracking,
    stopTracking,
    retry,
    saveLocationToStore
  };
};
