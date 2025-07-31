'use client';

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface PreferenceTestData {
  question: string;
  description?: string;
  options: {
    id: string;
    name: string;
    image?: string;
    selected: number;
    percentage: number;
    color?: string;
  }[];
  totalSelections: number;
  totalParticipants: number;
  responseTime?: string;
  preferenceAnalysis?: string;
  mostPreferred?: string;
  leastPreferred?: string;
}

interface PreferenceTestResultsProps {
  data: PreferenceTestData;
}

export function PreferenceTestResults({ data }: PreferenceTestResultsProps) {
  // Verificar que los datos sean válidos
  if (!data || !data.options || !Array.isArray(data.options)) {
    console.error('[PreferenceTestResults] ❌ Datos inválidos:', data);
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No hay datos de preferencias disponibles.</p>
      </div>
    );
  }

  // Función para extraer el nombre de la opción de manera segura
  const extractOptionName = (option: any): string => {
    if (typeof option.name === 'string') {
      return option.name;
    } else if (typeof option.name === 'object' && option.name !== null) {
      return option.name.name ||
        option.name.text ||
        option.name.label ||
        option.name.value ||
        option.name.title ||
        JSON.stringify(option.name);
    } else {
      return String(option.name || 'Opción sin nombre');
    }
  };

  const {
    question,
    description,
    options,
    totalSelections,
    totalParticipants,
    responseTime,
    preferenceAnalysis,
  } = data;

  // Preparar datos para gráficos
  const barChartData = options.map(option => ({
    name: extractOptionName(option),
    selections: option.selected,
    percentage: option.percentage,
    color: option.color || '#3B82F6'
  }));

  const pieChartData = options.map(option => ({
    name: extractOptionName(option),
    value: option.selected,
    percentage: option.percentage,
    color: option.color || '#3B82F6'
  }));

  // Colores para el gráfico de pie
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Encontrar opciones más y menos preferidas
  const sortedOptions = [...options].filter(opt => opt && opt.name).sort((a, b) => b.selected - a.selected);
  const topPreferred = sortedOptions[0];
  const leastPreferredOption = sortedOptions[sortedOptions.length - 1];

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
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{totalSelections}</div>
            <div className="text-sm text-purple-600">Selecciones</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalParticipants}</div>
            <div className="text-sm text-green-600">Participantes</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{options.length}</div>
            <div className="text-sm text-blue-600">Opciones</div>
          </div>
          {responseTime && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{responseTime}</div>
              <div className="text-sm text-orange-600">Tiempo promedio</div>
            </div>
          )}
        </div>

        {/* Preferencia más alta */}
        {topPreferred && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-md font-semibold text-green-800 mb-2">Opción Más Preferida</h4>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-green-200 flex items-center justify-center">
                {topPreferred.image ? (
                  <img
                    src={topPreferred.image}
                    alt={extractOptionName(topPreferred)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-xs">
                      {extractOptionName(topPreferred).charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <div className="text-lg font-semibold text-green-900">{extractOptionName(topPreferred)}</div>
                <div className="text-sm text-green-700">
                  {topPreferred.selected} selecciones ({topPreferred.percentage}%)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de barras */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Distribución de Preferencias</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  label={{ value: 'Opciones', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Número de Selecciones', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} selecciones (${Math.round((value / totalSelections) * 100)}%)`,
                    'Selecciones'
                  ]}
                  labelFormatter={(label) => `Opción: ${label}`}
                />
                <Bar dataKey="selections" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de pie */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Distribución Porcentual</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabla de opciones detalladas */}
      <div>
        <h4 className="text-md font-semibold text-gray-800 mb-4">Detalle de Preferencias</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imagen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selecciones
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
              {options.map((option, index) => (
                <tr key={option.id || `option-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {extractOptionName(option)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                      {option.image ? (
                        <img
                          src={option.image}
                          alt={extractOptionName(option)}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-semibold text-xs">
                            {extractOptionName(option).charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {option.selected}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {option.percentage}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${option.percentage}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Análisis de preferencias */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-2">Análisis de Preferencias</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• <strong>Opción más preferida:</strong> {topPreferred ? extractOptionName(topPreferred) : 'N/A'} ({topPreferred?.percentage || 0}%)</p>
          <p>• <strong>Opción menos preferida:</strong> {leastPreferredOption ? extractOptionName(leastPreferredOption) : 'N/A'} ({leastPreferredOption?.percentage || 0}%)</p>
          <p>• <strong>Total de selecciones:</strong> {totalSelections}</p>
          <p>• <strong>Participantes:</strong> {totalParticipants}</p>
          {preferenceAnalysis && (
            <p>• <strong>Análisis:</strong> {preferenceAnalysis}</p>
          )}
        </div>
      </div>

      {/* Comparación visual de opciones */}
      {options.some(opt => opt.image) && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Comparación Visual</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {options.map((option, index) => (
              <div key={option.id || `option-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 mb-3 flex items-center justify-center">
                  {option.image ? (
                    <img
                      src={option.image}
                      alt={extractOptionName(option)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold text-lg">
                        {extractOptionName(option).charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">{extractOptionName(option)}</div>
                <div className="text-xs text-gray-600">{option.selected} selecciones</div>
                <div className="text-xs text-purple-600 font-medium">{option.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
