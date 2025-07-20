'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface LinearScaleData {
  question: string;
  description?: string;
  scaleRange: { start: number; end: number };
  responses: { value: number; count: number }[];
  average: number;
  totalResponses: number;
  distribution: Record<number, number>;
  responseTime?: string;
}

interface LinearScaleResultsProps {
  data: LinearScaleData;
}

export function LinearScaleResults({ data }: LinearScaleResultsProps) {
  const { question, description, scaleRange, responses, average, totalResponses, distribution, responseTime } = data;

  // Preparar datos para el gráfico
  const chartData = Object.entries(distribution).map(([value, count]) => ({
    value: parseInt(value),
    count,
    percentage: Math.round((count / totalResponses) * 100)
  }));

  // Calcular estadísticas
  const maxValue = Math.max(...Object.values(distribution));
  const minValue = Math.min(...Object.values(distribution));
  const range = scaleRange.end - scaleRange.start + 1;

  return (
    <div className="p-6">
      {/* Información de la pregunta */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{question}</h3>
        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}

        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{average.toFixed(1)}</div>
            <div className="text-sm text-blue-600">Promedio</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalResponses}</div>
            <div className="text-sm text-green-600">Respuestas</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{range}</div>
            <div className="text-sm text-purple-600">Rango</div>
          </div>
          {responseTime && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{responseTime}</div>
              <div className="text-sm text-orange-600">Tiempo promedio</div>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de distribución */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Distribución de Respuestas</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="value"
                label={{ value: 'Valor de la Escala', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                label={{ value: 'Número de Respuestas', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} respuestas (${Math.round((value / totalResponses) * 100)}%)`,
                  'Respuestas'
                ]}
                labelFormatter={(label) => `Valor: ${label}`}
              />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de respuestas detalladas */}
      <div>
        <h4 className="text-md font-semibold text-gray-800 mb-4">Detalle de Respuestas</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Respuestas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Porcentaje
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barra
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chartData.map((item) => (
                <tr key={item.value} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {item.value}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.count}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.percentage}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Análisis de tendencias */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-2">Análisis de Tendencias</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• <strong>Rango de escala:</strong> {scaleRange.start} - {scaleRange.end}</p>
          <p>• <strong>Valor más frecuente:</strong> {chartData.find(item => item.count === maxValue)?.value}</p>
          <p>• <strong>Valor menos frecuente:</strong> {chartData.find(item => item.count === minValue)?.value}</p>
          <p>• <strong>Distribución:</strong> {average > (scaleRange.start + scaleRange.end) / 2 ? 'Tendencia positiva' : 'Tendencia negativa'}</p>
        </div>
      </div>
    </div>
  );
}
