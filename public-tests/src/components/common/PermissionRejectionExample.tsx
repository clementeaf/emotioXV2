import React, { useState } from 'react';
import { useGDPRConsent } from '../../hooks/useGDPRConsent';
import { useGeolocationWithConsent } from '../../hooks/useGeolocationWithConsent';
import { GDPRConsentModal } from './GDPRConsentModal';
import { PermissionRejectionNotice } from './PermissionRejectionNotice';

export const PermissionRejectionExample: React.FC = () => {
  const [showRejectionNotice, setShowRejectionNotice] = useState(false);
  const [rejectionError, setRejectionError] = useState<string>('');

  const {
    location,
    isLoading,
    error,
    consentStatus,
    permissionStatus,
    hasAttemptedGPS,
    requestLocation,
    clearLocation,
    retryWithGPS,
    useIPLocation
  } = useGeolocationWithConsent();

  const {
    consentState,
    isModalOpen,
    requestConsent,
    handleAccept,
    handleReject,
    closeModal,
    resetConsent
  } = useGDPRConsent('test-research');

  // Manejar solicitud de ubicación con manejo de rechazos
  const handleRequestLocation = async () => {
    const result = await requestLocation();

    if (!result && error) {
      // Mostrar notificación de rechazo si hay error
      setRejectionError(error);
      setShowRejectionNotice(true);
    }
  };

  // Manejar reintento con GPS
  const handleRetryGPS = async () => {
    setShowRejectionNotice(false);
    const result = await retryWithGPS();

    if (!result && error) {
      setRejectionError(error);
      setShowRejectionNotice(true);
    }
  };

  // Manejar uso de ubicación por IP
  const handleUseIPLocation = async () => {
    setShowRejectionNotice(false);
    await useIPLocation();
  };

  // Manejar rechazo de notificación
  const handleDismissNotice = () => {
    setShowRejectionNotice(false);
    setRejectionError('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🔒 Manejo de Rechazos de Permisos - Ejemplo
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Estado del Sistema */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Estado del Sistema</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Consentimiento GDPR:</span>
                <span className={`font-medium ${
                  consentStatus === 'granted' ? 'text-green-600' :
                  consentStatus === 'denied' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {consentStatus}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Permiso GPS:</span>
                <span className={`font-medium ${
                  permissionStatus === 'granted' ? 'text-green-600' :
                  permissionStatus === 'denied' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {permissionStatus}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Intentó GPS:</span>
                <span className={`font-medium ${hasAttemptedGPS ? 'text-blue-600' : 'text-gray-400'}`}>
                  {hasAttemptedGPS ? 'Sí' : 'No'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Cargando:</span>
                <span className={`font-medium ${isLoading ? 'text-blue-600' : 'text-gray-400'}`}>
                  {isLoading ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Ubicación Actual */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Ubicación Actual</h3>

            {location ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-green-600 mr-2">
                    {location.method === 'gps' ? '📍' : '🌐'}
                  </span>
                  <span className="font-medium text-green-900">
                    Ubicación obtenida ({location.method.toUpperCase()})
                  </span>
                </div>

                <div className="text-sm text-green-800 space-y-1">
                  <div>Latitud: {location.latitude.toFixed(6)}</div>
                  <div>Longitud: {location.longitude.toFixed(6)}</div>
                  <div>Precisión: {location.accuracy}m</div>
                  {location.city && <div>Ciudad: {location.city}</div>}
                  {location.country && <div>País: {location.country}</div>}
                  <div className="text-xs text-green-600">
                    Obtenido: {new Date(location.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600">No hay ubicación disponible</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Controles */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Controles</h3>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={requestConsent}
              disabled={isModalOpen}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              🔒 Solicitar Consentimiento GDPR
            </button>

            <button
              onClick={handleRequestLocation}
              disabled={isLoading || !consentState.hasConsented}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              📍 Solicitar Ubicación
            </button>

            <button
              onClick={retryWithGPS}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors"
            >
              🔄 Reintentar GPS
            </button>

            <button
              onClick={useIPLocation}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 border border-purple-300 rounded-md hover:bg-purple-200 transition-colors"
            >
              🌐 Usar IP
            </button>

            <button
              onClick={clearLocation}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              🗑️ Limpiar
            </button>

            <button
              onClick={resetConsent}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors"
            >
              🔄 Resetear Consentimiento
            </button>
          </div>
        </div>

        {/* Información de Debug */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Información de Debug</h3>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify({
              consentState,
              location: location ? {
                ...location,
                timestamp: new Date(location.timestamp).toISOString()
              } : null,
              error,
              isLoading,
              consentStatus,
              permissionStatus,
              hasAttemptedGPS
            }, null, 2)}
          </pre>
        </div>
      </div>

      {/* Modal de Consentimiento GDPR */}
      <GDPRConsentModal
        isOpen={isModalOpen}
        onAccept={handleAccept}
        onReject={handleReject}
        onClose={closeModal}
        onUseIPLocation={useIPLocation}
        researchTitle="esta investigación de ejemplo"
      />

      {/* Notificación de Rechazo */}
      <PermissionRejectionNotice
        isVisible={showRejectionNotice}
        onRetry={handleRetryGPS}
        onUseIPLocation={handleUseIPLocation}
        onDismiss={handleDismissNotice}
        errorMessage={rejectionError}
      />
    </div>
  );
};
