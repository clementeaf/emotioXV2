import React from 'react';

interface PermissionRejectionNoticeProps {
  isVisible: boolean;
  onRetry: () => void;
  onUseIPLocation: () => void;
  onDismiss: () => void;
  errorMessage?: string;
  className?: string;
}

export const PermissionRejectionNotice: React.FC<PermissionRejectionNoticeProps> = ({
  isVisible,
  onRetry,
  onUseIPLocation,
  onDismiss,
  errorMessage = 'Permiso de ubicación denegado',
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <div
      data-testid="permission-rejection-notice"
      className={`fixed top-4 right-4 z-50 max-w-sm w-full ${className}`}
    >
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-2">
              <h3 className="text-sm font-medium text-yellow-900">
                Permiso de ubicación requerido
              </h3>
            </div>
          </div>
          <button
            data-testid="permission-rejection-dismiss"
            onClick={onDismiss}
            className="text-yellow-400 hover:text-yellow-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-sm text-yellow-800 mb-2">
            {errorMessage}
          </p>
          <p className="text-xs text-yellow-700">
            Para mejorar la precisión de la investigación, necesitamos acceder a su ubicación.
            Puede intentar nuevamente o usar ubicación aproximada.
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            data-testid="permission-rejection-retry"
            onClick={onRetry}
            className="flex-1 px-3 py-2 text-xs font-medium text-yellow-900 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            🔄 Intentar nuevamente
          </button>
          <button
            data-testid="permission-rejection-ip"
            onClick={onUseIPLocation}
            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            📍 Usar ubicación aproximada
          </button>
        </div>

        {/* Help text */}
        <div className="mt-3 pt-3 border-t border-yellow-200">
          <p className="text-xs text-yellow-600">
            💡 <strong>Consejo:</strong> Para permitir ubicación, haga clic en el ícono de ubicación en la barra de direcciones de su navegador.
          </p>
        </div>
      </div>
    </div>
  );
};
