import React from 'react';

interface ErrorDisplayProps {
  message: string;
  component?: string;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  component = 'Componente',
  className = ''
}) => {
  return (
    <div className={`text-red-500 ${className}`}>
      {component} no soportado: {message}
    </div>
  );
};
