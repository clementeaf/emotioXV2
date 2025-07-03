import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface GeolocationState {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  city?: string;
  country?: string;
  region?: string;
  ipAddress?: string;
  isLoading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported';
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
}

const DEFAULT_OPTIONS: Required<GeolocationOptions> = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
  fallbackToIP: true
};

/**
 * Hook personalizado para manejar geolocalización con mejor UX
 * CORREGIDO: Eliminado bucle infinito de ipapi.co
 */
export const useGeolocation = (options: GeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    isLoading: false,
    error: null,
    permissionStatus: 'prompt'
  });

  const hasInitializedRef = useRef(false);

  // CORRIGIDO: Memoizar opts para evitar recreaciones
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [
    options.enableHighAccuracy,
    options.timeout,
    options.maximumAge,
    options.fallbackToIP
  ]);

  // Verificar si la geolocalización está soportada
  const isGeolocationSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  // Verificar el estado del permiso
  const checkPermissionStatus = useCallback(async (): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> => {
    if (!isGeolocationSupported) {
      return 'unsupported';
    }

    // En navegadores modernos, podemos verificar el permiso
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return permission.state as 'granted' | 'denied' | 'prompt';
      } catch (error) {
        console.warn('No se pudo verificar el estado del permiso:', error);
        return 'prompt';
      }
    }

    return 'prompt';
  }, [isGeolocationSupported]);

  // Obtener ubicación por IP como fallback
  const getLocationByIP = useCallback(async (): Promise<Partial<GeolocationState>> => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      return {
        city: data.city,
        country: data.country_name,
        region: data.region,
        ipAddress: data.ip
      };
    } catch (error) {
      console.warn('No se pudo obtener ubicación por IP:', error);
      return {};
    }
  }, []);

  // Solicitar ubicación precisa
  const requestLocation = useCallback(async (): Promise<void> => {
    if (!isGeolocationSupported) {
      setState(prev => ({
        ...prev,
        error: 'Geolocalización no soportada en este navegador',
        permissionStatus: 'unsupported'
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Verificar estado del permiso
      const permissionStatus = await checkPermissionStatus();
      setState(prev => ({ ...prev, permissionStatus }));

      if (permissionStatus === 'denied') {
        throw new Error('Permiso de ubicación denegado');
      }

      // Solicitar ubicación
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: opts.enableHighAccuracy,
          timeout: opts.timeout,
          maximumAge: opts.maximumAge
        });
      });

      // Actualizar estado con ubicación precisa
      setState(prev => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        isLoading: false,
        permissionStatus: 'granted'
      }));

    } catch (error) {
      console.warn('Error al obtener ubicación precisa:', error);

      let errorMessage = 'No se pudo obtener la ubicación';
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado';
            setState(prev => ({ ...prev, permissionStatus: 'denied' }));
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            break;
        }
      }

      // Intentar fallback a IP si está habilitado
      if (opts.fallbackToIP) {
        try {
          const ipLocation = await getLocationByIP();
          setState(prev => ({
            ...prev,
            ...ipLocation,
            isLoading: false,
            error: errorMessage + ' (usando ubicación aproximada por IP)'
          }));
          return;
        } catch (ipError) {
          console.warn('Fallback a IP también falló:', ipError);
        }
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [isGeolocationSupported, checkPermissionStatus, getLocationByIP, opts.enableHighAccuracy, opts.timeout, opts.maximumAge, opts.fallbackToIP]);

  // CORRIGIDO: Solo ejecutar una vez al montar, sin dependencias que causen loops
  useEffect(() => {
    if (isGeolocationSupported && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeolocationSupported]);

  // Función para reintentar
  const retry = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    ...state,
    isGeolocationSupported,
    requestLocation,
    retry
  };
};
