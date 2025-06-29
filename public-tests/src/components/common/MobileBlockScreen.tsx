import React from 'react';

interface MobileBlockScreenProps {
    deviceType: 'mobile' | 'tablet' | 'desktop';
    researchId?: string;
    allowMobile: boolean;
    configFound: boolean;
}

export const MobileBlockScreen: React.FC<MobileBlockScreenProps> = ({
    deviceType,
    researchId,
    allowMobile,
    configFound
}) => {
    return (
        <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-red-50 to-orange-50">
            <div className="max-w-md mx-auto p-8 text-center">
                {/* Icono de dispositivo */}
                <div className="mb-6">
                    <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Título y descripción */}
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Dispositivo no compatible
                </h1>

                <p className="text-gray-600 mb-6 leading-relaxed">
                    Esta investigación está diseñada para ser completada en computadoras de escritorio o portátiles.
                    Por favor, accede desde un dispositivo compatible para participar.
                </p>

                {/* Información adicional */}
                <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                        ¿Por qué no puedo usar mi {deviceType === 'mobile' ? 'teléfono' : 'tablet'}?
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-1 text-left">
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            Algunas tareas requieren pantallas más grandes
                        </li>
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            Se necesita precisión de mouse/trackpad
                        </li>
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            Mejor experiencia de usuario en desktop
                        </li>
                    </ul>
                </div>

                {/* Botón de acción */}
                <div className="space-y-3">
                    <button
                        onClick={() => window.history.back()}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Volver atrás
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                    >
                        Intentar de nuevo
                    </button>
                </div>

                {/* Información de debug (solo en desarrollo) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-gray-600">
                        <div><strong>Debug Info:</strong></div>
                        <div>Device Type: {deviceType}</div>
                        <div>Allow Mobile: {allowMobile.toString()}</div>
                        <div>Config Found: {configFound.toString()}</div>
                        <div>Research ID: {researchId || 'N/A'}</div>
                    </div>
                )}
            </div>
        </div>
    );
};
