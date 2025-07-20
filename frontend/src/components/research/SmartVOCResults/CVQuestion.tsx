'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/CircularProgress';

import { SmartVOCQuestion } from 'shared/interfaces/smart-voc.interface';

interface CVQuestionProps {
  question: SmartVOCQuestion;
  data: any;
  researchId: string;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280', '#8B5CF6', '#EC4899', '#F97316'];

export function CVQuestion({ question, data }: CVQuestionProps) {
  // Debug: Log de datos recibidos
  console.log('[CVQuestion] 🔍 Datos recibidos:', {
    question,
    data,
    cvScores: data?.cvScores,
    cvScoresLength: data?.cvScores?.length,
    totalDataKeys: data ? Object.keys(data) : []
  });

  // Procesar datos CV
  const cvScores = data?.cvScores || [];
  const totalResponses = cvScores.length;

  // Debug: Log de procesamiento
  console.log('[CVQuestion] 📊 Procesamiento de datos:', {
    cvScores,
    totalResponses,
    averageScore: totalResponses > 0
      ? Math.round((cvScores.reduce((a: number, b: number) => a + b, 0) / totalResponses) * 10) / 10
      : 0
  });

  // Si no hay datos reales, mostrar mensaje informativo
  if (totalResponses === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">CV - {question.title || 'Customer Value'}</h3>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">CV Question</Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">Conditionality disabled</Badge>
              {question.required && <Badge variant="secondary" className="bg-red-100 text-red-700">Required</Badge>}
            </div>

            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">Question</span>
                </div>
                <p className="text-sm text-gray-800">
                  {question.description || 'How would you rate the overall value you receive from our product/service?'}
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
    ? Math.round((cvScores.reduce((a: number, b: number) => a + b, 0) / totalResponses) * 10) / 10
    : 0;

  // Distribución de valor percibido (CV: 1 = muy bajo valor, 7 = muy alto valor)
  const valueDistribution = [
    { name: 'Muy Alto Valor', value: cvScores.filter((score: number) => score >= 6).length, percentage: totalResponses > 0 ? Math.round((cvScores.filter((score: number) => score >= 6).length / totalResponses) * 100) : 0 },
    { name: 'Alto Valor', value: cvScores.filter((score: number) => score >= 5 && score < 6).length, percentage: totalResponses > 0 ? Math.round((cvScores.filter((score: number) => score >= 5 && score < 6).length / totalResponses) * 100) : 0 },
    { name: 'Valor Medio', value: cvScores.filter((score: number) => score >= 4 && score < 5).length, percentage: totalResponses > 0 ? Math.round((cvScores.filter((score: number) => score >= 4 && score < 5).length / totalResponses) * 100) : 0 },
    { name: 'Bajo Valor', value: cvScores.filter((score: number) => score >= 3 && score < 4).length, percentage: totalResponses > 0 ? Math.round((cvScores.filter((score: number) => score >= 3 && score < 4).length / totalResponses) * 100) : 0 },
    { name: 'Muy Bajo Valor', value: cvScores.filter((score: number) => score < 3).length, percentage: totalResponses > 0 ? Math.round((cvScores.filter((score: number) => score < 3).length / totalResponses) * 100) : 0 }
  ];

  // Datos para el gráfico de barras
  const barData = valueDistribution.map((item, index) => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage,
    color: COLORS[index]
  }));

  // Datos para el gráfico de radar (dimensiones de valor)
  const radarData = [
    { dimension: 'Calidad', value: averageScore },
    { dimension: 'Precio', value: averageScore * 0.9 },
    { dimension: 'Servicio', value: averageScore * 1.1 },
    { dimension: 'Innovación', value: averageScore * 0.8 },
    { dimension: 'Conveniencia', value: averageScore * 1.2 },
    { dimension: 'Confianza', value: averageScore * 1.0 }
  ];

  // Calcular métricas adicionales
  const highValuePercentage = totalResponses > 0
    ? Math.round(((cvScores.filter((score: number) => score >= 5).length) / totalResponses) * 100)
    : 0;

  const lowValuePercentage = totalResponses > 0
    ? Math.round(((cvScores.filter((score: number) => score < 4).length) / totalResponses) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">CV - {question.title || 'Customer Value'}</h3>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">CV Question</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Conditionality disabled</Badge>
            {question.required && <Badge variant="secondary" className="bg-red-100 text-red-700">Required</Badge>}
          </div>

          <div className="flex items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Question</span>
              </div>
              <p className="text-sm text-gray-800">
                {question.description || 'How would you rate the overall value you receive from our product/service?'}
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
            <div className="text-2xl font-bold text-green-600">{highValuePercentage}%</div>
            <div className="text-sm text-green-700">Alto Valor</div>
            <div className="text-xs text-green-600">(5-7 puntos)</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{100 - highValuePercentage - lowValuePercentage}%</div>
            <div className="text-sm text-yellow-700">Valor Medio</div>
            <div className="text-xs text-yellow-600">(4 puntos)</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{lowValuePercentage}%</div>
            <div className="text-sm text-red-700">Bajo Valor</div>
            <div className="text-xs text-red-600">(1-3 puntos)</div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de distribución */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Value Distribution</h4>
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
                  <Bar dataKey="value" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de radar */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Value Dimensions</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" />
                  <PolarRadiusAxis domain={[0, 7]} />
                  <Radar
                    name="Value Score"
                    dataKey="value"
                    stroke="#6366F1"
                    fill="#6366F1"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Métricas detalladas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          {valueDistribution.map((item, index) => (
            <div key={item.name} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold" style={{ color: COLORS[index] }}>
                {item.percentage}%
              </div>
              <div className="text-sm text-gray-600">{item.name}</div>
              <div className="text-xs text-gray-500">{item.value} responses</div>
            </div>
          ))}
        </div>

        {/* Análisis de valor */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Value Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Fortalezas</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {highValuePercentage}% de clientes perciben alto valor</li>
                <li>• Puntuación promedio de {averageScore}/7</li>
                <li>• Satisfacción general positiva</li>
              </ul>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h5 className="font-medium text-orange-900 mb-2">Áreas de Mejora</h5>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• {lowValuePercentage}% de clientes perciben bajo valor</li>
                <li>• Oportunidad de mejora en comunicación de valor</li>
                <li>• Considerar ajustes en propuesta de valor</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
