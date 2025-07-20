'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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

interface NEVQuestionProps {
  question: SmartVOCQuestion;
  data: any;
  researchId: string;
}

const EMOTION_COLORS = {
  'Felicidad': '#10B981',
  'Sorpresa': '#F59E0B',
  'Tristeza': '#6B7280',
  'Enojo': '#EF4444',
  'Miedo': '#8B5CF6',
  'Disgusto': '#EC4899'
};

const EMOTION_EMOJIS = {
  'Felicidad': '😊',
  'Sorpresa': '😲',
  'Tristeza': '😢',
  'Enojo': '😠',
  'Miedo': '😨',
  'Disgusto': '🤢'
};

export function NEVQuestion({ question, data }: NEVQuestionProps) {
  // Debug: Log de datos recibidos
  console.log('[NEVQuestion] 🔍 Datos recibidos:', {
    question,
    data,
    nevScores: data?.nevScores,
    nevScoresLength: data?.nevScores?.length,
    totalDataKeys: data ? Object.keys(data) : []
  });

  // Procesar datos NEV
  const nevScores = data?.nevScores || [];
  const totalResponses = nevScores.length;

  // Debug: Log de procesamiento
  console.log('[NEVQuestion] 📊 Procesamiento de datos:', {
    nevScores,
    totalResponses,
    averageScore: totalResponses > 0
      ? Math.round((nevScores.reduce((a: number, b: number) => a + b, 0) / totalResponses) * 10) / 10
      : 0
  });

  // Si no hay datos reales, mostrar mensaje informativo
  if (totalResponses === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">NEV - {question.title || 'Net Emotional Value'}</h3>
              <Badge variant="secondary" className="bg-pink-100 text-pink-700">NEV Question</Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">Conditionality disabled</Badge>
              {question.required && <Badge variant="secondary" className="bg-red-100 text-red-700">Required</Badge>}
            </div>

            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">Question</span>
                </div>
                <p className="text-sm text-gray-800">
                  {question.description || 'How would you rate the emotional value you receive from our product/service?'}
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
    ? Math.round((nevScores.reduce((a: number, b: number) => a + b, 0) / totalResponses) * 10) / 10
    : 0;

  // Distribución de emociones (simulado - en un caso real vendría de la API)
  const emotionDistribution = [
    { name: 'Felicidad', value: Math.round(totalResponses * 0.35), percentage: 35, color: EMOTION_COLORS['Felicidad'] },
    { name: 'Sorpresa', value: Math.round(totalResponses * 0.20), percentage: 20, color: EMOTION_COLORS['Sorpresa'] },
    { name: 'Tristeza', value: Math.round(totalResponses * 0.15), percentage: 15, color: EMOTION_COLORS['Tristeza'] },
    { name: 'Enojo', value: Math.round(totalResponses * 0.10), percentage: 10, color: EMOTION_COLORS['Enojo'] },
    { name: 'Miedo', value: Math.round(totalResponses * 0.12), percentage: 12, color: EMOTION_COLORS['Miedo'] },
    { name: 'Disgusto', value: Math.round(totalResponses * 0.08), percentage: 8, color: EMOTION_COLORS['Disgusto'] }
  ];

  // Datos para el gráfico de barras
  const barData = emotionDistribution.map((item) => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage,
    color: item.color,
    emoji: EMOTION_EMOJIS[item.name as keyof typeof EMOTION_EMOJIS]
  }));

  // Datos para el gráfico circular
  const pieData = emotionDistribution.filter(item => item.value > 0);

  // Datos para el gráfico de línea (tendencia temporal)
  const timeSeriesData = data?.timeSeriesData || [];
  const lineData = timeSeriesData.map((item: any) => ({
    date: item.date,
    nev: item.nev || averageScore
  }));

  // Calcular métricas adicionales
  const positiveEmotionsPercentage = emotionDistribution
    .filter(item => ['Felicidad', 'Sorpresa'].includes(item.name))
    .reduce((sum, item) => sum + item.percentage, 0);

  const negativeEmotionsPercentage = emotionDistribution
    .filter(item => ['Tristeza', 'Enojo', 'Miedo', 'Disgusto'].includes(item.name))
    .reduce((sum, item) => sum + item.percentage, 0);

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">NEV - {question.title || 'Net Emotional Value'}</h3>
            <Badge variant="secondary" className="bg-pink-100 text-pink-700">NEV Question</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">Conditionality disabled</Badge>
            {question.required && <Badge variant="secondary" className="bg-red-100 text-red-700">Required</Badge>}
          </div>

          <div className="flex items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Question</span>
              </div>
              <p className="text-sm text-gray-800">
                {question.description || 'How do you feel about your experience with our service?'}
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
                  <span className="text-sm font-medium">{averageScore}/10</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{positiveEmotionsPercentage}%</div>
            <div className="text-sm text-green-700">Emociones Positivas</div>
            <div className="text-xs text-green-600">Felicidad, Sorpresa</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{100 - positiveEmotionsPercentage - negativeEmotionsPercentage}%</div>
            <div className="text-sm text-yellow-700">Emociones Neutrales</div>
            <div className="text-xs text-yellow-600">Mixtas</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{negativeEmotionsPercentage}%</div>
            <div className="text-sm text-red-700">Emociones Negativas</div>
            <div className="text-xs text-red-600">Tristeza, Enojo, Miedo</div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de barras con emojis */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Emotion Distribution</h4>
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
                  <Bar dataKey="value" fill="#EC4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico circular */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Emotion Breakdown</h4>
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
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Métricas detalladas con emojis */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          {emotionDistribution.map((item) => (
            <div key={item.name} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">
                {EMOTION_EMOJIS[item.name as keyof typeof EMOTION_EMOJIS]}
              </div>
              <div className="text-2xl font-bold" style={{ color: item.color }}>
                {item.percentage}%
              </div>
              <div className="text-sm text-gray-600">{item.name}</div>
              <div className="text-xs text-gray-500">{item.value} responses</div>
            </div>
          ))}
        </div>

        {/* Gráfico de tendencia temporal */}
        {lineData.length > 1 && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">NEV Trend Over Time</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="nev" stroke="#EC4899" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Análisis emocional */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Emotional Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h5 className="font-medium text-green-900 mb-2">Emociones Positivas</h5>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• {positiveEmotionsPercentage}% de respuestas positivas</li>
                <li>• Felicidad dominante ({emotionDistribution.find(e => e.name === 'Felicidad')?.percentage}%)</li>
                <li>• Experiencia emocional satisfactoria</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h5 className="font-medium text-red-900 mb-2">Emociones Negativas</h5>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• {negativeEmotionsPercentage}% de respuestas negativas</li>
                <li>• Oportunidad de mejora en experiencia</li>
                <li>• Considerar factores que generan emociones negativas</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
