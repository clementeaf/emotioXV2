'use client';

import { ArrowUpRight, Info } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

import { CPVChartData } from './types';


// Componente Tooltip personalizado
interface UITooltipProps {
  content: ReactNode;
  children: ReactNode;
}

const UITooltip = ({ content, children }: UITooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 p-2 text-sm bg-white text-gray-800 rounded-md shadow-lg w-64 top-6 right-0">
          {content}
          <div className="absolute -top-1 right-2 w-2 h-2 rotate-45 bg-white"></div>
        </div>
      )}
    </div>
  );
};

interface CPVCardProps {
  value: number;
  timeRange: 'Today' | 'Week' | 'Month';
  onTimeRangeChange: (range: 'Today' | 'Week' | 'Month') => void;
  trendData: CPVChartData[];
  className?: string;
  satisfaction?: number;
  retention?: number;
  impact?: string;
  trend?: string;
  hasData?: boolean; // Nueva prop para indicar si hay datos reales
}

const TimeRangeSelector = ({ timeRange, onChange }: {
  timeRange: 'Today' | 'Week' | 'Month';
  onChange: (range: 'Today' | 'Week' | 'Month') => void;
}) => {
  return (
    <div className="flex items-center bg-white/10 rounded-lg p-1">
      {(['Today', 'Week', 'Month'] as const).map((range) => (
        <button
          key={range}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded transition-all',
            timeRange === range
              ? 'bg-white text-blue-600'
              : 'text-white/80 hover:bg-white/5'
          )}
          onClick={() => onChange(range)}
        >
          {range === 'Today' ? 'Hoy' : range === 'Week' ? 'Semana' : 'Mes'}
        </button>
      ))}
    </div>
  );
};

export const CPVCard = ({
  value,
  timeRange,
  onTimeRangeChange,
  trendData,
  className,
  satisfaction = 8.4,
  retention = 92,
  impact = 'Alto',
  trend = 'Positiva',
  hasData = true // Default to true if not provided
}: CPVCardProps) => {
  const percentChange = 2.5; // Valor de ejemplo para el cambio porcentual

  // Debug logs para verificar datos
  console.log('[CPVCard] 🔍 Props recibidas:', {
    value,
    trendDataLength: trendData.length,
    trendData: trendData,
    hasData: hasData
  });

  // Si no hay datos, mostrar mensaje informativo
  if (!hasData) {
    return (
      <Card className={cn('relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white h-96', className)}>
        <div className="absolute top-4 right-4 z-20">
          <TimeRangeSelector
            timeRange={timeRange}
            onChange={onTimeRangeChange}
          />
        </div>

        <div className="relative z-10 p-6 pt-16">
          <div className="w-full mb-6">
            <div className="flex items-center gap-5">
              <h3 className="text-lg font-medium leading-tight">Valor percibido por el cliente</h3>
              <UITooltip content="Medida que indica cuánto valor perciben los clientes en relación al precio pagado">
                <Info className="w-4 h-4 mt-1 text-white/60 hover:text-white cursor-help transition-colors" />
              </UITooltip>
            </div>
          </div>

          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-white mb-2">Aún no hay datos</h4>
              <p className="text-sm text-white/70 max-w-xs">
                Los datos de valor percibido por el cliente aparecerán aquí cuando los participantes completen las encuestas SmartVOC.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white h-96', className)}>
      <div className="absolute top-4 right-4 z-20">
        <TimeRangeSelector
          timeRange={timeRange}
          onChange={onTimeRangeChange}
        />
      </div>

      <div className="relative z-10 p-6 pt-16">
        <div className="w-full mb-6">
          <div className="flex items-center gap-5">
            <h3 className="text-lg font-medium leading-tight">Valor percibido por el cliente</h3>
            <UITooltip content="Medida que indica cuánto valor perciben los clientes en relación al precio pagado">
              <Info className="w-4 h-4 mt-1 text-white/60 hover:text-white cursor-help transition-colors" />
            </UITooltip>
          </div>
        </div>

        <div className="mt-4 mb-12 grid grid-cols-12 gap-2">
          <div className="col-span-7">
            <div className="flex items-baseline">
              <span className="text-3xl font-bold tracking-tight">{value}%</span>
              <div className={cn(
                'flex items-center px-1.5 py-0.5 rounded ml-2 self-start mt-2',
                percentChange >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              )}>
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                <span className="text-xs font-medium">+{percentChange}%</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-white/70">vs. periodo anterior</p>
          </div>

          <div className="col-span-5 bg-white/20 rounded-lg p-2 z-999">
            <div className="grid grid-rows-4 gap-1">
              <div>
                <p className="text-xs text-white/70">Satisfacción</p>
                <p className="text-sm font-medium">{satisfaction}/10</p>
              </div>
              <div>
                <p className="text-xs text-white/70">Retención</p>
                <p className="text-sm font-medium">{retention}%</p>
              </div>
              <div>
                <p className="text-xs text-white/70">Impacto</p>
                <p className="text-sm font-medium">{impact}</p>
              </div>
              <div>
                <p className="text-xs text-white/70">Tendencia</p>
                <p className="text-sm font-medium">{trend}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-[-15px] left-[-25px] right-0 h-48 -ml-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trendData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="cpvGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              {/* Mantenemos CartesianGrid para las líneas de fondo pero muy sutiles */}
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              {/* Ocultamos los valores del eje X pero mantenemos el eje para la estructura */}
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={false}
                padding={{ left: 0, right: 0 }}
              />
              {/* Ocultamos los valores del eje Y pero mantenemos números invisibles para la estructura */}
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={false}
                domain={[0, 100]}
                ticks={[25, 45, 65, 85]}
                padding={{ top: 10, bottom: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: '#6B7280', fontWeight: 500, marginBottom: '4px' }}
                itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
                formatter={(value: number) => [`${value}%`, 'CPV']}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#cpvGradient)"
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
                dot={false}
                activeDot={{ r: 6, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
