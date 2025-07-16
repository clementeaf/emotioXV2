'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

import { CPVCard } from './CPVCard';
import { Filters } from './Filters';
import { NPSQuestion } from './NPSQuestion';
import { TrustRelationshipFlow } from './TrustRelationshipFlow';
import { SmartVOCResultsProps } from './types';
import { VOCQuestion } from './VOCQuestion';

export function SmartVOCResults({ className }: SmartVOCResultsProps) {
  const [timeRange, setTimeRange] = useState<'Today' | 'Week' | 'Month'>('Today');

  // Estado para indicar que no hay datos disponibles
  const hasData = false; // Cambiar a true cuando se conecte con datos reales

  if (!hasData) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-4">
            📊 No hay datos disponibles para mostrar
          </div>
          <p className="text-gray-400 text-sm">
            Los resultados de SmartVOC aparecerán aquí cuando se complete la investigación
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-8 p-8', className)}>
      <div className="flex-1 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CPVCard
            value={0}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            trendData={[]}
            className="md:col-span-1"
          />

          <TrustRelationshipFlow
            data={[]}
            className="md:col-span-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Los MetricCards se renderizarán cuando haya datos reales */}
        </div>

        {/* NPS Question */}
        <NPSQuestion monthlyData={[]} />

        {/* VOC Question */}
        <VOCQuestion comments={[]} />
      </div>

      <Filters className="w-80 shrink-0" />
    </div>
  );
}
