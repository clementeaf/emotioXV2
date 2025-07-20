'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

import { useCPVData } from '@/hooks/useCPVData';
import { useSmartVOCResponses } from '@/hooks/useSmartVOCResponses';
import { useTrustFlowData } from '@/hooks/useTrustFlowData';
import { CPVCard } from './CPVCard';
import { Filters } from './Filters';
import { NPSQuestion } from './NPSQuestion';
import { TrustRelationshipFlow } from './TrustRelationshipFlow';
import { SmartVOCResultsProps } from './types';
import { VOCQuestion } from './VOCQuestion';

export function SmartVOCResults({ researchId, className }: SmartVOCResultsProps) {
  const [timeRange, setTimeRange] = useState<'Today' | 'Week' | 'Month'>('Today');

  // Hooks individuales con resiliencia
  const {
    data: cpvData,
    isLoading: cpvLoading,
    error: cpvError,
    defaultData: cpvDefault
  } = useCPVData(researchId);

  const {
    data: trustFlowData,
    isLoading: trustFlowLoading,
    error: trustFlowError,
    defaultData: trustFlowDefault
  } = useTrustFlowData(researchId);

  // Hook para datos generales SmartVOC (para NPS y VOC)
  const {
    data: smartVOCData,
    isLoading: smartVOCLoading,
    error: smartVOCError
  } = useSmartVOCResponses(researchId);

  // Preparar datos para CPVCard
  const cpvTrendData = trustFlowData.length > 0 ? trustFlowData.map(item => ({
    date: item.stage,
    value: (item.nps + item.nev) / 2 // Promedio de NPS y NEV
  })) : [];

  // Usar datos reales o valores por defecto
  const finalCPVData = cpvData || cpvDefault;
  const finalTrustFlowData = trustFlowData.length > 0 ? trustFlowData : trustFlowDefault;

  // Determinar si hay datos reales
  const hasCPVData = cpvData !== null && !cpvError;
  const hasTrustFlowData = trustFlowData.length > 0 && !trustFlowError;

  // Debug logs
  console.log('[SmartVOCResults] 📊 CPV Data:', cpvData ? '✅' : '❌', '| Loading:', cpvLoading, '| Error:', cpvError ? '❌' : '✅');
  console.log('[SmartVOCResults] 📊 Trust Flow Data:', trustFlowData.length > 0 ? '✅' : '❌', '| Loading:', trustFlowLoading, '| Error:', trustFlowError ? '❌' : '✅');
  console.log('[SmartVOCResults] 🔍 Trust Flow Data Details:', {
    dataLength: trustFlowData.length,
    data: trustFlowData,
    hasData: hasTrustFlowData,
    finalData: finalTrustFlowData
  });

  return (
    <div className={cn('flex gap-8 p-8', className)}>
      <div className="flex-1 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* CPVCard con manejo de errores individual */}
          <div className="md:col-span-1">
            {cpvError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error en CPVCard</h3>
                    <p className="text-sm text-red-700 mt-1">{cpvError}</p>
                  </div>
                </div>
              </div>
            ) : (
              <CPVCard
                value={finalCPVData.cpvValue}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                trendData={cpvTrendData}
                satisfaction={finalCPVData.satisfaction}
                retention={finalCPVData.retention}
                impact={finalCPVData.impact}
                trend={finalCPVData.trend}
                hasData={hasCPVData}
              />
            )}
          </div>

          {/* TrustRelationshipFlow con manejo de errores individual */}
          <div className="md:col-span-2">
            {trustFlowError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error en Trust Flow</h3>
                    <p className="text-sm text-red-700 mt-1">{trustFlowError}</p>
                  </div>
                </div>
              </div>
            ) : (
              <TrustRelationshipFlow
                data={finalTrustFlowData}
                hasData={hasTrustFlowData}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Los MetricCards se renderizarán cuando haya datos reales */}
        </div>

        {/* NPS Question con datos reales */}
        <NPSQuestion monthlyData={smartVOCData?.monthlyNPSData || []} />

        {/* VOC Question con datos reales */}
        <VOCQuestion comments={smartVOCData?.vocResponses?.map(comment => ({
          text: comment.text,
          mood: 'Positive', // Placeholder - se puede mejorar con análisis de sentimientos
          selected: false
        })) || []} />
      </div>

      <Filters className="w-80 shrink-0" />
    </div>
  );
}
