'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SmartVOCTrendAnalysisProps {
  className?: string;
}

interface MetricData {
  id: string;
  name: string;
  current: number;
  previous: number;
  change: number;
  isPositive: boolean;
}

interface TrendPoint {
  date: string;
  value: number;
}

interface TrendSeries {
  id: string;
  name: string;
  color: string;
  data: TrendPoint[];
}

export function SmartVOCTrendAnalysis({ className }: SmartVOCTrendAnalysisProps) {
  const [activeView, setActiveView] = useState<'day' | 'week' | 'month' | 'quarter'>('month');
  const [comparisonPeriod, setComparisonPeriod] = useState<'previous' | 'year'>('previous');
  
  // Datos simulados para métricas clave
  const [metrics] = useState<MetricData[]>([
    { id: 'csat', name: 'CSAT Score', current: 7.8, previous: 7.2, change: 8.3, isPositive: true },
    { id: 'ces', name: 'CES Score', current: 6.5, previous: 6.9, change: -5.8, isPositive: false },
    { id: 'nps', name: 'NPS Score', current: 42, previous: 35, change: 20, isPositive: true },
    { id: 'completion', name: 'Completion Rate', current: 87, previous: 82, change: 6.1, isPositive: true }
  ]);
  
  // Datos simulados para la serie temporal
  const [trendData] = useState<TrendSeries[]>([
    {
      id: 'csat',
      name: 'CSAT Score',
      color: '#3B82F6',
      data: [
        { date: '2023-01', value: 7.2 },
        { date: '2023-02', value: 7.1 },
        { date: '2023-03', value: 7.3 },
        { date: '2023-04', value: 7.4 },
        { date: '2023-05', value: 7.3 },
        { date: '2023-06', value: 7.6 },
        { date: '2023-07', value: 7.5 },
        { date: '2023-08', value: 7.7 },
        { date: '2023-09', value: 7.6 },
        { date: '2023-10', value: 7.8 },
        { date: '2023-11', value: 7.9 },
        { date: '2023-12', value: 7.8 }
      ]
    },
    {
      id: 'ces',
      name: 'CES Score',
      color: '#10B981',
      data: [
        { date: '2023-01', value: 6.9 },
        { date: '2023-02', value: 6.8 },
        { date: '2023-03', value: 6.7 },
        { date: '2023-04', value: 6.8 },
        { date: '2023-05', value: 6.7 },
        { date: '2023-06', value: 6.5 },
        { date: '2023-07', value: 6.6 },
        { date: '2023-08', value: 6.4 },
        { date: '2023-09', value: 6.5 },
        { date: '2023-10', value: 6.4 },
        { date: '2023-11', value: 6.3 },
        { date: '2023-12', value: 6.5 }
      ]
    },
    {
      id: 'nps',
      name: 'NPS Score',
      color: '#EC4899',
      data: [
        { date: '2023-01', value: 35 },
        { date: '2023-02', value: 34 },
        { date: '2023-03', value: 36 },
        { date: '2023-04', value: 37 },
        { date: '2023-05', value: 38 },
        { date: '2023-06', value: 39 },
        { date: '2023-07', value: 38 },
        { date: '2023-08', value: 40 },
        { date: '2023-09', value: 41 },
        { date: '2023-10', value: 42 },
        { date: '2023-11', value: 41 },
        { date: '2023-12', value: 42 }
      ]
    }
  ]);
  
  // Función para obtener el año y mes abreviado de una fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es', { month: 'short' }).format(date);
  };
  
  // Calcular min y max para los ejes y
  const calculateYAxisRange = (series: TrendSeries) => {
    const values = series.data.map(d => d.value);
    const min = Math.min(...values) * 0.9;
    const max = Math.max(...values) * 1.1;
    return { min, max };
  };

  // Renderizar el gráfico de línea
  const renderLineChart = (series: TrendSeries) => {
    const { min, max } = calculateYAxisRange(series);
    const range = max - min;
    const chartHeight = 150;
    const chartWidth = 600;
    const dataPoints = series.data.length;
    
    // Calcular puntos para la línea SVG
    const points = series.data.map((point, index) => {
      const x = (index / (dataPoints - 1)) * chartWidth;
      const y = chartHeight - ((point.value - min) / range) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    const gradient = `gradient-${series.id}`;
    
    return (
      <div key={series.id} className="mb-8 bg-white rounded-lg border border-neutral-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-medium text-neutral-900">{series.name} Trend</h3>
          <div className="flex items-center text-sm">
            <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: series.color }}></span>
            Current: {series.data[series.data.length - 1].value}
          </div>
        </div>
        
        <div className="relative h-40">
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            {/* Definir gradiente para el área bajo la curva */}
            <defs>
              <linearGradient id={gradient} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={series.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={series.color} stopOpacity="0.05" />
              </linearGradient>
            </defs>
            
            {/* Líneas de cuadrícula horizontales */}
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line 
                key={ratio}
                x1="0" 
                y1={chartHeight * ratio} 
                x2={chartWidth} 
                y2={chartHeight * ratio} 
                stroke="#E5E7EB" 
                strokeDasharray="4 4" 
              />
            ))}
            
            {/* Área bajo la curva */}
            <path 
              d={`M0,${chartHeight} L${points} L${chartWidth},${chartHeight} Z`} 
              fill={`url(#${gradient})`} 
            />
            
            {/* Línea de la serie */}
            <polyline
              fill="none"
              stroke={series.color}
              strokeWidth="2"
              points={points}
            />
            
            {/* Puntos de datos */}
            {series.data.map((point, index) => {
              const x = (index / (dataPoints - 1)) * chartWidth;
              const y = chartHeight - ((point.value - min) / range) * chartHeight;
              return (
                <circle 
                  key={index} 
                  cx={x} 
                  cy={y} 
                  r="3" 
                  fill="white" 
                  stroke={series.color} 
                  strokeWidth="2" 
                />
              );
            })}
          </svg>
          
          {/* Etiquetas del eje X */}
          <div className="flex justify-between text-xs text-neutral-500 mt-2">
            {series.data.filter((_, i) => i % 2 === 0 || i === series.data.length - 1).map((point, i) => (
              <div key={i}>{formatDate(point.date)}</div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('mt-10', className)}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          Smart VOC Performance Trends
        </h2>
        
        <div className="flex">
          <div className="bg-neutral-50 rounded-lg p-1 flex space-x-1 mr-4">
            <button
              className={cn(
                'py-1 px-3 rounded-md text-xs font-medium transition-colors',
                activeView === 'day' 
                  ? 'bg-white shadow-sm text-neutral-900' 
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
              onClick={() => setActiveView('day')}
            >
              Día
            </button>
            <button
              className={cn(
                'py-1 px-3 rounded-md text-xs font-medium transition-colors',
                activeView === 'week' 
                  ? 'bg-white shadow-sm text-neutral-900' 
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
              onClick={() => setActiveView('week')}
            >
              Semana
            </button>
            <button
              className={cn(
                'py-1 px-3 rounded-md text-xs font-medium transition-colors',
                activeView === 'month' 
                  ? 'bg-white shadow-sm text-neutral-900' 
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
              onClick={() => setActiveView('month')}
            >
              Mes
            </button>
            <button
              className={cn(
                'py-1 px-3 rounded-md text-xs font-medium transition-colors',
                activeView === 'quarter' 
                  ? 'bg-white shadow-sm text-neutral-900' 
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
              onClick={() => setActiveView('quarter')}
            >
              Trimestre
            </button>
          </div>
          
          <div className="bg-neutral-50 rounded-lg p-1 flex space-x-1">
            <button
              className={cn(
                'py-1 px-3 rounded-md text-xs font-medium transition-colors',
                comparisonPeriod === 'previous' 
                  ? 'bg-white shadow-sm text-neutral-900' 
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
              onClick={() => setComparisonPeriod('previous')}
            >
              vs. Período anterior
            </button>
            <button
              className={cn(
                'py-1 px-3 rounded-md text-xs font-medium transition-colors',
                comparisonPeriod === 'year' 
                  ? 'bg-white shadow-sm text-neutral-900' 
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
              onClick={() => setComparisonPeriod('year')}
            >
              vs. Año anterior
            </button>
          </div>
        </div>
      </div>
      
      {/* Tarjetas de métricas clave */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <div key={metric.id} className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4">
            <h3 className="text-sm font-medium text-neutral-500 mb-2">{metric.name}</h3>
            <div className="flex items-end">
              <div className="text-2xl font-bold">{metric.current}</div>
              <div className={cn('ml-2 text-sm flex items-center', 
                metric.isPositive ? 'text-green-600' : 'text-red-600')}>
                <svg 
                  className="w-4 h-4 mr-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  {metric.isPositive ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  )}
                </svg>
                {metric.change}%
              </div>
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              vs {comparisonPeriod === 'previous' ? 'período anterior' : 'año anterior'}: {metric.previous}
            </div>
          </div>
        ))}
      </div>
      
      {/* Gráficos de tendencias */}
      <div>
        {trendData.map(series => renderLineChart(series))}
      </div>
      
      {/* Tabla de tendencias */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6 mt-8">
        <h3 className="text-base font-medium text-neutral-900 mb-4">Tendencias detalladas</h3>
        <div className="overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead>
              <tr>
                <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Fecha
                </th>
                {trendData.map(series => (
                  <th key={series.id} className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {series.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {trendData[0].data.slice().reverse().map((point, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-neutral-50' : 'bg-white'}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-900">
                    {point.date}
                  </td>
                  {trendData.map(series => (
                    <td key={series.id} className="px-3 py-2 whitespace-nowrap text-sm text-neutral-500">
                      {series.data.slice().reverse()[idx].value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" className="text-sm">
            Exportar datos
          </Button>
        </div>
      </div>
    </div>
  );
} 