import React from 'react';
import { useGeolocationWithGDPR } from '../../hooks/useGeolocationWithGDPR';
import { GDPRConsentModal } from './GDPRConsentModal';

interface GDPRGeolocationExampleProps {
  researchId?: string;
  researchTitle?: string;
  onLocationObtained?: (location: any) => void;
  className?: string;
}

export const GDPRGeolocationExample: React.FC<GDPRGeolocationExampleProps> = ({
  researchId = 'test-research',
  researchTitle = 'Investigación de Usabilidad',
  onLocationObtained,
  className = ''
}) => {
  const {
    // Estado de geolocalización
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

    // Estado de GDPR
    needsGDPRConsent,
    canUseGeolocation,
    gdprConsent,

    // Acciones
    requestLocation,
    requestGDPRConsent,
    retry,
    resetAll,

    // Props del modal
    gdprModalProps,

    // Utilidades
    getGeolocationInfo
  } = useGeolocationWithGDPR({
    researchId,
    researchTitle,
    autoRequestConsent: true,
    enableHighAccuracy: true,
    timeout: 10000,
    fallbackToIP: true
  });

  // Notificar cuando se obtiene la ubicación
  React.useEffect(() => {
    if (latitude && longitude && onLocationObtained) {
      onLocationObtained({
        latitude,
        longitude,
        accuracy,
        city,
        country,
        region,
        ipAddress,
        gdprConsent
      });
    }
  }, [latitude, longitude, accuracy, city, country, region, ipAddress, gdprConsent, onLocationObtained]);

  const handleManualRequest = () => {
    if (needsGDPRConsent) {
      requestGDPRConsent();
    } else {
      requestLocation();
    }
  };

  return (
    <div className={`space-y-4 p-4 border rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Geolocalización con Consentimiento GDPR
        </h3>
        <div className="flex space-x-2">
          <button
            data-testid="request-location-button"
            onClick={handleManualRequest}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Obteniendo...' : 'Solicitar Ubicación'}
          </button>
          <button
            data-testid="retry-button"
            onClick={retry}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Reintentar
          </button>
          <button
            data-testid="reset-button"
            onClick={resetAll}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Resetear
          </button>
        </div>
      </div>

      {/* Estado de GDPR */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-medium text-blue-900 mb-2">Estado de Consentimiento GDPR</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Necesita consentimiento:</strong> <span data-testid="needs-gdpr-consent">{needsGDPRConsent ? 'Sí' : 'No'}</span></p>
          <p><strong>Puede usar geolocalización:</strong> <span data-testid="can-use-geolocation">{canUseGeolocation ? 'Sí' : 'No'}</span></p>
          <p><strong>Ha consentido:</strong> <span data-testid="has-consented">{gdprConsent.hasConsented === null ? 'No decidido' : gdprConsent.hasConsented ? 'Sí' : 'No'}</span></p>
          <p><strong>Ha rechazado:</strong> <span data-testid="has-rejected">{gdprConsent.hasRejected ? 'Sí' : 'No'}</span></p>
          {gdprConsent.timestamp && (
            <p><strong>Timestamp:</strong> <span data-testid="consent-timestamp">{new Date(gdprConsent.timestamp).toLocaleString()}</span></p>
          )}
        </div>
      </div>

      {/* Estado de Geolocalización */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <h4 className="font-medium text-green-900 mb-2">Estado de Geolocalización</h4>
        <div className="text-sm text-green-800 space-y-1">
          <p><strong>Estado del permiso:</strong> <span data-testid="permission-status">{permissionStatus}</span></p>
          <p><strong>Cargando:</strong> <span data-testid="is-loading">{isLoading ? 'Sí' : 'No'}</span></p>
          {error && <p><strong>Error:</strong> <span data-testid="geolocation-error" className="text-red-600">{error}</span></p>}
        </div>
      </div>

      {/* Datos de Ubicación */}
      {(latitude || city) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h4 className="font-medium text-gray-900 mb-2">Datos de Ubicación</h4>
          <div className="text-sm text-gray-700 space-y-1">
            {latitude && longitude && (
              <>
                <p><strong>Coordenadas GPS:</strong> <span data-testid="gps-coordinates">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span></p>
                {accuracy && <p><strong>Precisión:</strong> <span data-testid="gps-accuracy">{accuracy.toFixed(1)} metros</span></p>}
              </>
            )}
            {city && <p><strong>Ciudad:</strong> <span data-testid="location-city">{city}</span></p>}
            {region && <p><strong>Región:</strong> <span data-testid="location-region">{region}</span></p>}
            {country && <p><strong>País:</strong> <span data-testid="location-country">{country}</span></p>}
            {ipAddress && <p><strong>IP:</strong> <span data-testid="location-ip">{ipAddress}</span></p>}
          </div>
          {/* Elemento contenedor para todos los datos de ubicación */}
          <div
            data-testid="location-data"
            style={{ display: 'none' }}
          >
            {JSON.stringify({
              latitude,
              longitude,
              accuracy,
              city,
              country,
              region,
              ipAddress
            })}
          </div>
        </div>
      )}

      {/* Información de Debug */}
      <details className="bg-gray-100 border border-gray-300 rounded-lg p-3">
        <summary className="font-medium text-gray-900 cursor-pointer">
          Información de Debug
        </summary>
        <pre className="text-xs text-gray-700 mt-2 overflow-auto">
          {JSON.stringify(getGeolocationInfo(), null, 2)}
        </pre>
      </details>

      {/* Modal de Consentimiento GDPR */}
      <GDPRConsentModal {...gdprModalProps} />
    </div>
  );
};
