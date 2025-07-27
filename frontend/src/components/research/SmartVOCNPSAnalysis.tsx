'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SmartVOCNPSAnalysisProps {
  className?: string;
}

// Datos para la evolución mensual del NPS
interface MonthlyData {
  month: string;
  shortMonth: string;
  npsRatio: number;
  promoters: number;
  neutrals: number;
  detractors: number;
}

// Datos para la evolución de lealtad
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
  // Datos simulados
  const [npsScore] = useState(0);
  const [responses] = useState(0);
  const [promotersPercentage] = useState(0);
  const [detractorsPercentage] = useState(0);
  const [timeFilter, setTimeFilter] = useState('Year');

  // Datos simulados para la evolución mensual del NPS
  const [monthlyData] = useState<MonthlyData[]>([
    { month: 'January', shortMonth: 'Jan', npsRatio: 10, promoters: 35, neutrals: 30, detractors: 35 },
    { month: 'February', shortMonth: 'Feb', npsRatio: 25, promoters: 45, neutrals: 35, detractors: 20 },
    { month: 'March', shortMonth: 'Mar', npsRatio: 40, promoters: 55, neutrals: 30, detractors: 15 },
    { month: 'April', shortMonth: 'Apr', npsRatio: 45, promoters: 60, neutrals: 25, detractors: 15 },
    { month: 'May', shortMonth: 'May', npsRatio: 35, promoters: 50, neutrals: 35, detractors: 15 },
    { month: 'June', shortMonth: 'Jun', npsRatio: 30, promoters: 45, neutrals: 40, detractors: 15 },
    { month: 'July', shortMonth: 'Jul', npsRatio: 60, promoters: 70, neutrals: 20, detractors: 10 },
    { month: 'August', shortMonth: 'Ago', npsRatio: 70, promoters: 75, neutrals: 20, detractors: 5 },
    { month: 'September', shortMonth: 'Sep', npsRatio: 55, promoters: 65, neutrals: 25, detractors: 10 },
    { month: 'October', shortMonth: 'Oct', npsRatio: 40, promoters: 55, neutrals: 30, detractors: 15 },
    { month: 'November', shortMonth: 'Nov', npsRatio: 20, promoters: 40, neutrals: 40, detractors: 20 },
    { month: 'December', shortMonth: 'Dec', npsRatio: 50, promoters: 65, neutrals: 20, detractors: 15 },
  ]);

  // Datos simulados para la evolución de lealtad
  const [loyaltyEvolution] = useState<LoyaltyEvolution>({
    changePercentage: 16,
    promotersPercentage: 35,
    promotersTrend: 'up',
    detractorsPercentage: 26,
    detractorsTrend: 'down',
    neutralsPercentage: 39,
    neutralsTrend: 'down'
  });

  // Obtener el valor máximo para el gráfico de línea
  const getMaxNPSRatio = () => {
    return Math.max(...monthlyData.map(d => d.npsRatio)) + 10;
  };

  // Obtener el valor máximo para el gráfico de barras
  const getMaxBarValue = () => {
    return 100; // Asumimos que los porcentajes suman 100%
  };

  // Generar puntos para la línea de tendencia NPS
  const generateNPSLine = () => {
    const maxRatio = getMaxNPSRatio();
    const width = 100 / (monthlyData.length - 1);

    return monthlyData.map((data, i) => {
      const x = i * width;
      const y = 100 - ((data.npsRatio / maxRatio) * 100);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className={cn('mt-6 mb-10', className)}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          2.5.- Pregunta: Net Promoter Score (NPS)
        </h2>

        <div className="flex items-center space-x-3 text-xs">
          <span className="px-2 py-1 bg-green-50 text-green-600 rounded">
            Linear Scale question
          </span>
          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">
            Conditionality disabled
          </span>
          <span className="px-2 py-1 bg-red-50 text-red-600 rounded">
            Required
          </span>
          <button className="text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="mb-6">
              <div className="flex justify-between mb-1">
                <span className="text-sm">Promotores</span>
                <span className="text-sm">{promotersPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${promotersPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between mb-1">
                <span className="text-sm">Detractores</span>
                <span className="text-sm">{detractorsPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${detractorsPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">
                  ?
                </div>
                <h3 className="font-medium">NPS' question</h3>
              </div>
              <p className="text-neutral-600 text-sm ml-8">
                En una escala del 0-10, ¿qué tan probable es que recomiendes [empresa]<br />
                a un amigo o colega?
              </p>
            </div>
          </div>

          <div className="w-40">
            <div className="mb-3">
              <div className="text-sm text-neutral-500">Respuestas</div>
              <div className="flex items-baseline">
                <div className="text-2xl font-semibold">{responses.toLocaleString()}</div>
                <div className="text-xs text-neutral-400 ml-1">26s</div>
              </div>
            </div>

            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="3"
                  strokeDasharray={`${npsScore}, 100`}
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold">
                {npsScore}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de tendencia NPS */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs">NPS Ratio</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-xs">Promotores</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <span className="text-xs">Neutrales</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-xs">Detractores</span>
            </div>
          </div>

          <div className="relative inline-block text-left">
            <Button variant="outline" size="sm" className="text-sm px-4">
              {timeFilter} <span className="ml-2">▼</span>
            </Button>
          </div>
        </div>

        <div className="h-80 relative mt-2">
          {/* Gráfico combinado: barras + línea */}
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Área bajo la línea NPS */}
            <defs>
              <linearGradient id="npsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(79, 70, 229, 0.2)" />
                <stop offset="100%" stopColor="rgba(79, 70, 229, 0)" />
              </linearGradient>
            </defs>

            <polygon
              points={`0,100 ${generateNPSLine()} 100,100`}
              fill="url(#npsGradient)"
            />

            {/* Línea de tendencia NPS */}
            <polyline
              points={generateNPSLine()}
              fill="none"
              stroke="#4F46E5"
              strokeWidth="0.5"
            />

            {/* Puntos en la línea */}
            {monthlyData.map((data, i) => {
              const x = i * (100 / (monthlyData.length - 1));
              const y = 100 - ((data.npsRatio / getMaxNPSRatio()) * 100);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="0.8"
                  fill="#4F46E5"
                  stroke="#FFFFFF"
                  strokeWidth="0.2"
                />
              );
            })}
          </svg>

          {/* Barras para cada mes */}
          <div className="absolute inset-0 flex justify-between items-end">
            {monthlyData.map((data, i) => (
              <div key={i} className="flex flex-col items-center justify-end h-full" style={{ width: `${100 / monthlyData.length}%` }}>
                {/* Barras apiladas */}
                <div className="w-4 mb-6 relative" style={{ height: '70%' }}>
                  {/* Promotores */}
                  <div
                    className="absolute bottom-0 left-0 w-full bg-green-400 rounded-t"
                    style={{ height: `${(data.promoters / getMaxBarValue()) * 100}%` }}
                  ></div>

                  {/* Neutrales */}
                  <div
                    className="absolute bottom-0 left-0 w-full bg-gray-300"
                    style={{
                      height: `${(data.neutrals / getMaxBarValue()) * 100}%`,
                      bottom: `${(data.promoters / getMaxBarValue()) * 100}%`
                    }}
                  ></div>

                  {/* Detractores */}
                  <div
                    className="absolute bottom-0 left-0 w-full bg-red-400 rounded-t"
                    style={{
                      height: `${(data.detractors / getMaxBarValue()) * 100}%`,
                      bottom: `${((data.promoters + data.neutrals) / getMaxBarValue()) * 100}%`
                    }}
                  ></div>
                </div>

                {/* Etiqueta del mes */}
                <div className="text-xs text-neutral-500 whitespace-nowrap">
                  {data.shortMonth}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evolución de lealtad */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-base font-medium text-neutral-700 mb-6">Evolución de la lealtad</h3>

        <div className="flex items-center mb-8">
          <span className={cn(
            'text-lg font-semibold',
            loyaltyEvolution.changePercentage > 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {loyaltyEvolution.changePercentage > 0 ? '+' : ''}{loyaltyEvolution.changePercentage}%
          </span>
          <span className="text-neutral-500 ml-2">Desde el mes pasado</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-1">
              <span className="text-neutral-600 text-sm">Promotores</span>
              <div className={cn(
                'flex items-center',
                loyaltyEvolution.promotersTrend === 'up' ? 'text-green-600' : 'text-red-600'
              )}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {loyaltyEvolution.promotersTrend === 'up' ? (
                    <polyline points="18 15 12 9 6 15"></polyline>
                  ) : (
                    <polyline points="6 9 12 15 18 9"></polyline>
                  )}
                </svg>
              </div>
            </div>
            <div className="text-2xl font-semibold">
              {loyaltyEvolution.promotersPercentage}%
            </div>
          </div>

          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-1">
              <span className="text-neutral-600 text-sm">Detractores</span>
              <div className={cn(
                'flex items-center',
                loyaltyEvolution.detractorsTrend === 'down' ? 'text-green-600' : 'text-red-600'
              )}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {loyaltyEvolution.detractorsTrend === 'down' ? (
                    <polyline points="6 9 12 15 18 9"></polyline>
                  ) : (
                    <polyline points="18 15 12 9 6 15"></polyline>
                  )}
                </svg>
              </div>
            </div>
            <div className="text-2xl font-semibold">
              {loyaltyEvolution.detractorsPercentage}%
            </div>
          </div>

          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-1">
              <span className="text-neutral-600 text-sm">Neutrales</span>
              <div className={cn(
                'flex items-center',
                loyaltyEvolution.neutralsTrend === 'down' ? 'text-green-600' : 'text-red-600'
              )}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {loyaltyEvolution.neutralsTrend === 'down' ? (
                    <polyline points="6 9 12 15 18 9"></polyline>
                  ) : (
                    <polyline points="18 15 12 9 6 15"></polyline>
                  )}
                </svg>
              </div>
            </div>
            <div className="text-2xl font-semibold">
              {loyaltyEvolution.neutralsPercentage}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
