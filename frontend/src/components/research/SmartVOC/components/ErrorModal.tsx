import React from 'react';
import { ErrorModalProps } from '../types';
import { UI_TEXTS } from '../constants';

/**
 * Componente para mostrar errores y mensajes en un modal
 */
export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  error
}) => {
  if (!isOpen || !error) {
    return null;
  }

  // Determinar el título según el tipo
  const getTitle = () => {
    switch (error.type) {
      case 'error': return UI_TEXTS.MODAL.ERROR_TITLE;
      case 'info': return UI_TEXTS.MODAL.INFO_TITLE;
      case 'success': return UI_TEXTS.MODAL.SUCCESS_TITLE;
      default: return UI_TEXTS.MODAL.ERROR_TITLE;
    }
  };

  // Clases específicas según el tipo de modal
  const getColorClasses = () => {
    switch (error.type) {
      case 'error': return 'bg-red-100 border-red-200 text-red-800';
      case 'info': return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'success': return 'bg-green-100 border-green-200 text-green-800';
      default: return 'bg-red-100 border-red-200 text-red-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div 
        className={`w-full max-w-md rounded-lg border p-6 shadow-lg ${getColorClasses()} relative`}
      >
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="mb-4">
          <h3 className="font-semibold text-lg">{getTitle()}</h3>
          <div className="mt-2">
            {typeof error.message === 'string' ? (
              <p>{error.message}</p>
            ) : (
              error.message
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              error.type === 'error' 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : error.type === 'info'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {UI_TEXTS.MODAL.CLOSE_BUTTON}
          </button>
        </div>
      </div>
    </div>
  );
}; 