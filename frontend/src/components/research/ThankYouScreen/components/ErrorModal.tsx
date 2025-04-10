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
  // Si no debe mostrarse o no hay error, no renderizar nada
  if (!isOpen || !error) {
    return null;
  }

  // Determinar el título según el tipo
  const getModalTitle = () => {
    switch (error.type) {
      case 'error':
        return UI_TEXTS.MODAL.ERROR_TITLE;
      case 'info':
        return UI_TEXTS.MODAL.INFO_TITLE;
      case 'success':
        return UI_TEXTS.MODAL.SUCCESS_TITLE;
      default:
        return error.title || UI_TEXTS.MODAL.ERROR_TITLE;
    }
  };

  // Determinar las clases de color según el tipo
  const getColorClasses = () => {
    switch (error.type) {
      case 'error':
        return {
          header: 'bg-red-50 text-red-800',
          button: 'bg-red-500 hover:bg-red-600 text-white',
          icon: 'text-red-500'
        };
      case 'info':
        return {
          header: 'bg-blue-50 text-blue-800',
          button: 'bg-blue-500 hover:bg-blue-600 text-white',
          icon: 'text-blue-500'
        };
      case 'success':
        return {
          header: 'bg-green-50 text-green-800',
          button: 'bg-green-500 hover:bg-green-600 text-white',
          icon: 'text-green-500'
        };
      default:
        return {
          header: 'bg-red-50 text-red-800',
          button: 'bg-red-500 hover:bg-red-600 text-white',
          icon: 'text-red-500'
        };
    }
  };

  const colorClasses = getColorClasses();
  const title = getModalTitle();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        <div className={`p-4 flex justify-between items-center ${colorClasses.header}`}>
          <h3 className="text-lg font-medium">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-6">{error.message}</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded ${colorClasses.button}`}
            >
              {UI_TEXTS.MODAL.CLOSE_BUTTON}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 