import React from 'react';

interface ReentryInfoProps {
  reentryCount: number;
  sessionStartTime: number;
  lastVisitTime: number;
  totalSessionTime: number;
  isFirstVisit: boolean;
  className?: string;
}

export const ReentryInfo: React.FC<ReentryInfoProps> = ({
  reentryCount,
  sessionStartTime,
  lastVisitTime,
  totalSessionTime,
  isFirstVisit,
  className = ''
}) => {
  // Solo mostrar en modo desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-700">Debug: Información de Reingresos</h4>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          isFirstVisit
            ? 'bg-green-100 text-green-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {isFirstVisit ? 'Primera visita' : `Reingreso #${reentryCount}`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-gray-600">
        <div>
          <span className="font-medium">Inicio de sesión:</span>
          <br />
          <span className="text-xs">{formatTime(sessionStartTime)}</span>
        </div>

        <div>
          <span className="font-medium">Última visita:</span>
          <br />
          <span className="text-xs">{formatTime(lastVisitTime)}</span>
        </div>

        <div className="col-span-2">
          <span className="font-medium">Tiempo total de sesión:</span>
          <br />
          <span className="text-xs">{formatDuration(totalSessionTime)}</span>
        </div>
      </div>
    </div>
  );
};
