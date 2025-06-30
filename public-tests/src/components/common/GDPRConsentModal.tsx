import React, { useEffect, useState } from 'react';

interface GDPRConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
  onUseIPLocation?: () => void;
  researchTitle?: string;
  className?: string;
  rememberDecision?: boolean;
  onRememberDecisionChange?: (remember: boolean) => void;
}

export const GDPRConsentModal: React.FC<GDPRConsentModalProps> = ({
  isOpen,
  onAccept,
  onReject,
  onClose,
  onUseIPLocation,
  researchTitle = 'esta investigación',
  className = '',
  rememberDecision,
  onRememberDecisionChange
}) => {
  const [hasInteracted, setHasInteracted] = useState(false);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAccept = () => {
    setHasInteracted(true);
    onAccept();
  };

  const handleReject = () => {
    setHasInteracted(true);
    onReject();
  };

  const handleClose = () => {
    if (hasInteracted) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="gdpr-modal"
      className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}
    >
      {/* Overlay */}
      <div
        data-testid="gdpr-modal-overlay"
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        data-testid="gdpr-modal-content"
        className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3
                data-testid="gdpr-modal-title"
                className="text-lg font-medium text-gray-900"
              >
                Consentimiento de Geolocalización
              </h3>
              <p
                data-testid="gdpr-modal-subtitle"
                className="text-sm text-gray-500"
              >
                Cumplimiento GDPR - Reglamento General de Protección de Datos
              </p>
            </div>
          </div>
          {hasInteracted && (
            <button
              data-testid="gdpr-modal-close"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div
          data-testid="gdpr-modal-body"
          className="p-6"
        >
          <div className="space-y-4">
            {/* Introducción */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                Información sobre el tratamiento de datos de ubicación
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Como parte de {researchTitle}, necesitamos acceder a su ubicación geográfica para mejorar la precisión y relevancia de los datos recopilados. Este consentimiento es necesario para cumplir con el Reglamento General de Protección de Datos (GDPR).
              </p>
            </div>

            {/* Qué datos recopilamos */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                ¿Qué datos de ubicación recopilamos?
              </h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• <strong>Coordenadas GPS:</strong> Latitud y longitud de su ubicación actual</li>
                <li>• <strong>Precisión:</strong> Nivel de precisión de la ubicación (en metros)</li>
                <li>• <strong>Información de ciudad/país:</strong> Ubicación aproximada por IP (si GPS no está disponible)</li>
                <li>• <strong>Dirección IP:</strong> Para ubicación aproximada como respaldo</li>
              </ul>
            </div>

            {/* Cómo usamos los datos */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                ¿Cómo utilizamos estos datos?
              </h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• <strong>Análisis de investigación:</strong> Para mejorar la precisión de los resultados</li>
                <li>• <strong>Segmentación geográfica:</strong> Para análisis por región o país</li>
                <li>• <strong>Validación de datos:</strong> Para verificar la autenticidad de las respuestas</li>
                <li>• <strong>Mejora de la experiencia:</strong> Para personalizar el contenido según la ubicación</li>
              </ul>
            </div>

            {/* Derechos del usuario */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                Sus derechos según el GDPR
              </h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• <strong>Derecho de acceso:</strong> Puede solicitar qué datos tenemos sobre usted</li>
                <li>• <strong>Derecho de rectificación:</strong> Puede corregir datos inexactos</li>
                <li>• <strong>Derecho de supresión:</strong> Puede solicitar la eliminación de sus datos</li>
                <li>• <strong>Derecho de portabilidad:</strong> Puede recibir sus datos en formato estructurado</li>
                <li>• <strong>Derecho de oposición:</strong> Puede oponerse al tratamiento de sus datos</li>
                <li>• <strong>Derecho de retirada:</strong> Puede retirar su consentimiento en cualquier momento</li>
              </ul>
            </div>

            {/* Seguridad y retención */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                Seguridad y retención de datos
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Sus datos de ubicación se almacenan de forma segura y encriptada. Los datos se conservan únicamente durante el tiempo necesario para completar la investigación y se eliminan automáticamente después de 12 meses, a menos que la ley requiera un período de retención diferente.
              </p>
            </div>

            {/* Contacto */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-md font-semibold text-blue-900 mb-2">
                ¿Tiene preguntas sobre el tratamiento de sus datos?
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                Puede contactarnos en cualquier momento para ejercer sus derechos o solicitar información adicional sobre el tratamiento de sus datos personales.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  <strong>Contacto:</strong> privacy@emotiox.com
                </div>
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium underline transition-colors"
                >
                  📋 Ver aviso de privacidad completo →
                </a>
              </div>
            </div>

            {/* Preferencias de Consentimiento */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">
                ⚙️ Preferencias de Consentimiento
              </h4>

              <div className="space-y-3">
                {/* Recordar Decisión */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="remember-decision"
                    checked={rememberDecision}
                    onChange={(e) => onRememberDecisionChange?.(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-decision" className="ml-3 text-sm text-gray-700">
                    <span className="font-medium">Recordar mi decisión</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Si marca esta opción, no le volveremos a preguntar sobre el consentimiento de geolocalización
                      para futuras investigaciones de este tipo. Puede cambiar esta preferencia en cualquier momento.
                    </p>
                  </label>
                </div>

                {/* Información adicional sobre preferencias */}
                <div className="text-xs text-gray-500 bg-white p-3 rounded border">
                  <p className="mb-2">
                    <strong>¿Qué significa "recordar decisión"?</strong>
                  </p>
                  <ul className="space-y-1 ml-4">
                    <li>• Su elección se guardará en su navegador</li>
                    <li>• Se aplicará automáticamente a investigaciones similares</li>
                    <li>• Puede cambiar su decisión en cualquier momento</li>
                    <li>• Los datos se almacenan solo en su dispositivo</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          data-testid="gdpr-modal-footer"
          className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50"
        >
          <div className="text-sm text-gray-600">
            <p>Al hacer clic en "Aceptar", confirma que ha leído y comprendido esta información</p>
          </div>
          <div className="flex space-x-3">
            {onUseIPLocation && (
              <button
                data-testid="gdpr-modal-use-ip"
                onClick={onUseIPLocation}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                📍 Usar ubicación aproximada
              </button>
            )}
            <button
              data-testid="gdpr-modal-reject"
              onClick={handleReject}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Rechazar
            </button>
            <button
              data-testid="gdpr-modal-accept"
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
