'use client';

import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricCardProps } from './types';

export const MetricCard = ({ title, score, question, data, className }: MetricCardProps) => {
  return (
    <Card className={cn("p-6 space-y-6", className)}>
      <div className="space-y-4">
        <h3 className="text-gray-600">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-medium">{score.toFixed(2)}</span>
        </div>
        <p className="text-gray-500">{question}</p>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              stroke="#9CA3AF"
              fontSize={12}
              domain={[0, 100]}
              ticks={[0, 50, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'white',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="satisfied" 
              stroke="#22c55e" 
              strokeWidth={2}
              dot={{ r: 4, fill: "#22c55e" }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="dissatisfied" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ r: 4, fill: "#ef4444" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span className="text-gray-600">Dissatisfied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-gray-600">Satisfied</span>
        </div>
      </div>
    </Card>
  );
}; 