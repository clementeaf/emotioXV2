'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/CircularProgress';

import { SmartVOCQuestion } from 'shared/interfaces/smart-voc.interface';

interface CSATQuestionProps {
  question: SmartVOCQuestion;
  data: any;
  researchId: string;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

export function CSATQuestion({ question, data }: CSATQuestionProps) {
  // Procesar datos CSAT
  const csatScores = data?.csatScores || [];
  const totalResponses = csatScores.length;

  // Calcular métricas
  const averageScore = totalResponses > 0
    ? Math.round((csatScores.reduce((a: number, b: number) => a + b, 0) / totalResponses) * 10) / 10
    : 0;

  // Distribución de satisfacción
  const satisfactionDistribution = [
    { name: 'Muy Satisfecho', value: csatScores.filter((score: number) => score >= 4.5).length, percentage: totalResponses > 0 ? Math.round((csatScores.filter((score: number) => score >= 4.5).length / totalResponses) * 100) : 0 },
    { name: 'Satisfecho', value: csatScores.filter((score: number) => score >= 3.5 && score < 4.5).length, percentage: totalResponses > 0 ? Math.round((csatScores.filter((score: number) => score >= 3.5 && score < 4.5).length / totalResponses) * 100) : 0 },
    { name: 'Neutral', value: csatScores.filter((score: number) => score >= 2.5 && score < 3.5).length, percentage: totalResponses > 0 ? Math.round((csatScores.filter((score: number) => score >= 2.5 && score < 3.5).length / totalResponses) * 100) : 0 },
    { name: 'Insatisfecho', value: csatScores.filter((score: number) => score < 2.5).length, percentage: totalResponses > 0 ? Math.round((csatScores.filter((score: number) => score < 2.5).length / totalResponses) * 100) : 0 }
  ];

  // Datos para el gráfico de barras
  const barData = satisfactionDistribution.map((item, index) => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage,
    color: COLORS[index]
  }));

  // Datos para el gráfico circular
  const pieData = satisfactionDistribution.filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">CSAT - {question.title || 'Customer Satisfaction Score'}</h3>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">CSAT Question</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Conditionality disabled</Badge>
            {question.required && <Badge variant="secondary" className="bg-red-100 text-red-700">Required</Badge>}
          </div>

          <div className="flex items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Question</span>
              </div>
              <p className="text-sm text-gray-800">
                {question.description || 'How would you rate your overall satisfaction level with our service?'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Responses</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{totalResponses}</span>
                  <span className="text-sm text-gray-500">responses</span>
                </div>
              </div>

              <div className="w-24 h-24">
                <CircularProgress value={averageScore * 10} size={96} strokeWidth={8} />
                <div className="text-center mt-2">
                  <span className="text-sm font-medium">{averageScore}/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de distribución */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Satisfaction Distribution</h4>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de barras */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      `${value} (${barData.find(item => item.value === value)?.percentage}%)`,
                      'Responses'
                    ]}
                  />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico circular */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Métricas detalladas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {satisfactionDistribution.map((item, index) => (
              <div key={item.name} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold" style={{ color: COLORS[index] }}>
                  {item.percentage}%
                </div>
                <div className="text-sm text-gray-600">{item.name}</div>
                <div className="text-xs text-gray-500">{item.value} responses</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
