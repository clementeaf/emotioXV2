'use client';

import { memo } from 'react';

interface SmartVOCEmotionalAnalysisProps {
  className?: string;
}

interface EmotionValue {
  name: string;
  percentage: number;
  count: number;
  isPositive: boolean;
  color: string;
}

interface ClusterData {
  name: string;
  value: number;
  direction: 'up' | 'down';
}

export function SmartVOCEmotionalAnalysis({ className }: SmartVOCEmotionalAnalysisProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-neutral-200 p-6 ${className || ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">Análisis Emocional</h3>
      </div>

      <div className="text-center text-neutral-500 text-sm py-8">
        No hay datos de análisis emocional disponibles
      </div>
    </div>
  );
}

export default memo(SmartVOCEmotionalAnalysis);
