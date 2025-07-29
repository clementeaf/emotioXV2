'use client';

import { memo, useState } from 'react';

interface SmartVOCNPSAnalysisProps {
  className?: string;
}

interface MonthlyData {
  month: string;
  shortMonth: string;
  npsRatio: number;
  promoters: number;
  neutrals: number;
  detractors: number;
}

interface LoyaltyEvolution {
  changePercentage: number;
  promotersPercentage: number;
  promotersTrend: 'up' | 'down';
  detractorsPercentage: number;
  detractorsTrend: 'up' | 'down';
  neutralsPercentage: number;
  neutralsTrend: 'up' | 'down';
}

export function SmartVOCNPSAnalysis({ className }: SmartVOCNPSAnalysisProps) {
  const [timeFilter, setTimeFilter] = useState('Year');

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-neutral-200 p-6 ${className || ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">Análisis NPS</h3>
      </div>

      <div className="text-center text-neutral-500 text-sm py-8">
        No hay datos de análisis NPS disponibles
      </div>
    </div>
  );
}

export default memo(SmartVOCNPSAnalysis);
