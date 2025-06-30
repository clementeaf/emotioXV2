import React, { useState } from 'react';
import { useGDPRConsent } from '../../hooks/useGDPRConsent';
import { useGDPRPreferences } from '../../hooks/useGDPRPreferences';
import { GDPRConsentModal } from './GDPRConsentModal';
import { GDPRPreferencesPanel } from './GDPRPreferencesPanel';

export const GDPRPreferencesExample: React.FC = () => {
  const [showPreferencesPanel, setShowPreferencesPanel] = useState(false);

  const {
    consentState,
    requestConsent,
    resetConsent,
    rememberDecision,
    setRememberDecision,
    isModalOpen,
    handleAccept,
    handleReject,
    closeModal,
    needsConsent,
    canUseGeolocation,
    getConsentInfo
  } = useGDPRConsent('test-research-preferences');

  const {
    preferences: gdprPreferences,
    resetPreferences
  } = useGDPRPreferences();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          ⚙️ Sistema de Preferencias GDPR - Ejemplo
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Estado del Consentimiento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Estado del Consentimiento</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Consentimiento:</span>
                <span className={`font-medium ${
                  consentState.hasConsented ? 'text-green-600' :
                  consentState.hasRejected ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {consentState.hasConsented ? 'Aceptado' :
                   consentState.hasRejected ? 'Rechazado' : 'Pendiente'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Recordar decisión:</span>
                <span className={`font-medium ${rememberDecision ? 'text-green-600' : 'text-gray-400'}`}>
                  {rememberDecision ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Necesita consentimiento:</span>
                <span className={`font-medium ${needsConsent ? 'text-yellow-600' : 'text-green-600'}`}>
                  {needsConsent ? 'Sí' : 'No'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Puede usar geolocalización:</span>
                <span className={`font-medium ${canUseGeolocation ? 'text-green-600' : 'text-red-600'}`}>
                  {canUseGeolocation ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Preferencias del Sistema */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Preferencias del Sistema</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Recordar decisión:</span>
                <span className={`font-medium ${gdprPreferences.rememberDecision ? 'text-green-600' : 'text-gray-400'}`}>
                  {gdprPreferences.rememberDecision ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Auto-aceptar:</span>
                <span className={`font-medium ${gdprPreferences.autoAccept ? 'text-green-600' : 'text-gray-400'}`}>
                  {gdprPreferences.autoAccept ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Info detallada:</span>
                <span className={`font-medium ${gdprPreferences.showDetailedInfo ? 'text-green-600' : 'text-gray-400'}`}>
                  {gdprPreferences.showDetailedInfo ? 'Mostrar' : 'Ocultar'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Frecuencia:</span>
                <span className="font-medium text-blue-600">
                  {gdprPreferences.notificationFrequency === 'always' ? 'Siempre' :
                   gdprPreferences.notificationFrequency === 'once' ? 'Una vez' : 'Nunca'}
                </span>
              </div>
            </div>
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
              🔒 Solicitar Consentimiento
            </button>

            <button
              onClick={() => setShowPreferencesPanel(true)}
              className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 border border-purple-300 rounded-md hover:bg-purple-200 transition-colors"
            >
              ⚙️ Configurar Preferencias
            </button>

            <button
              onClick={resetConsent}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors"
            >
              🔄 Resetear Consentimiento
            </button>

            <button
              onClick={resetPreferences}
              className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded-md hover:bg-orange-200 transition-colors"
            >
              🔄 Resetear Preferencias
            </button>
          </div>
        </div>

        {/* Información de Debug */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Información de Debug</h3>
          <pre className="text-xs text-gray-600 overflow-auto max-h-64">
            {JSON.stringify({
              consentState,
              rememberDecision,
              needsConsent,
              canUseGeolocation,
              preferences: gdprPreferences,
              consentInfo: getConsentInfo()
            }, null, 2)}
          </pre>
        </div>

        {/* Información del Historial */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Historial de Consentimientos</h3>
          <div className="text-sm text-blue-800">
            <p>
              <strong>Investigación actual:</strong> test-research-preferences
            </p>
            <p>
              <strong>Consentimiento almacenado:</strong> {
                (() => {
                  try {
                    const history = localStorage.getItem('emotio_gdpr_consent_history');
                    if (history) {
                      const consentHistory = JSON.parse(history);
                      const researchConsent = consentHistory['test-research-preferences'];
                      return researchConsent ? researchConsent.status : 'Ninguno';
                    }
                    return 'Ninguno';
                  } catch (error) {
                    return 'Error al leer historial';
                  }
                })()
              }
            </p>
            <p>
              <strong>Total de investigaciones en historial:</strong> {
                (() => {
                  try {
                    const history = localStorage.getItem('emotio_gdpr_consent_history');
                    if (history) {
                      const consentHistory = JSON.parse(history);
                      return Object.keys(consentHistory).length;
                    }
                    return 0;
                  } catch (error) {
                    return 'Error';
                  }
                })()
              }
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Consentimiento GDPR */}
      <GDPRConsentModal
        isOpen={isModalOpen}
        onAccept={handleAccept}
        onReject={handleReject}
        onClose={closeModal}
        researchTitle="esta investigación de preferencias"
        rememberDecision={rememberDecision}
        onRememberDecisionChange={setRememberDecision}
      />

      {/* Panel de Preferencias */}
      <GDPRPreferencesPanel
        isOpen={showPreferencesPanel}
        onClose={() => setShowPreferencesPanel(false)}
      />
    </div>
  );
};
