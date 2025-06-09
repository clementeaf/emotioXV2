import React from 'react';
import { ErrorDisplayProps } from '../../types/common.types';

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ title = 'Ocurrió un error', message }) => {
  if (!message) {
    // Si no hay mensaje, opcionalmente no renderizar nada o un mensaje por defecto
    return null; 
    // O: message = "Error desconocido.";
  }

  return (
    <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p>{message}</p>
    </div>
  );
};

export default ErrorDisplay; 