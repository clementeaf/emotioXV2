'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SmartVOCDashboardProps {
  className?: string;
}

// Interfaces para datos
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
  neutralLabel?: string;
  neutralValue?: number;
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

  // Datos simulados para las tarjetas de KPI
  const kpiCards: KPICard[] = [
    {
      id: 'csat',
      title: 'CSAT 84.58',
      value: 84.58,
      change: 2.7,
      trend: [65, 68, 74, 78, 80, 79, 82, 85]
    },
    {
      id: 'ces',
      title: 'CES 83.26',
      value: 83.26,
      change: 1.5,
      trend: [70, 72, 75, 79, 81, 82, 83, 83]
    },
    {
      id: 'nps',
      title: 'NPS 70.43',
      value: 70.43,
      change: 3.2,
      trend: [58, 60, 62, 63, 65, 67, 68, 70]
    }
  ];

  // Datos simulados para las secciones de métricas
  const metricSections: MetricSection[] = [
    {
      id: 'csat',
      title: 'Satisfacción del Cliente (CSAT)',
      description: '¿Cuál es su nivel de satisfacción con la experiencia de servicio?',
      score: 84,
      positiveLabel: 'Satisfecho',
      positiveValue: 84,
      negativeLabel: 'Insatisfecho',
      negativeValue: 16,
      attributes: [
        { name: 'Calidad de servicio', value: 88, target: 90 },
        { name: 'Tiempo de resolución', value: 75, target: 85 },
        { name: 'Amabilidad del personal', value: 92, target: 90 },
        { name: 'Conocimiento técnico', value: 86, target: 90 }
      ]
    },
    {
      id: 'ces',
      title: 'Esfuerzo del Cliente (CES)',
      description: '¿Cuánto esfuerzo personal tuvo que hacer para resolver su consulta?',
      score: 79,
      positiveLabel: 'Poco esfuerzo',
      positiveValue: 79,
      negativeLabel: 'Mucho esfuerzo',
      negativeValue: 21,
      attributes: [
        { name: 'Navegación web/app', value: 83, target: 90 },
        { name: 'Proceso de compra', value: 78, target: 85 },
        { name: 'Soporte al cliente', value: 75, target: 85 },
        { name: 'Proceso de devolución', value: 72, target: 80 }
      ]
    },
    {
      id: 'nps',
      title: 'Net Promoter Score (NPS)',
      description: '¿Qué tan probable es que recomiende nuestra empresa a un amigo o colega?',
      score: 63,
      positiveLabel: 'Promotores',
      positiveValue: 70,
      neutralLabel: 'Pasivos',
      neutralValue: 18,
      negativeLabel: 'Detractores',
      negativeValue: 12,
      attributes: [
        { name: 'Calidad del producto', value: 86, target: 90 },
        { name: 'Relación calidad-precio', value: 75, target: 80 },
        { name: 'Servicio post-venta', value: 68, target: 75 },
        { name: 'Recomendación general', value: 82, target: 85 }
      ]
    },
    {
      id: 'emotional',
      title: 'Valor Emocional Neto (NEV)',
      description: '¿Cómo se siente respecto a su experiencia con nuestra empresa?',
      score: 71,
      positiveLabel: 'Emociones positivas',
      positiveValue: 71,
      negativeLabel: 'Emociones negativas',
      negativeValue: 29,
      attributes: [
        { name: 'Confianza', value: 78, target: 85 },
        { name: 'Satisfacción', value: 81, target: 85 },
        { name: 'Seguridad', value: 85, target: 90 },
        { name: 'Valoración', value: 73, target: 80 }
      ]
    },
    {
      id: 'sentiment',
      title: 'Análisis de Sentimiento',
      description: 'Análisis de comentarios y opiniones de clientes',
      score: 68,
      positiveLabel: 'Sentimiento positivo',
      positiveValue: 68,
      negativeLabel: 'Sentimiento negativo',
      negativeValue: 32,
      attributes: [
        { name: 'Productos', value: 72, target: 80 },
        { name: 'Servicio', value: 68, target: 75 },
        { name: 'Precio', value: 63, target: 70 },
        { name: 'Experiencia general', value: 74, target: 80 }
      ]
    }
  ];

  // Datos para la gráfica de tendencia
  const trendData = {
    months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    csat: [74, 76, 75, 78, 80, 79, 81, 82, 83, 84, 85, 85],
    ces: [71, 72, 73, 75, 76, 77, 79, 80, 81, 82, 83, 83],
    nps: [58, 59, 61, 62, 64, 65, 66, 67, 68, 69, 70, 70]
  };

  // Función para renderizar el mini gráfico de tendencia en las tarjetas KPI
  const renderMiniTrend = (data: number[]) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    
    return (
      <div className="h-12 flex items-end">
        {data.map((value, index) => {
          const height = range > 0 ? (((value - min) / range) * 100) : 50;
          return (
            <div 
              key={index} 
              className="w-1 mx-px rounded-t" 
              style={{ 
                height: `${height}%`, 
                backgroundColor: index === data.length - 1 ? '#4C7BF4' : '#BFD1FD' 
              }}
            />
          );
        })}
      </div>
    );
  };

  // Función para renderizar el gráfico principal de tendencia
  const renderTrendChart = () => {
    // Esta función simplifica la implementación real que usaría SVG para dibujar los gráficos
    return (
      <div className="bg-white p-6 rounded-lg border border-neutral-200 h-64 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Tendencia Relacional Fina</h3>
          <div className="flex space-x-2">
            {['Semana', 'Mes', 'Trimestre', 'Año'].map((period) => (
              <button
                key={period}
                className={cn(
                  "px-3 py-1 text-xs rounded-full",
                  timeFilter === period 
                    ? "bg-blue-100 text-blue-700" 
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                )}
                onClick={() => setTimeFilter(period as any)}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-44 flex items-end relative">
          <div className="absolute inset-0 flex flex-col justify-between">
            <div className="border-b border-neutral-100 h-0"></div>
            <div className="border-b border-neutral-100 h-0"></div>
            <div className="border-b border-neutral-100 h-0"></div>
            <div className="border-b border-neutral-100 h-0"></div>
            <div className="border-b border-neutral-100 h-0"></div>
          </div>
          
          {/* Versión simplificada - en la implementación real, usaríamos SVG para crear gráficos de línea precisos */}
          <div className="w-full h-full relative flex items-end">
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-blue-50 to-transparent"></div>
            </div>
            
            <div className="absolute top-1/4 left-0 right-0 h-px bg-purple-200 z-10"></div>
            <div className="absolute top-2/3 left-0 right-0 h-px bg-blue-200 z-10"></div>
            
            <div className="w-full flex justify-between items-end h-full relative z-20 px-2">
              {trendData.months.map((month, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="text-[8px] text-neutral-500 absolute -bottom-5">{month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Función para renderizar una sección de métrica
  const renderMetricSection = (metric: MetricSection) => {
    return (
      <div key={metric.id} className="bg-white p-6 rounded-lg border border-neutral-200 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-neutral-900">{metric.title}</h3>
            <p className="text-sm text-neutral-600 mt-1">{metric.description}</p>
          </div>
          
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2 py-1 bg-green-50 text-green-600 rounded">
              Linear Scale question
            </span>
            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">
              Conditionality disabled
            </span>
            <span className="px-2 py-1 bg-red-50 text-red-600 rounded">
              Required
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-6">
          {/* Círculo de puntuación */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#eaeaea" 
                  strokeWidth="10" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke={metric.score >= 70 ? "#4CAF50" : metric.score >= 50 ? "#FF9800" : "#F44336"} 
                  strokeWidth="10" 
                  strokeDasharray={`${metric.score * 2.83} ${283 - (metric.score * 2.83)}`} 
                  strokeDashoffset="0" 
                  transform="rotate(-90 50 50)" 
                />
                <text 
                  x="50" 
                  y="50" 
                  dominantBaseline="middle" 
                  textAnchor="middle" 
                  fontSize="24" 
                  fontWeight="bold" 
                  fill={metric.score >= 70 ? "#4CAF50" : metric.score >= 50 ? "#FF9800" : "#F44336"}
                >
                  {metric.score}
                </text>
              </svg>
            </div>
            
            <div className="mt-4 text-sm text-neutral-700">
              <div className="flex items-center">
                <span className="text-green-500 mr-1">▲</span>
                <span>+2.4% desde el mes pasado</span>
              </div>
            </div>
          </div>
          
          {/* Barras de progreso y porcentajes */}
          <div className="col-span-3">
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-neutral-700">{metric.positiveLabel}</span>
                <span className="text-sm font-medium text-neutral-700">{metric.positiveValue}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2.5">
                <div 
                  className="bg-green-500 h-2.5 rounded-full" 
                  style={{ width: `${metric.positiveValue}%` }}
                ></div>
              </div>
            </div>
            
            {metric.neutralLabel && (
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-neutral-700">{metric.neutralLabel}</span>
                  <span className="text-sm font-medium text-neutral-700">{metric.neutralValue}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2.5">
                  <div 
                    className="bg-neutral-400 h-2.5 rounded-full" 
                    style={{ width: `${metric.neutralValue}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-neutral-700">{metric.negativeLabel}</span>
                <span className="text-sm font-medium text-neutral-700">{metric.negativeValue}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2.5">
                <div 
                  className="bg-red-500 h-2.5 rounded-full" 
                  style={{ width: `${metric.negativeValue}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
              {metric.attributes.map((attr, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-700">{attr.name}</span>
                    <span className="text-sm font-medium text-neutral-700">{attr.value}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className={cn(
                        "h-2 rounded-full",
                        attr.value >= attr.target ? "bg-green-500" : "bg-amber-500"
                      )}
                      style={{ width: `${attr.value}%` }}
                    ></div>
                  </div>
                  <div className="w-full flex justify-end">
                    <span className="text-xs text-neutral-500 mt-0.5">Meta: {attr.target}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("mt-6 mb-10", className)}>
      {/* Filtros superiores */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          Dashboard - Resultados SmartVOC
        </h2>
        
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <span className="mr-2">Filtrar</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
          </Button>
          <Button variant="outline" size="sm">
            <span className="mr-2">Descargar</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </Button>
        </div>
      </div>
      
      {/* Tarjetas KPI */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {kpiCards.map(card => (
          <div key={card.id} className="bg-white p-4 rounded-lg border border-neutral-200">
            <h3 className="text-lg font-medium text-neutral-900">{card.title}</h3>
            <div className="flex items-center mt-1 mb-2">
              <span className="text-sm text-green-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
                +{card.change}%
              </span>
              <span className="text-xs text-neutral-500 ml-2">vs mes anterior</span>
            </div>
            {renderMiniTrend(card.trend)}
          </div>
        ))}
      </div>
      
      {/* Gráfico de tendencia principal */}
      {renderTrendChart()}
      
      {/* Secciones de métricas */}
      {metricSections.map(renderMetricSection)}
      
      {/* Tabla de respuestas */}
      <div className="bg-white p-6 rounded-lg border border-neutral-200 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Tickit Review</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-xs rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
              Por mes
            </button>
            <button className="px-3 py-1 text-xs rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
              Por semana
            </button>
          </div>
        </div>
        
        <div className="h-48 flex items-end">
          {/* Simulación simple de gráfico de barras */}
          {Array.from({ length: 24 }).map((_, i) => {
            const height = 30 + Math.random() * 70;
            const color = i < 16 ? (height > 60 ? 'bg-green-500' : 'bg-green-300') : 'bg-red-400';
            return (
              <div key={i} className="flex-1 mx-px flex flex-col items-center">
                <div className={`w-full ${color}`} style={{ height: `${height}%` }}></div>
                {i % 6 === 0 && <div className="text-[8px] text-neutral-500 mt-1">Jan</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 