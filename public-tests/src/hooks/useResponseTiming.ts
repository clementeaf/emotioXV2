import { useCallback, useRef, useState } from 'react';

interface TimingData {
  startTime: number;
  endTime?: number;
  duration?: number;
}

interface UseResponseTimingProps {
  questionKey: string;
  enabled?: boolean;
}

interface UseResponseTimingReturn {
  startTiming: () => void;
  endTiming: () => void;
  getTimingData: () => TimingData | null;
  isTracking: boolean;
}

export const useResponseTiming = ({
  questionKey,
  enabled = false
}: UseResponseTimingProps): UseResponseTimingReturn => {
  const [isTracking, setIsTracking] = useState(false);
  const timingRef = useRef<TimingData | null>(null);

  const startTiming = useCallback(() => {
    if (!enabled) return;

    timingRef.current = {
      startTime: Date.now()
    };
    setIsTracking(true);

    console.log(`[useResponseTiming] 🕐 Iniciando cronometraje para: ${questionKey}`);
  }, [enabled, questionKey]);

  const endTiming = useCallback(() => {
    if (!enabled || !timingRef.current) return;

    const endTime = Date.now();
    const duration = endTime - timingRef.current.startTime;

    timingRef.current = {
      ...timingRef.current,
      endTime,
      duration
    };

    setIsTracking(false);

    console.log(`[useResponseTiming] ✅ Cronometraje completado para ${questionKey}:`, {
      duration: `${duration}ms`,
      startTime: new Date(timingRef.current.startTime).toISOString(),
      endTime: new Date(endTime).toISOString()
    });
  }, [enabled, questionKey]);

  const getTimingData = useCallback(() => {
    return timingRef.current;
  }, []);

  return {
    startTiming,
    endTiming,
    getTimingData,
    isTracking
  };
};
