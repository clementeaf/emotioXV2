import React from 'react';

interface LimitIndicatorProps {
  current: number;
  max: number;
  type: 'max' | 'min';
  className?: string;
}

export const LimitIndicator: React.FC<LimitIndicatorProps> = ({
  current,
  max,
  type,
  className = ''
}) => {
  if (type === 'max' && current >= max) {
    return (
      <p className={`text-xs text-gray-500 ${className}`}>
        Máximo {max} opciones permitidas
      </p>
    );
  }

  if (type === 'min' && current <= max) {
    return (
      <p className={`text-xs text-gray-500 ${className}`}>
        Mínimo {max} opciones requeridas
      </p>
    );
  }

  return null;
};
