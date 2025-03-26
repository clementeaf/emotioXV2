'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

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
  percentage: number;
  direction: 'up' | 'down';
}

export function SmartVOCEmotionalAnalysis({ className }: SmartVOCEmotionalAnalysisProps) {
  // Datos simulados para el análisis emocional
  const [nevScore] = useState(56);
  const [responseCount] = useState(28635);
  const [positivePercentage] = useState(78);
  const [negativePercentage] = useState(22);
  const [positiveTotal] = useState(70.85);
  
  // Datos de emociones específicas
  const [emotions] = useState<EmotionValue[]>([
    { name: 'Felicidad', percentage: 9, count: 2577, isPositive: true, color: 'bg-green-500' },
    { name: 'Satisfacción', percentage: 9, count: 2577, isPositive: true, color: 'bg-green-400' },
    { name: 'Curiosidad', percentage: 4, count: 1145, isPositive: true, color: 'bg-blue-400' },
    { name: 'Optimismo', percentage: 4, count: 1145, isPositive: true, color: 'bg-teal-400' },
    { name: 'Seguridad', percentage: 9, count: 2577, isPositive: true, color: 'bg-emerald-500' },
    { name: 'Entusiasmo', percentage: 9, count: 2577, isPositive: true, color: 'bg-lime-500' },
    { name: 'Indulgencia', percentage: 3, count: 859, isPositive: false, color: 'bg-yellow-500' },
    { name: 'Resignación', percentage: 3, count: 859, isPositive: false, color: 'bg-amber-500' },
    { name: 'Exploración', percentage: 7, count: 2004, isPositive: true, color: 'bg-green-300' },
    { name: 'Inspiración', percentage: 7, count: 2004, isPositive: true, color: 'bg-teal-300' },
    { name: 'Interesado', percentage: 8, count: 2291, isPositive: true, color: 'bg-cyan-500' },
    { name: 'Energizado', percentage: 8, count: 2291, isPositive: true, color: 'bg-blue-500' },
    { name: 'Esperanza', percentage: 10, count: 2864, isPositive: true, color: 'bg-violet-500' },
    { name: 'Frustración', percentage: 10, count: 2864, isPositive: false, color: 'bg-red-500' },
    { name: 'Decepción', percentage: 3, count: 859, isPositive: false, color: 'bg-rose-500' },
    { name: 'Enfado', percentage: 3, count: 859, isPositive: false, color: 'bg-red-600' },
    { name: 'Hostilidad', percentage: 2, count: 573, isPositive: false, color: 'bg-red-700' },
    { name: 'Desalentado', percentage: 2, count: 573, isPositive: false, color: 'bg-pink-600' },
    { name: 'Aprensión', percentage: 7, count: 2004, isPositive: false, color: 'bg-pink-500' }
  ]);
  
  // Datos para clusters de valor
  const [longTermClusters] = useState<ClusterData[]>([
    { name: 'Advocacy', percentage: 70.5, direction: 'up' },
    { name: 'Recommendation', percentage: 50.5, direction: 'up' },
    { name: 'Attention', percentage: 23.5, direction: 'up' },
    { name: 'Destroying', percentage: 36.5, direction: 'down' }
  ]);
  
  const [shortTermClusters] = useState<ClusterData[]>([
    { name: 'Attention', percentage: 23.5, direction: 'up' },
    { name: 'Destroying', percentage: 36.5, direction: 'down' }
  ]);
  
  // Organizar emociones para el gráfico de barras
  const barChartEmotions = [...emotions].sort((a, b) => {
    // Primero agrupar por positivo/negativo
    if (a.isPositive && !b.isPositive) {return -1;}
    if (!a.isPositive && b.isPositive) {return 1;}
    
    // Luego ordenar por porcentaje
    return b.percentage - a.percentage;
  });
  
  const getMaxPercentage = () => {
    return Math.max(...emotions.map(e => e.percentage));
  };
  
  const maxPercentage = getMaxPercentage();
  
  return (
    <div className={cn('mt-6 mb-10', className)}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          2.4.- Pregunta: Net Emotional Value (NEV)
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
                <span className="text-sm">Emociones Positivas</span>
                <span className="text-sm">{positivePercentage}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full">
                <div 
                  className="h-full rounded-full bg-green-500" 
                  style={{ width: `${positivePercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between mb-1">
                <span className="text-sm">Emociones Negativas</span>
                <span className="text-sm">{negativePercentage}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full">
                <div 
                  className="h-full rounded-full bg-red-500" 
                  style={{ width: `${negativePercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">
                  ?
                </div>
                <h3 className="font-medium">NEV's question</h3>
              </div>
              <p className="text-neutral-600 text-sm ml-8">
                ¿Cómo te sientes acerca de la experiencia ofrecida por [empresa]?<br />
                Por favor selecciona hasta 3 opciones de estos 20 estados emocionales
              </p>
            </div>
          </div>
          
          <div className="w-40">
            <div className="mb-3">
              <div className="text-sm text-neutral-500">Respuestas</div>
              <div className="flex items-baseline">
                <div className="text-2xl font-semibold">28.635</div>
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
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeDasharray={`${nevScore}, 100`}
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold">
                {nevScore}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Distribución detallada de emociones */}
      <div className="flex gap-6 mb-6">
        {/* Gráfico de barras de emociones */}
        <div className="flex-1 bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-base font-medium text-neutral-700 mb-4">Estados emocionales</h3>
          <div className="text-xl font-semibold text-neutral-900 mb-6">{positiveTotal}% Positivo</div>
          
          <div className="relative h-[380px]">
            <div className="absolute inset-0">
              {/* Líneas de cuadrícula */}
              {[0, 5, 10].map((value) => (
                <div 
                  key={value} 
                  className="absolute w-full border-t border-dashed border-neutral-200 flex items-center justify-start"
                  style={{ top: `${100 - (value * 10)}%` }}
                >
                  <span className="text-xs text-neutral-400 -ml-6 w-5">{value}</span>
                </div>
              ))}
              
              {/* Barras de emociones */}
              <div className="absolute inset-0 pt-4 pb-6 flex items-end">
                <div className="w-full flex justify-between items-end">
                  {barChartEmotions.map((emotion, i) => (
                    <div key={i} className="flex flex-col items-center" style={{ width: `${100 / barChartEmotions.length}%` }}>
                      <div 
                        className={cn('w-5 rounded-t', emotion.color)} 
                        style={{ height: `${(emotion.percentage / maxPercentage) * 100}%`, maxHeight: '95%' }}
                      ></div>
                      <div className="text-xs text-neutral-500 mt-2 rotate-90 origin-top-left h-6 -ml-6 w-20 overflow-hidden text-ellipsis whitespace-nowrap">
                        {emotion.name}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1 absolute top-0">
                        {emotion.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Clusters de valor */}
        <div className="w-80 space-y-6">
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Clusters que impulsan valor a largo plazo</h3>
            
            <div className="space-y-4">
              {longTermClusters.map((cluster, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm">{cluster.name}</span>
                  <div className="flex items-center">
                    <span className={cn(
                      'text-sm font-medium',
                      cluster.direction === 'up' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {cluster.direction === 'up' && '+ '}
                      {cluster.direction === 'down' && '- '}
                      {cluster.percentage}%
                    </span>
                    <svg 
                      className={cn(
                        'w-4 h-4 ml-1', 
                        cluster.direction === 'up' ? 'text-green-600' : 'text-red-600'
                      )} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      {cluster.direction === 'up' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      )}
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Clusters que impulsan valor a corto plazo</h3>
            
            <div className="space-y-4">
              {shortTermClusters.map((cluster, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm">{cluster.name}</span>
                  <div className="flex items-center">
                    <span className={cn(
                      'text-sm font-medium',
                      cluster.direction === 'up' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {cluster.direction === 'up' && '+ '}
                      {cluster.direction === 'down' && '- '}
                      {cluster.percentage}%
                    </span>
                    <svg 
                      className={cn(
                        'w-4 h-4 ml-1', 
                        cluster.direction === 'up' ? 'text-green-600' : 'text-red-600'
                      )} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      {cluster.direction === 'up' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      )}
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabla detallada de emociones */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-medium text-neutral-700">Detalle de emociones</h3>
          <Button variant="outline" size="sm" className="text-xs">
            Exportar datos
          </Button>
        </div>
        
        <div className="overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead>
              <tr>
                <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Emoción
                </th>
                <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Valencia
                </th>
                <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Porcentaje
                </th>
                <th className="px-3 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Respuestas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {emotions.map((emotion, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-neutral-50' : 'bg-white'}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-neutral-900">
                    {emotion.name}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      emotion.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    )}>
                      {emotion.isPositive ? 'Positiva' : 'Negativa'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-500">
                    {emotion.percentage}%
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-500">
                    {emotion.count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 