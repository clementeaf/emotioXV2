'use client';

import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { CPVChartData } from './types';

interface CPVCardProps {
  value: number;
  timeRange: 'Today' | 'Week' | 'Month';
  onTimeRangeChange: (range: 'Today' | 'Week' | 'Month') => void;
  trendData: CPVChartData[];
  className?: string;
}

const CPVChart = ({ data }: { data: CPVChartData[] }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="cpvGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={false}
          />
          <YAxis 
            hide={true}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              padding: '8px 12px'
            }}
            labelStyle={{ color: '#6B7280' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: number) => [`${value}%`, 'CPV']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
            fill="url(#cpvGradient)"
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
            dot={{ r: 2, fill: '#fff' }}
            activeDot={{ r: 4, fill: '#fff', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CPVCard = ({ value, timeRange, onTimeRangeChange, trendData, className }: CPVCardProps) => {
  return (
    <Card className={cn("relative overflow-hidden bg-blue-600 text-white", className)}>
      <div className="relative z-10 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white/80">Customer Perceived Value</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-medium">{value}%</span>
              <div className="flex items-center text-white/80">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm">+2.5%</span>
              </div>
            </div>
          </div>
          <select 
            className="bg-white/10 border-0 text-white text-sm rounded-lg focus:ring-2 focus:ring-white/20 px-3 py-1.5"
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as 'Today' | 'Week' | 'Month')}
          >
            <option value="Today" className="text-gray-900">Today</option>
            <option value="Week" className="text-gray-900">This Week</option>
            <option value="Month" className="text-gray-900">This Month</option>
          </select>
        </div>
        <CPVChart data={trendData} />
      </div>
    </Card>
  );
}; 