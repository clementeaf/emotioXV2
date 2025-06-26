import { Target, ChevronDown } from 'lucide-react';
import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area
} from 'recharts';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/CircularProgress';

import Progress from './ui/Progress';

interface NPSQuestionProps {
  monthlyData: Array<{
    month: string;
    promoters: number;
    neutrals: number;
    detractors: number;
    npsRatio: number;
  }>;
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
            <span className="text-sm font-medium">
              {entry.name}: {entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Componente personalizado para la leyenda
const CustomLegend = () => (
  <div className="flex items-center gap-6 mb-2">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
      <span className="text-sm text-gray-700">NPS Ratio</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-[#8DD1A1]"></div>
      <span className="text-sm text-gray-700">Promoters</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-gray-200"></div>
      <span className="text-sm text-gray-700">Neutrals</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-[#F89E9E]"></div>
      <span className="text-sm text-gray-700">Detractors</span>
    </div>
  </div>
);

export function NPSQuestion({ monthlyData }: NPSQuestionProps) {
  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">2.5.- Question: Net Promoter Score (NPS)</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-700">Linear Scale question</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Conditionality disabled</Badge>
            <Badge variant="secondary" className="bg-red-100 text-red-700">Required</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Responses</span>
            <span className="text-2xl font-semibold">28,635</span>
            <span className="text-sm text-gray-500">26s</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Promoters</span>
              <span className="text-sm font-medium">78%</span>
            </div>
            <Progress 
              value={78} 
              className="h-2" 
              indicatorClassName="bg-green-500"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Detractors</span>
              <span className="text-sm font-medium">22%</span>
            </div>
            <Progress 
              value={22} 
              className="h-2" 
              indicatorClassName="bg-red-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="text-sm">NPS' question</span>
          </div>
          <p className="text-sm text-gray-500">On a scale from 0-10, how likely are you to recommend [company] to a friend or colleague?</p>
        </div>

        <div className="flex justify-end">
          <div className="w-24 h-24">
            <CircularProgress value={63} size={96} strokeWidth={8} />
          </div>
        </div>

        <div className="h-[480px]">
          <div className="flex justify-between items-center mb-4">
            <CustomLegend />
            <div className="relative inline-block">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white">
                <span>Year</span>
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <ComposedChart data={monthlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} barGap={15}>
              <defs>
                <linearGradient id="npsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4338CA" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4338CA" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={true}
                stroke="#E5E7EB"
                opacity={0.4}
              />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                stroke="#9CA3AF"
                fontSize={12}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                stroke="#9CA3AF"
                fontSize={12}
                domain={[0, 100]}
                hide={true}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="detractors" 
                stackId="a" 
                fill="#F89E9E"
                fillOpacity={0.9}
                radius={[20, 20, 20, 20]}
                name="Detractors"
                barSize={20}
              />
              <Bar 
                dataKey="neutrals" 
                stackId="a" 
                fill="#E5E7EB"
                fillOpacity={0.9}
                radius={[20, 20, 20, 20]}
                name="Neutrals"
                barSize={20}
              />
              <Bar 
                dataKey="promoters" 
                stackId="a" 
                fill="#8DD1A1"
                fillOpacity={0.9}
                radius={[20, 20, 20, 20]}
                name="Promoters"
                barSize={20}
              />
              <Area
                type="natural"
                dataKey="npsRatio"
                stroke="#3B52E8"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#npsGradient)"
                dot={false}
                activeDot={{ r: 8, strokeWidth: 2, stroke: '#ffffff' }}
                name="NPS Ratio"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="mb-2">
            <h3 className="text-lg font-medium">Loyalty's Evolution</h3>
            <div className="text-green-600 font-medium">
              +16% Since last month
            </div>
          </div>

          <div className="flex mt-4">
            <div className="flex-1 flex flex-col items-center">
              <div className="text-lg font-semibold text-gray-700">35%</div>
              <div className="my-2">
                <div className="rounded-full bg-green-100 p-1.5">
                  <svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <span className="text-sm text-gray-600">Promoters</span>
            </div>
            
            <div className="flex-1 flex flex-col items-center">
              <div className="text-lg font-semibold text-gray-700">26%</div>
              <div className="my-2">
                <div className="rounded-full bg-red-100 p-1.5">
                  <svg className="w-4 h-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <span className="text-sm text-gray-600">Detractors</span>
            </div>
            
            <div className="flex-1 flex flex-col items-center">
              <div className="text-lg font-semibold text-gray-700">39%</div>
              <div className="my-2">
                <div className="rounded-full bg-gray-200 p-1.5">
                  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <span className="text-sm text-gray-600">Neutrals</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 