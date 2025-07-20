'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

import { TrustFlowData } from './types';

interface TrustRelationshipFlowProps {
  data: TrustFlowData[];
  className?: string;
  hasData?: boolean; // Nueva prop para indicar si hay datos reales
}

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

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex gap-6 justify-end mt-2">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const TrustRelationshipFlow = ({ data, className, hasData = true }: TrustRelationshipFlowProps) => {
  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-gray-600">Trust Relationship Flow</h3>
            <p className="text-sm text-gray-500 mt-1">Customer's perception about service in time</p>
          </div>
          <select className="text-sm border rounded-md px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500">
            <option>Last 24 hours</option>
            <option>Last week</option>
            <option>Last month</option>
          </select>
        </div>
      </div>

      <div className="h-64 mt-6">
        {!hasData || data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-600 mb-2">Aún no hay datos</h4>
              <p className="text-sm text-gray-500 max-w-xs">
                El gráfico de percepción del cliente aparecerá aquí cuando los participantes completen las encuestas SmartVOC.
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E5E7EB"
              />
              <XAxis
                dataKey="stage"
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
                tickMargin={10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Line
                type="monotone"
                dataKey="nps"
                name="NPS"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="nev"
                name="NEV"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ r: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
