import React from 'react';
import { useGDPRPreferences } from '../../hooks/useGDPRPreferences';

interface GDPRPreferencesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const GDPRPreferencesPanel: React.FC<GDPRPreferencesPanelProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const { preferences, updatePreferences, resetPreferences } = useGDPRPreferences();

  if (!isOpen) return null;

  const handleReset = () => {
    if (window.confirm('¿Está seguro de que desea restablecer todas sus preferencias de privacidad? Esto eliminará todo el historial de consentimientos.')) {
      resetPreferences();
    }
  };

  return (
    <div
      data-testid="gdpr-preferences-panel"
      className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}
    >
      {/* Overlay */}
      <div
        data-testid="gdpr-preferences-overlay"
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        data-testid="gdpr-preferences-content"
        className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3
                data-testid="gdpr-preferences-title"
                className="text-lg font-medium text-gray-900"
              >
                Configuración de Privacidad
              </h3>
              <p
                data-testid="gdpr-preferences-subtitle"
                className="text-sm text-gray-500"
              >
                Gestione sus preferencias de consentimiento GDPR
              </p>
            </div>
          </div>
          <button
            data-testid="gdpr-preferences-close"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          data-testid="gdpr-preferences-body"
          className="p-6"
        >
          <div className="space-y-6">
            {/* Recordar Decisión */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">
                💾 Recordar Decisión
              </h4>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="pref-remember-decision"
                  checked={preferences.rememberDecision}
                  onChange={(e) => updatePreferences({ rememberDecision: e.target.checked })}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="pref-remember-decision" className="ml-3 text-sm text-gray-700">
                  <span className="font-medium">Recordar mi decisión de consentimiento</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Si está habilitado, su elección de consentimiento se recordará para futuras investigaciones similares.
                  </p>
                </label>
              </div>
            </div>

            {/* Auto-Aceptar */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">
                🤖 Auto-Aceptar
              </h4>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="pref-auto-accept"
                  checked={preferences.autoAccept}
                  onChange={(e) => updatePreferences({ autoAccept: e.target.checked })}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="pref-auto-accept" className="ml-3 text-sm text-gray-700">
                  <span className="font-medium">Aceptar automáticamente el consentimiento</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Si está habilitado, el consentimiento se aceptará automáticamente sin mostrar el modal.
                  </p>
                </label>
              </div>
            </div>

            {/* Mostrar Información Detallada */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">
                📋 Información Detallada
              </h4>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="pref-show-detailed-info"
                  checked={preferences.showDetailedInfo}
                  onChange={(e) => updatePreferences({ showDetailedInfo: e.target.checked })}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="pref-show-detailed-info" className="ml-3 text-sm text-gray-700">
                  <span className="font-medium">Mostrar información detallada</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Si está habilitado, se mostrará información completa sobre el tratamiento de datos.
                  </p>
                </label>
              </div>
            </div>

            {/* Frecuencia de Notificaciones */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">
                🔔 Frecuencia de Notificaciones
              </h4>
              <div className="space-y-2">
                <label className="block text-sm text-gray-700">
                  <span className="font-medium">¿Cuándo mostrar notificaciones de consentimiento?</span>
                </label>
                <select
                  value={preferences.notificationFrequency}
                  onChange={(e) => updatePreferences({
                    notificationFrequency: e.target.value as 'always' | 'once' | 'never'
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="always">Siempre preguntar</option>
                  <option value="once">Preguntar una vez por investigación</option>
                  <option value="never">No preguntar si ya rechazó</option>
                </select>
                <p className="text-xs text-gray-500">
                  Esta configuración determina cuándo se le mostrarán las notificaciones de consentimiento.
                </p>
              </div>
            </div>

            {/* Información del Sistema */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-md font-semibold text-blue-900 mb-2">
                ℹ️ Información del Sistema
              </h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  <strong>Última actualización:</strong> {new Date(preferences.lastUpdated).toLocaleString()}
                </p>
                <p>
                  <strong>Estado actual:</strong> {preferences.rememberDecision ? 'Recordando decisiones' : 'No recordando decisiones'}
                </p>
                <p>
                  <strong>Auto-aceptación:</strong> {preferences.autoAccept ? 'Habilitada' : 'Deshabilitada'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          data-testid="gdpr-preferences-footer"
          className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50"
        >
          <button
            data-testid="gdpr-preferences-reset"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            🔄 Restablecer Preferencias
          </button>
          <button
            data-testid="gdpr-preferences-save"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            ✅ Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
