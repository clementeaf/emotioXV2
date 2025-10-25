import React from 'react';
import { Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface AlertBoxProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  className?: string;
}

export const AlertBox: React.FC<AlertBoxProps> = ({
  type,
  message,
  className = ''
}) => {
  const typeConfig = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-500',
      textColor: 'text-red-700'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      textColor: 'text-green-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      textColor: 'text-yellow-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Info,
      iconColor: 'text-blue-500',
      textColor: 'text-blue-700'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-3 ${className}`}>
      <div className="flex items-center">
        <Icon className={`h-4 w-4 ${config.iconColor} mr-2`} />
        <p className={`text-sm ${config.textColor}`}>{message}</p>
      </div>
    </div>
  );
};
