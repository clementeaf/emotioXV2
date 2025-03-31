import React from 'react';
import { UI_TEXTS } from '../constants';

interface ErrorData {
  title: string;
  message: string | React.ReactNode;
  type: 'error' | 'info' | 'success';
}

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ErrorData | null;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, error }) => {
  if (!isOpen || !error) return null;

  // Determinar el título basado en el tipo
  const getTitle = () => {
    switch (error.type) {
      case 'error':
        return error.title || UI_TEXTS.MODAL.ERROR_TITLE;
      case 'info':
        return error.title || UI_TEXTS.MODAL.INFO_TITLE;
      case 'success':
        return error.title || UI_TEXTS.MODAL.SUCCESS_TITLE;
      default:
        return error.title || UI_TEXTS.MODAL.ERROR_TITLE;
    }
  };

  // Determinar las clases de color basadas en el tipo
  const getColorClasses = () => {
    switch (error.type) {
      case 'error':
        return {
          header: 'bg-red-500',
          button: 'bg-red-500 hover:bg-red-600'
        };
      case 'info':
        return {
          header: 'bg-blue-500',
          button: 'bg-blue-500 hover:bg-blue-600'
        };
      case 'success':
        return {
          header: 'bg-green-500',
          button: 'bg-green-500 hover:bg-green-600'
        };
      default:
        return {
          header: 'bg-red-500',
          button: 'bg-red-500 hover:bg-red-600'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`px-4 py-3 ${colors.header}`}>
          <h3 className="text-lg font-medium text-white">{getTitle()}</h3>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            {typeof error.message === 'string' ? (
              <p className="text-sm text-gray-700">{error.message}</p>
            ) : (
              error.message
            )}
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${colors.button} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {UI_TEXTS.MODAL.CLOSE_BUTTON}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 