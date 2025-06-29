import React from 'react';
import { StepTimeoutState } from '../../hooks/useStepTimeout';

interface StepTimeoutDisplayProps {
  timeoutState: StepTimeoutState;
  variant?: 'minimal' | 'detailed' | 'progress-bar';
  className?: string;
  showProgress?: boolean;
  showWarning?: boolean;
}

export const StepTimeoutDisplay: React.FC<StepTimeoutDisplayProps> = ({
  timeoutState,
  variant = 'minimal',
  className = '',
  showProgress = true,
  showWarning = true
}) => {
  const { isActive, timeRemaining, isWarning, isExpired, progress } = timeoutState;

  // No mostrar si no está activo
  if (!isActive) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const getTimeColor = (): string => {
    if (isExpired) return 'text-red-600';
    if (isWarning) return 'text-orange-600';
    return 'text-neutral-600';
  };

  const getProgressColor = (): string => {
    if (isExpired) return 'bg-red-500';
    if (isWarning) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  // Variante minimal - solo tiempo restante
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 text-sm font-mono ${getTimeColor()} ${className}`}>
        {isWarning && showWarning && (
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
        )}
        {isExpired && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
        <span>{formatTime(timeRemaining)}</span>
      </div>
    );
  }

  // Variante detailed - con más información
  if (variant === 'detailed') {
    return (
      <div className={`bg-neutral-50 border border-neutral-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">Tiempo restante</span>
          <span className={`text-lg font-mono font-bold ${getTimeColor()}`}>
            {formatTime(timeRemaining)}
          </span>
        </div>

        {showProgress && (
          <div className="w-full bg-neutral-200 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {isWarning && showWarning && (
          <div className="text-xs text-orange-600 font-medium">
            ⚠️ Tiempo limitado
          </div>
        )}

        {isExpired && (
          <div className="text-xs text-red-600 font-medium">
            ⏰ Tiempo agotado
          </div>
        )}
      </div>
    );
  }

  // Variante progress-bar - barra de progreso prominente
  if (variant === 'progress-bar') {
    return (
      <div className={`bg-white border border-neutral-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-neutral-700">Límite de tiempo</span>
          <span className={`text-xl font-mono font-bold ${getTimeColor()}`}>
            {formatTime(timeRemaining)}
          </span>
        </div>

        <div className="w-full bg-neutral-200 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>0s</span>
          <span className="font-medium">
            {isWarning && showWarning ? '⚠️ Tiempo limitado' : ''}
            {isExpired ? '⏰ Tiempo agotado' : ''}
          </span>
          <span>{formatTime(timeRemaining)}</span>
        </div>
      </div>
    );
  }

  return null;
};
