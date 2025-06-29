import React from 'react';

interface TimingInfoProps {
  isGlobalTimerRunning: boolean;
  globalStartTime: number | null;
  globalEndTime: number | null;
  activeSectionTimers: Set<string>;
  sectionTimings: Array<{
    sectionId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
  }>;
  className?: string;
}

export const TimingInfo: React.FC<TimingInfoProps> = ({
  isGlobalTimerRunning,
  globalStartTime,
  globalEndTime,
  activeSectionTimers,
  sectionTimings,
  className = ''
}) => {
  // Solo mostrar en modo desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const formatTime = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) {
      return 'Inválido';
    }
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch (error) {
      console.error('[TimingInfo] Error formateando timestamp:', error);
      return 'Error';
    }
  };

  const formatDuration = (ms: number) => {
    if (!ms || isNaN(ms) || ms < 0) {
      return '0s';
    }

    try {
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
    } catch (error) {
      console.error('[TimingInfo] Error formateando duración:', error);
      return 'Error';
    }
  };

  const getCurrentGlobalDuration = () => {
    try {
      if (globalStartTime && globalEndTime) {
        const duration = globalEndTime - globalStartTime;
        return duration >= 0 ? duration : null;
      }
      if (globalStartTime && isGlobalTimerRunning) {
        const duration = Date.now() - globalStartTime;
        return duration >= 0 ? duration : null;
      }
      return null;
    } catch (error) {
      console.error('[TimingInfo] Error calculando duración global:', error);
      return null;
    }
  };

  const currentDuration = getCurrentGlobalDuration();

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-700">Debug: Información de Timing</h4>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          isGlobalTimerRunning
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {isGlobalTimerRunning ? 'Timer Activo' : 'Timer Detenido'}
        </span>
      </div>

      <div className="space-y-2">
        {/* Timer Global */}
        <div className="border-b border-gray-200 pb-2">
          <h5 className="font-medium text-gray-600 mb-1">Timer Global</h5>
          <div className="grid grid-cols-2 gap-2 text-gray-600">
            <div>
              <span className="font-medium">Inicio:</span>
              <br />
              <span className="text-xs">
                {globalStartTime ? formatTime(globalStartTime) : 'No iniciado'}
              </span>
            </div>

            <div>
              <span className="font-medium">Fin:</span>
              <br />
              <span className="text-xs">
                {globalEndTime ? formatTime(globalEndTime) : 'En progreso'}
              </span>
            </div>

            <div className="col-span-2">
              <span className="font-medium">Duración:</span>
              <br />
              <span className="text-xs font-mono">
                {currentDuration ? formatDuration(currentDuration) : '0s'}
              </span>
            </div>
          </div>
        </div>

        {/* Timers de Sección */}
        {sectionTimings.length > 0 && (
          <div>
            <h5 className="font-medium text-gray-600 mb-1">
              Timers de Sección ({sectionTimings.length})
            </h5>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {sectionTimings.map((section) => {
                const isActive = activeSectionTimers.has(section.sectionId);
                let currentSectionDuration: number | null = null;

                try {
                  if (isActive && section.startTime) {
                    const duration = Date.now() - section.startTime;
                    currentSectionDuration = duration >= 0 ? duration : null;
                  } else if (section.duration) {
                    currentSectionDuration = section.duration >= 0 ? section.duration : null;
                  }
                } catch (error) {
                  console.error('[TimingInfo] Error calculando duración de sección:', error);
                  currentSectionDuration = null;
                }

                return (
                  <div key={section.sectionId} className="flex items-center justify-between p-1 bg-white rounded border">
                    <div className="flex-1">
                      <span className="font-medium text-xs">{section.sectionId}</span>
                      <div className="text-xs text-gray-500">
                        {formatTime(section.startTime)}
                        {section.endTime && ` → ${formatTime(section.endTime)}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isActive ? 'Activo' : 'Completado'}
                      </span>
                      <div className="text-xs font-mono text-gray-600">
                        {currentSectionDuration ? formatDuration(currentSectionDuration) : '0s'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Secciones Activas */}
        {activeSectionTimers.size > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <h5 className="font-medium text-gray-600 mb-1">
              Secciones Activas ({activeSectionTimers.size})
            </h5>
            <div className="flex flex-wrap gap-1">
              {Array.from(activeSectionTimers).map((sectionId) => (
                <span
                  key={sectionId}
                  className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                >
                  {sectionId}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
