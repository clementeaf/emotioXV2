'use client';

import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
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
              <stop offset="0%" stopColor="#fff" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
            fill="url(#cpvGradient)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CPVCard = ({ value, timeRange, onTimeRangeChange, trendData, className }: CPVCardProps) => {
  return (
    <Card className={cn("bg-[#4361EE] text-white p-8 relative overflow-hidden rounded-[2rem]", className)}>
      <div className="relative z-10">
        <div className="flex gap-8">
          {(['Today', 'Week', 'Month'] as const).map((range) => (
            <button
              key={range}
              className={cn(
                "text-base transition-all",
                timeRange === range 
                  ? "bg-white/20 px-6 py-2 rounded-2xl" 
                  : "text-white/80"
              )}
              onClick={() => onTimeRangeChange(range)}
            >
              {range}
            </button>
          ))}
        </div>
        
        <div className="mt-24">
          <div className="flex items-start gap-2">
            <span className="text-[6rem] leading-[1] font-extralight">
              {value.toFixed(2)}
            </span>
            <TrendingUp className="text-white/70 w-4 h-4 mt-6" />
          </div>
          <div className="space-y-1 mt-2">
            <p className="text-2xl">CPV Estimation</p>
            <p className="text-lg text-white/80">Customer Perceived Value</p>
          </div>
        </div>
      </div>

      <CPVChart data={trendData} />
    </Card>
  );
}; 