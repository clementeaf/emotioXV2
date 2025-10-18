import React from 'react';
import type { AlertProps } from './types';

const Alert: React.FC<AlertProps> = ({
  type = 'error',
  children,
  className = ''
}) => {
  const baseClasses = 'px-4 py-3 rounded-lg flex items-center space-x-2';
  
  const typeClasses = {
    error: 'bg-red-50 border border-red-200 text-red-600',
    success: 'bg-green-50 border border-green-200 text-green-600',
    warning: 'bg-yellow-50 border border-yellow-200 text-yellow-600',
    info: 'bg-blue-50 border border-blue-200 text-blue-600'
  };

  const icons = {
    error: '⚠️',
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      <span>{icons[type]}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
};

export default Alert;
