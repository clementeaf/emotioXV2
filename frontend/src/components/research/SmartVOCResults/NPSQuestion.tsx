import { ChevronDown, Target } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/CircularProgress';
import Progress from '@/components/ui/progress';

// Componente Skeleton para NPSQuestion
const NPSQuestionSkeleton = () => {
  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-64 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="w-64 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="flex justify-end">
          <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        <div className="h-[480px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-6 h-6 bg-gray-300 rounded"></div>
            </div>
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="w-48 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface NPSQuestionProps {
  monthlyData: Array<{
    month: string;
    promoters: number;
    neutrals: number;
    detractors: number;
    npsRatio: number;
  }>;
  npsScore?: number;
  promoters?: number;
  detractors?: number;
  neutrals?: number;
  totalResponses?: number;
  isLoading?: boolean; // Nueva prop para loading
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-gray-600" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLegend = () => (
  <div className="flex items-center space-x-4 text-sm">
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
      <span className="text-gray-600">Promoters</span>
    </div>
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
      <span className="text-gray-600">Neutrals</span>
    </div>
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
      <span className="text-gray-600">Detractors</span>
    </div>
  </div>
);

export function NPSQuestion({
  monthlyData,
  npsScore = 0,
  promoters = 0,
  detractors = 0,
  neutrals = 0,
  totalResponses = 0,
  isLoading = false
}: NPSQuestionProps) {
  const hasData = monthlyData.length > 0;

  // Calcular porcentajes
  const total = promoters + detractors + neutrals;
  const promotersPercentage = total > 0 ? Math.round((promoters / total) * 100) : 0;
  const detractorsPercentage = total > 0 ? Math.round((detractors / total) * 100) : 0;

  // Si está cargando, mostrar skeleton
  if (isLoading) {
    return <NPSQuestionSkeleton />;
  }

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
            <span className="text-2xl font-semibold">{totalResponses}</span>
            <span className="text-sm text-gray-500">0s</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Promoters</span>
              <span className="text-sm font-medium">{promotersPercentage}%</span>
            </div>
            <Progress
              value={promotersPercentage}
              className="h-2"
              indicatorClassName="bg-green-500"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Detractors</span>
              <span className="text-sm font-medium">{detractorsPercentage}%</span>
            </div>
            <Progress
              value={detractorsPercentage}
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
            <CircularProgress value={npsScore} size={96} strokeWidth={8} />
          </div>
        </div>

        <div className="h-[480px]">
          {!hasData && (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No hay datos disponibles</p>
                <p className="text-gray-400 text-sm">Los datos de NPS aparecerán aquí cuando se recopilen respuestas</p>
              </div>
            </div>
          )}

          {hasData && (
            <>
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
                    dataKey="promoters"
                    name="Promoters"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="neutrals"
                    name="Neutrals"
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="detractors"
                    name="Detractors"
                    fill="#EF4444"
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="mb-2">
            <h3 className="text-lg font-medium">Loyalty's Evolution</h3>
            <div className="text-green-600 font-medium">
              {hasData ? '+16% Since last month' : 'No hay datos disponibles'}
            </div>
          </div>

          <div className="flex mt-4">
            <div className="flex-1 flex flex-col items-center">
              <div className="text-lg font-semibold text-gray-700">{hasData ? '35%' : '0%'}</div>
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
              <div className="text-lg font-semibold text-gray-700">{hasData ? '26%' : '0%'}</div>
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
              <div className="text-lg font-semibold text-gray-700">{hasData ? '39%' : '0%'}</div>
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
