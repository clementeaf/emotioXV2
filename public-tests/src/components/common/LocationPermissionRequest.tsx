import React from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';

interface LocationPermissionRequestProps {
  onLocationGranted?: (location: { latitude: number; longitude: number; accuracy?: number }) => void;
  onLocationDenied?: () => void;
  showFallbackInfo?: boolean;
  className?: string;
}

export const LocationPermissionRequest: React.FC<LocationPermissionRequestProps> = ({
  onLocationGranted,
  onLocationDenied,
  showFallbackInfo = true,
  className = ''
}) => {
  const {
    latitude,
    longitude,
    accuracy,
    city,
    country,
    region,
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

  // Notificar cuando se obtiene ubicación
  React.useEffect(() => {
    if (latitude && longitude && onLocationGranted) {
      onLocationGranted({ latitude, longitude, accuracy });
    }
  }, [latitude, longitude, accuracy, onLocationGranted]);

  // Notificar cuando se deniega el permiso
  React.useEffect(() => {
    if (permissionStatus === 'denied' && onLocationDenied) {
      onLocationDenied();
    }
  }, [permissionStatus, onLocationDenied]);

  if (!isGeolocationSupported) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Geolocalización no soportada
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Tu navegador no soporta geolocalización. Se usará ubicación aproximada por IP.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Obteniendo ubicación...
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>Por favor, acepta el permiso de ubicación cuando tu navegador lo solicite.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Permiso de ubicación denegado
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Para obtener tu ubicación precisa, necesitas habilitar el permiso de ubicación en tu navegador.</p>
              {showFallbackInfo && (
                <div className="mt-3">
                  <button
                    onClick={retry}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (latitude && longitude) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Ubicación obtenida
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                <strong>Coordenadas:</strong> {latitude.toFixed(6)}, {longitude.toFixed(6)}
                {accuracy && <span> (Precisión: ±{Math.round(accuracy)}m)</span>}
              </p>
              {city && country && (
                <p className="mt-1">
                  <strong>Ubicación:</strong> {city}, {region && `${region}, `}{country}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && (city || country)) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Ubicación aproximada
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>No se pudo obtener ubicación precisa, pero se detectó tu ubicación aproximada:</p>
              {city && country && (
                <p className="mt-1 font-medium">
                  {city}, {region && `${region}, `}{country}
                </p>
              )}
              <div className="mt-3">
                <button
                  onClick={retry}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Intentar ubicación precisa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error al obtener ubicación
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              <div className="mt-3">
                <button
                  onClick={retry}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado inicial - solicitar permiso
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">
            Permiso de ubicación requerido
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>Esta investigación necesita acceder a tu ubicación para mejorar la precisión de los datos.</p>
            <div className="mt-3">
              <button
                onClick={requestLocation}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Permitir ubicación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
