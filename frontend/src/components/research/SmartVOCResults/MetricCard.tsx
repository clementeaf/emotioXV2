'use client';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

import { MetricCardProps } from './types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-sm text-gray-600 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload, cardType }: { payload: any; cardType: string }) => {
  // Definir las leyendas según el tipo de tarjeta
  const getLegendLabels = () => {
    switch (cardType) {
      case 'Customer Satisfaction':
        return { positive: 'Satisfied', negative: 'Dissatisfied' };
      case 'Customer Effort Score':
        return { positive: 'Little effort', negative: 'Much effort' };
      case 'Cognitive Value':
        return { positive: 'Worth', negative: 'Worthless' };
      default:
        return { positive: 'Positive', negative: 'Negative' };
    }
  };

  const labels = getLegendLabels();

  return (
    <div className="flex gap-4 mt-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-red-500"></div>
        <span className="text-xs text-gray-600">{labels.negative}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-green-500"></div>
        <span className="text-xs text-gray-600">{labels.positive}</span>
      </div>
    </div>
  );
};

export const MetricCard = ({ title, score, question, data, className, hasData = false }: MetricCardProps) => {
  return (
    <Card className={cn('p-6 space-y-6', className)}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-gray-600">{title}</h3>
          {/* Icono de tres puntos */}
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
        
        {hasData ? (
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-medium">{score.toFixed(2)}</span>
            <div className="flex items-center text-green-600 text-sm">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                className="w-4 h-4 mr-1"
              >
                <path 
                  fillRule="evenodd" 
                  d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042.815a.75.75 0 01-.919-.53z" 
                  clipRule="evenodd" 
                />
              </svg>
              +2.5%
            </div>
          </div>
        ) : (
          <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
        )}
        
        <p className="text-gray-500">{question}</p>
      </div>
      
      <div className="h-40">
        {hasData && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false}
                stroke="#E5E7EB"
              />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                stroke="#9CA3AF"
                fontSize={12}
                tickMargin={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                stroke="#9CA3AF"
                fontSize={12}
                domain={[0, 100]}
                ticks={[0, 50, 100]}
                tickMargin={10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend payload={[]} cardType={title} />} />
              <Line 
                type="monotone" 
                dataKey="satisfied" 
                name="Satisfied"
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Line 
                type="monotone" 
                dataKey="dissatisfied" 
                name="Dissatisfied"
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Aún no hay datos</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Leyenda siempre visible */}
      <CustomLegend payload={[]} cardType={title} />
    </Card>
  );
}; 