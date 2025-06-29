import React, { useMemo } from 'react';
import { useResponseTiming } from '../../hooks/useResponseTiming';

interface TimeProgressProps {
  className?: string;
  showSeconds?: boolean;
  showMinutes?: boolean;
  showHours?: boolean;
  variant?: 'minimal' | 'detailed' | 'progress-bar';
}

export const TimeProgress: React.FC<TimeProgressProps> = ({
  className = '',
  showSeconds = true,
  showMinutes = true,
  showHours = true,
  variant = 'minimal'
}) => {
  const {
    isGlobalTimerRunning,
    globalStartTime,
    globalEndTime,
    getGlobalDuration
  } = useResponseTiming();

  const currentDuration = useMemo(() => {
    return getGlobalDuration();
  }, [getGlobalDuration]);

  const formatDuration = (ms: number | null): string => {
    if (!ms || isNaN(ms) || ms < 0) {
      return '0s';
    }

    try {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0 && showHours) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
      } else if (minutes > 0 && showMinutes) {
        return `${minutes}m ${seconds % 60}s`;
      } else if (showSeconds) {
        return `${seconds}s`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      console.error('[TimeProgress] Error formateando duración:', error);
      return '0s';
    }
  };

  // No mostrar si no hay timer activo o no hay tiempo transcurrido
  if (!isGlobalTimerRunning && !currentDuration) {
    return null;
  }

  const durationText = formatDuration(currentDuration);

  // Variante minimal - solo texto pequeño
  if (variant === 'minimal') {
    return (
      <div className={`text-xs text-neutral-500 font-mono ${className}`}>
        <span className="inline-flex items-center gap-1">
          {isGlobalTimerRunning && (
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          )}
          {durationText}
        </span>
      </div>
    );
  }

  // Variante detailed - con más información
  if (variant === 'detailed') {
    return (
      <div className={`bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm ${className}`}>
        <div className="flex items-center justify-between">
          <span className="font-medium text-neutral-700">Tiempo de sesión</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isGlobalTimerRunning
              ? 'bg-green-100 text-green-800'
              : 'bg-neutral-100 text-neutral-800'
          }`}>
            {isGlobalTimerRunning ? 'Activo' : 'Completado'}
          </span>
        </div>
        <div className="mt-1">
          <span className="text-lg font-mono text-neutral-900">{durationText}</span>
        </div>
        {globalStartTime && (
          <div className="mt-1 text-xs text-neutral-500">
            Iniciado: {new Date(globalStartTime).toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  }

  // Variante progress-bar - con barra de progreso visual
  if (variant === 'progress-bar') {
    // Calcular progreso basado en tiempo estimado (ej: 30 minutos)
    const estimatedDuration = 30 * 60 * 1000; // 30 minutos en ms
    const progress = currentDuration ? Math.min(100, (currentDuration / estimatedDuration) * 100) : 0;

    return (
      <div className={`bg-white border border-neutral-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">Progreso de tiempo</span>
          <span className="text-sm font-mono text-neutral-600">{durationText}</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-neutral-500">
          {isGlobalTimerRunning ? 'Sesión en progreso...' : 'Sesión completada'}
        </div>
      </div>
    );
  }

  return null;
};
