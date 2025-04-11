'use client';

import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrustFlowData } from './types';

interface TrustRelationshipFlowProps {
  data: TrustFlowData[];
  className?: string;
}

export const TrustRelationshipFlow = ({ data, className }: TrustRelationshipFlowProps) => {
  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-gray-600">Trust Relationship Flow</h3>
          <select className="text-sm border rounded-md px-2 py-1">
            <option>Last 24 hours</option>
            <option>Last week</option>
            <option>Last month</option>
          </select>
        </div>
        <p className="text-sm text-gray-500">Customer's perception about service in time</p>
      </div>
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis 
              dataKey="hour" 
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
              dataKey="nps" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ r: 4, fill: "#3B82F6" }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="nev" 
              stroke="#8B5CF6" 
              strokeWidth={2}
              dot={{ r: 4, fill: "#8B5CF6" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-6 text-sm mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span className="text-gray-600">NPS</span>
          <span className="font-medium ml-2">74.62</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full" />
          <span className="text-gray-600">NEV</span>
          <span className="font-medium ml-2">56.47</span>
        </div>
      </div>
    </Card>
  );
}; 