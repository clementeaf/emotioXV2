import React from 'react';

interface LocationConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
  researchTitle?: string;
}

export const LocationConsentModal: React.FC<LocationConsentModalProps> = ({
  isOpen,
  onAccept,
  onReject,
  onClose,
  researchTitle = 'esta investigación'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Ubicación
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Para mejorar la calidad de <strong>{researchTitle}</strong>, nos gustaría obtener tu ubicación aproximada.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">¿Qué información recopilamos?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Coordenadas GPS (latitud y longitud)</li>
              <li>• Precisión de la ubicación</li>
              <li>• Ciudad y país aproximados</li>
              <li>• Dirección IP (como respaldo)</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">¿Cómo protegemos tu privacidad?</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Solo usamos ubicación para análisis de investigación</li>
              <li>• No compartimos datos con terceros</li>
              <li>• Puedes rechazar sin afectar tu participación</li>
              <li>• Cumplimos con GDPR y regulaciones de privacidad</li>
            </ul>
          </div>

          <p className="text-sm text-gray-600">
            Tu participación es completamente voluntaria. Puedes rechazar el tracking de ubicación y continuar con la investigación normalmente.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onReject}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Rechazar
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Permitir Ubicación
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <a
            href="/privacy"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver política de privacidad
          </a>
        </div>
      </div>
    </div>
  );
};
