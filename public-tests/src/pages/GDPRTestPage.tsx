import React from 'react';
import { GDPRGeolocationExample } from '../components/common/GDPRGeolocationExample';

const GDPRTestPage: React.FC = () => {
  const handleLocationObtained = (location: any) => {
    console.log('📍 Ubicación obtenida:', location);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test de Consentimiento GDPR
          </h1>
          <p className="text-gray-600">
            Página de prueba para validar el funcionamiento del modal de consentimiento GDPR
          </p>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Instrucciones de Test
          </h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Esta página simula el uso del modal de consentimiento GDPR en una investigación</li>
            <li>• El modal aparecerá automáticamente si no hay consentimiento previo</li>
            <li>• Puedes aceptar o rechazar el consentimiento para probar diferentes escenarios</li>
            <li>• Los datos de ubicación se mostrarán solo después del consentimiento</li>
            <li>• Usa el botón "Resetear" para limpiar el consentimiento y probar de nuevo</li>
          </ul>
        </div>

        {/* Componente de Test */}
        <GDPRGeolocationExample
          researchId="test-research-123"
          researchTitle="Investigación de Usabilidad y Experiencia de Usuario"
          onLocationObtained={handleLocationObtained}
          className="bg-white shadow-lg"
        />

        {/* Información adicional */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Información Técnica
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Componentes Utilizados</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <code>GDPRConsentModal</code> - Modal de consentimiento</li>
                <li>• <code>useGDPRConsent</code> - Hook de gestión de consentimiento</li>
                <li>• <code>useGeolocationWithGDPR</code> - Hook combinado de geolocalización</li>
                <li>• <code>GDPRGeolocationExample</code> - Componente de ejemplo</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Funcionalidades Testeadas</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Renderizado del modal GDPR</li>
                <li>• Aceptación y rechazo de consentimiento</li>
                <li>• Persistencia en localStorage</li>
                <li>• Integración con geolocalización</li>
                <li>• Fallback a ubicación por IP</li>
                <li>• Estados de carga y error</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Enlaces de navegación */}
        <div className="mt-8 text-center">
          <div className="inline-flex space-x-4">
            <a
              href="/"
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← Volver al inicio
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              🔄 Recargar página
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GDPRTestPage;
