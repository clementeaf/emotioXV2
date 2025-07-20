'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

import { useSmartVOCResponses } from '@/hooks/useSmartVOCResponses';
import { CPVCard } from './CPVCard';
import { Filters } from './Filters';
import { NPSQuestion } from './NPSQuestion';
import { TrustRelationshipFlow } from './TrustRelationshipFlow';
import { SmartVOCResultsProps } from './types';
import { VOCQuestion } from './VOCQuestion';

export function SmartVOCResults({ researchId, className }: SmartVOCResultsProps) {
  const [timeRange, setTimeRange] = useState<'Today' | 'Week' | 'Month'>('Today');
  const { responses, metrics, isLoading, error } = useSmartVOCResponses(researchId);

  // Debug logs
  console.log('[SmartVOCResults] 📊 Responses:', responses.length, '| Metrics:', metrics ? '✅' : '❌', '| Loading:', isLoading, '| Error:', error ? '❌' : '✅');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultados SmartVOC...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar resultados</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No hay datos SmartVOC</h3>
            <p className="text-sm text-yellow-700 mt-1">
              No se encontraron respuestas SmartVOC para esta investigación.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Preparar datos para CPVCard
  const cpvValue = metrics?.averageScore || 0;
  const cpvTrendData = metrics?.timeSeriesData.map(item => ({
    date: item.date,
    value: item.score
  })) || [];

  // Preparar datos para TrustRelationshipFlow
  const trustFlowData = metrics?.timeSeriesData.map(item => ({
    stage: item.date,
    value: item.score,
    nps: item.score,
    nev: item.score, // Usando score como NEV por ahora
    count: item.count
  })) || [];

  // Preparar datos para NPSQuestion
  const npsResponses = responses.filter(r =>
    r.questionKey.toLowerCase().includes('nps') ||
    r.questionKey.toLowerCase().includes('promoter')
  );

  const monthlyNPSData = metrics?.timeSeriesData.map(item => ({
    month: new Date(item.date).toLocaleDateString('es-ES', { month: 'short' }),
    promoters: Math.round((metrics.promoters / metrics.totalResponses) * item.count),
    neutrals: Math.round((metrics.neutrals / metrics.totalResponses) * item.count),
    detractors: Math.round((metrics.detractors / metrics.totalResponses) * item.count),
    npsRatio: Math.round(metrics.npsScore)
  })) || [];

  // Preparar datos para VOCQuestion
  const vocResponses = responses.filter(r =>
    r.questionKey.toLowerCase().includes('voc') ||
    r.questionKey.toLowerCase().includes('voice')
  );

  const vocComments = vocResponses.map(response => ({
    text: typeof response.response === 'string' ? response.response : JSON.stringify(response.response),
    mood: 'Positive' // Placeholder
  }));

  return (
    <div className={cn('flex gap-8 p-8', className)}>
      <div className="flex-1 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CPVCard
            value={cpvValue}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            trendData={cpvTrendData}
            className="md:col-span-1"
          />

          <TrustRelationshipFlow
            data={trustFlowData}
            className="md:col-span-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Los MetricCards se renderizarán cuando haya datos reales */}
        </div>

        {/* NPS Question */}
        <NPSQuestion monthlyData={monthlyNPSData} />

        {/* VOC Question */}
        <VOCQuestion comments={vocComments} />
      </div>

      <Filters className="w-80 shrink-0" />
    </div>
  );
}
