import React from 'react';

interface LoadingIndicatorProps {
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message = 'Cargando...' }) => {
  return (
    <div className="p-6 text-center text-gray-500">
      {/* Podríamos añadir un spinner SVG aquí si quisiéramos */}
      <p>{message}</p>
    </div>
  );
};

export default LoadingIndicator; 