import { useCallback, useEffect, useState } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  country?: string;
  method: 'gps' | 'ip' | 'none';
  timestamp: number;
}

interface PermissionRejectionState {
  gpsPermission: 'granted' | 'denied' | 'prompt' | 'unknown';
  ipLocation: LocationData | null;
  isLoading: boolean;
  error: string | null;
  hasAttemptedGPS: boolean;
}

interface UsePermissionRejectionReturn extends PermissionRejectionState {
  requestGPSPermission: () => Promise<LocationData | null>;
  getLocationByIP: () => Promise<LocationData | null>;
  resetPermissions: () => void;
  getBestAvailableLocation: () => LocationData | null;
}

export const usePermissionRejection = (): UsePermissionRejectionReturn => {
  const [state, setState] = useState<PermissionRejectionState>({
    gpsPermission: 'unknown',
    ipLocation: null,
    isLoading: false,
    error: null,
    hasAttemptedGPS: false,
  });

  // Verificar estado inicial de permisos
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then((permissionStatus) => {
          setState(prev => ({
            ...prev,
            gpsPermission: permissionStatus.state as 'granted' | 'denied' | 'prompt'
          }));

          // Escuchar cambios en el estado del permiso
          permissionStatus.onchange = () => {
            setState(prev => ({
              ...prev,
              gpsPermission: permissionStatus.state as 'granted' | 'denied' | 'prompt'
            }));
          };
        })
        .catch(() => {
          // Fallback para navegadores que no soportan permissions API
          setState(prev => ({ ...prev, gpsPermission: 'unknown' }));
        });
    } else {
      setState(prev => ({ ...prev, gpsPermission: 'unknown' }));
    }
  }, []);

  // Solicitar permiso GPS
  const requestGPSPermission = useCallback(async (): Promise<LocationData | null> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      hasAttemptedGPS: true
    }));

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Geolocalización no soportada en este navegador'
        }));
        resolve(null);
        return;
      }

      const successCallback = (position: GeolocationPosition) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          method: 'gps',
          timestamp: Date.now(),
        };

        setState(prev => ({
          ...prev,
          isLoading: false,
          gpsPermission: 'granted'
        }));

        resolve(locationData);
      };

      const errorCallback = (error: GeolocationPositionError) => {
        let errorMessage = 'Error desconocido al obtener ubicación';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado por el usuario';
            setState(prev => ({ ...prev, gpsPermission: 'denied' }));
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado para obtener ubicación';
            break;
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));

        resolve(null);
      };

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutos
      };

      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    });
  }, []);

  // Obtener ubicación por IP como fallback
  const getLocationByIP = useCallback(async (): Promise<LocationData | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Usar servicio de geolocalización por IP
      const response = await fetch('https://ipapi.co/json/');

      if (!response.ok) {
        throw new Error('No se pudo obtener ubicación por IP');
      }

      const data = await response.json();

      const locationData: LocationData = {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: 50000, // Baja precisión para ubicación por IP
        city: data.city,
        country: data.country_name,
        method: 'ip',
        timestamp: Date.now(),
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        ipLocation: locationData
      }));

      return locationData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener ubicación por IP';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      return null;
    }
  }, []);

  // Obtener la mejor ubicación disponible
  const getBestAvailableLocation = useCallback((): LocationData | null => {
    // Si tenemos ubicación GPS, usarla
    if (state.gpsPermission === 'granted') {
      return null; // El GPS se maneja en el hook principal
    }

    // Si no hay GPS, usar ubicación por IP
    return state.ipLocation;
  }, [state.gpsPermission, state.ipLocation]);

  // Resetear permisos
  const resetPermissions = useCallback(() => {
    setState({
      gpsPermission: 'unknown',
      ipLocation: null,
      isLoading: false,
      error: null,
      hasAttemptedGPS: false,
    });
  }, []);

  return {
    ...state,
    requestGPSPermission,
    getLocationByIP,
    resetPermissions,
    getBestAvailableLocation,
  };
};
