'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/CircularProgress';

import { SmartVOCQuestion } from 'shared/interfaces/smart-voc.interface';

interface CESQuestionProps {
  question: SmartVOCQuestion;
  data: any;
  researchId: string;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280', '#8B5CF6', '#EC4899', '#F97316'];

export function CESQuestion({ question, data }: CESQuestionProps) {
  // Debug: Log de datos recibidos
  console.log('[CESQuestion] 🔍 Datos recibidos:', {
    question,
    data,
    cesScores: data?.cesScores,
    cesScoresLength: data?.cesScores?.length,
    totalDataKeys: data ? Object.keys(data) : []
  });

  // Procesar datos CES
  const cesScores = data?.cesScores || [];
  const totalResponses = cesScores.length;

  // Debug: Log de procesamiento
  console.log('[CESQuestion] 📊 Procesamiento de datos:', {
    cesScores,
    totalResponses,
    averageScore: totalResponses > 0
      ? Math.round((cesScores.reduce((a: number, b: number) => a + b, 0) / totalResponses) * 10) / 10
      : 0
  });

  // Si no hay datos reales, mostrar mensaje informativo
  if (totalResponses === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">CES - {question.title || 'Customer Effort Score'}</h3>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">CES Question</Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">Conditionality disabled</Badge>
              {question.required && <Badge variant="secondary" className="bg-red-100 text-red-700">Required</Badge>}
            </div>

            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">Question</span>
                </div>
                <p className="text-sm text-gray-800">
                  {question.description || 'How much effort did you personally have to put forth to handle your request?'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Responses</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-gray-400">0</span>
                    <span className="text-sm text-gray-500">responses</span>
                  </div>
                </div>

                <div className="w-24 h-24">
                  <CircularProgress value={0} size={96} strokeWidth={8} />
                  <div className="text-center mt-2">
                    <span className="text-sm font-medium text-gray-400">0/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje de no datos */}
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
            <p className="text-sm text-gray-600">
              No se han recibido respuestas para esta pregunta SmartVOC.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Los datos se mostrarán automáticamente cuando los participantes respondan.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Calcular métricas
  const averageScore = totalResponses > 0
    ? Math.round((cesScores.reduce((a: number, b: number) => a + b, 0) / totalResponses) * 10) / 10
    : 0;

  // Distribución de esfuerzo (CES: 1 = muy fácil, 7 = muy difícil)
  const effortDistribution = [
    { name: 'Muy Fácil', value: cesScores.filter((score: number) => score <= 2).length, percentage: totalResponses > 0 ? Math.round((cesScores.filter((score: number) => score <= 2).length / totalResponses) * 100) : 0 },
    { name: 'Fácil', value: cesScores.filter((score: number) => score > 2 && score <= 3).length, percentage: totalResponses > 0 ? Math.round((cesScores.filter((score: number) => score > 2 && score <= 3).length / totalResponses) * 100) : 0 },
    { name: 'Neutral', value: cesScores.filter((score: number) => score > 3 && score <= 4).length, percentage: totalResponses > 0 ? Math.round((cesScores.filter((score: number) => score > 3 && score <= 4).length / totalResponses) * 100) : 0 },
    { name: 'Difícil', value: cesScores.filter((score: number) => score > 4 && score <= 5).length, percentage: totalResponses > 0 ? Math.round((cesScores.filter((score: number) => score > 4 && score <= 5).length / totalResponses) * 100) : 0 },
    { name: 'Muy Difícil', value: cesScores.filter((score: number) => score > 5).length, percentage: totalResponses > 0 ? Math.round((cesScores.filter((score: number) => score > 5).length / totalResponses) * 100) : 0 }
  ];

  // Datos para el gráfico de barras
  const barData = effortDistribution.map((item, index) => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage,
    color: COLORS[index]
  }));

  // Datos para el gráfico de línea (tendencia temporal si existe)
  const timeSeriesData = data?.timeSeriesData || [];
  const lineData = timeSeriesData.map((item: any) => ({
    date: item.date,
    ces: item.ces || averageScore
  }));

  // Calcular métricas adicionales
  const lowEffortPercentage = totalResponses > 0
    ? Math.round(((cesScores.filter((score: number) => score <= 3).length) / totalResponses) * 100)
    : 0;

  const highEffortPercentage = totalResponses > 0
    ? Math.round(((cesScores.filter((score: number) => score >= 5).length) / totalResponses) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">CES - {question.title || 'Customer Effort Score'}</h3>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">CES Question</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Conditionality disabled</Badge>
            {question.required && <Badge variant="secondary" className="bg-red-100 text-red-700">Required</Badge>}
          </div>

          <div className="flex items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Question</span>
              </div>
              <p className="text-sm text-gray-800">
                {question.description || 'How much effort did you personally have to put forth to handle your request?'}
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
                <CircularProgress value={averageScore * 14.28} size={96} strokeWidth={8} />
                <div className="text-center mt-2">
                  <span className="text-sm font-medium">{averageScore}/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{lowEffortPercentage}%</div>
            <div className="text-sm text-green-700">Bajo Esfuerzo</div>
            <div className="text-xs text-green-600">(1-3 puntos)</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{100 - lowEffortPercentage - highEffortPercentage}%</div>
            <div className="text-sm text-yellow-700">Esfuerzo Medio</div>
            <div className="text-xs text-yellow-600">(4 puntos)</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{highEffortPercentage}%</div>
            <div className="text-sm text-red-700">Alto Esfuerzo</div>
            <div className="text-xs text-red-600">(5-7 puntos)</div>
          </div>
        </div>

        {/* Gráfico de distribución */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Effort Distribution</h4>

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
                <Bar dataKey="value" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Métricas detalladas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            {effortDistribution.map((item, index) => (
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

        {/* Gráfico de tendencia temporal */}
        {lineData.length > 1 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">CES Trend Over Time</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 7]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ces" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
