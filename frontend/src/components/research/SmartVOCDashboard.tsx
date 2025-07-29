'use client';

import { memo, useState } from 'react';

interface SmartVOCDashboardProps {
  className?: string;
}

interface KPICard {
  id: string;
  title: string;
  value: number;
  change: number;
  trend: number[];
}

interface MetricSection {
  id: string;
  title: string;
  description: string;
  score: number;
  positiveLabel: string;
  positiveValue: number;
  negativeLabel: string;
  negativeValue: number;
  attributes: {
    name: string;
    value: number;
    target: number;
  }[];
}

export function SmartVOCDashboard({ className }: SmartVOCDashboardProps) {
  const [timeFilter, setTimeFilter] = useState<'Semana' | 'Mes' | 'Trimestre' | 'Año'>('Mes');

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-neutral-200 p-6 ${className || ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">SmartVOC Dashboard</h3>
      </div>

      <div className="text-center text-neutral-500 text-sm py-8">
        No hay datos de SmartVOC disponibles
      </div>
    </div>
  );
}

export default memo(SmartVOCDashboard);
